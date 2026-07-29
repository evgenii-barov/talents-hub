"use client";

import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  ClipboardList,
  LoaderCircle,
  MessagesSquare,
} from "lucide-react";

import { useLocale } from "@/components/i18n/locale-provider";
import {
  getChatWebSocketUrl,
  getConversations,
  type ChatRealtimeEvent,
} from "@/lib/chat";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

const refreshIntervalMs = 30_000;

function payloadText(
  payload: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function countLabel(count: number): string {
  return count > 99 ? "99+" : String(count);
}

export function HeaderActivity() {
  const { formatDate, localize, t, tr } = useLocale();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [chatUnread, setChatUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [readingAll, setReadingAll] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const panelId = useId();
  const headingId = useId();

  const activityNotifications = notifications.filter(
    (notification) => notification.type !== "chat.message",
  );
  const unreadNotifications = activityNotifications.filter(
    (notification) => notification.read_at === null,
  ).length;

  const loadNotificationActivity = useCallback(async () => {
    try {
      setNotifications(await getNotifications());
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadChatActivity = useCallback(async () => {
    try {
      const conversations = await getConversations();
      setChatUnread(
        conversations.reduce(
          (total, conversation) => total + conversation.unread_count,
          0,
        ),
      );
    } catch {
      // Keep the last known count while a background refresh is unavailable.
    }
  }, []);

  const refreshActivity = useCallback(() => {
    void loadNotificationActivity();
    void loadChatActivity();
  }, [loadChatActivity, loadNotificationActivity]);

  useEffect(() => {
    refreshActivity();
    const timer = window.setInterval(refreshActivity, refreshIntervalMs);
    const refreshOnFocus = () => refreshActivity();
    window.addEventListener("focus", refreshOnFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [refreshActivity]);

  useEffect(() => {
    let stopped = false;
    let reconnectTimer: number | undefined;
    let socket: WebSocket | undefined;
    let reconnectAttempts = 0;

    function connect() {
      socket = new WebSocket(getChatWebSocketUrl());
      socket.onopen = () => {
        reconnectAttempts = 0;
        void loadChatActivity();
      };
      socket.onmessage = (event) => {
        let realtimeEvent: ChatRealtimeEvent;
        try {
          realtimeEvent = JSON.parse(event.data) as ChatRealtimeEvent;
        } catch {
          return;
        }
        if (
          realtimeEvent.type === "chat.message.created" ||
          realtimeEvent.type === "chat.conversation.read"
        ) {
          void loadChatActivity();
        }
      };
      socket.onclose = (event) => {
        if (stopped || event.code === 4401) return;
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 10_000);
        reconnectAttempts += 1;
        reconnectTimer = window.setTimeout(connect, delay);
      };
    }

    connect();
    return () => {
      stopped = true;
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [loadChatActivity]);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }

    function closeOnOutsideFocus(event: FocusEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", closeOnOutsideFocus);
    window.requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("a[href], button:not(:disabled)")
        ?.focus();
    });
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", closeOnOutsideFocus);
    };
  }, [open]);

  async function readNotification(notificationId: string) {
    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read_at: readAt }
          : notification,
      ),
    );
    try {
      await markNotificationRead(notificationId);
    } catch {
      void loadNotificationActivity();
    }
  }

  async function readAllNotifications() {
    if (!unreadNotifications || readingAll) return;
    const readAt = new Date().toISOString();
    setReadingAll(true);
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read_at: readAt })),
    );
    try {
      await markAllNotificationsRead();
    } catch {
      await loadNotificationActivity();
    } finally {
      setReadingAll(false);
    }
  }

  function statusLabel(status: string | undefined): string {
    const labels: Record<string, { en: string; ru: string; "zh-Hans": string }> = {
      submitted: { en: "submitted", ru: "отправлен", "zh-Hans": "已提交" },
      in_review: { en: "in review", ru: "на рассмотрении", "zh-Hans": "审核中" },
      shortlisted: { en: "shortlisted", ru: "в шорт-листе", "zh-Hans": "已入围" },
      accepted: { en: "accepted", ru: "принят", "zh-Hans": "已接受" },
      rejected: { en: "rejected", ru: "отклонён", "zh-Hans": "已拒绝" },
      withdrawn: { en: "withdrawn", ru: "отозван", "zh-Hans": "已撤回" },
      cancelled: { en: "cancelled", ru: "отменён", "zh-Hans": "已取消" },
    };
    return status && labels[status]
      ? localize(labels[status])
      : tr({ en: "updated", ru: "обновлён", "zh-Hans": "已更新" });
  }

  function notificationPresentation(notification: NotificationItem): {
    title: string;
    body: string;
    href: Route | null;
  } {
    const project = payloadText(notification.payload, "project_title");
    const role = payloadText(notification.payload, "role_title");
    if (
      notification.type === "application_submitted" ||
      notification.type === "application.submitted"
    ) {
      const applicant =
        payloadText(notification.payload, "applicant_name") ??
        tr({ en: "A candidate", ru: "Кандидат", "zh-Hans": "候选人" });
      return {
        title: tr({ en: "New application", ru: "Новый отклик", "zh-Hans": "新申请" }),
        body:
          payloadText(notification.payload, "message") ??
          tr({
            en: `${applicant} applied${role ? ` for ${role}` : ""}${project ? ` in ${project}` : ""}.`,
            ru: `${applicant} откликнулся${role ? ` на роль «${role}»` : ""}${project ? ` в проекте «${project}»` : ""}.`,
            "zh-Hans": `${applicant}${role ? `申请了“${role}”角色` : "提交了申请"}${project ? `（${project}）` : ""}。`,
          }),
        href: "/applications",
      };
    }
    if (
      notification.type === "application_status_changed" ||
      notification.type === "application.status_changed"
    ) {
      const status = statusLabel(payloadText(notification.payload, "status"));
      return {
        title: tr({
          en: "Application updated",
          ru: "Статус отклика изменён",
          "zh-Hans": "申请状态已更新",
        }),
        body: tr({
          en: `Your application${project ? ` to ${project}` : ""} is now ${status}.`,
          ru: `Ваш отклик${project ? ` в проект «${project}»` : ""}: ${status}.`,
          "zh-Hans": `您的申请${project ? `（${project}）` : ""}${status}。`,
        }),
        href: "/applications",
      };
    }
    if (notification.type === "moderation.decision") {
      return {
        title: tr({
          en: "Moderation decision",
          ru: "Решение модерации",
          "zh-Hans": "审核决定",
        }),
        body: tr({
          en: "The moderation status of your publication has changed.",
          ru: "Статус модерации вашей публикации изменён.",
          "zh-Hans": "您的发布内容审核状态已更改。",
        }),
        href: "/profile",
      };
    }
    return {
      title: t("notifications"),
      body:
        payloadText(notification.payload, "message") ??
        tr({
          en: "There is an update in your account.",
          ru: "В вашем аккаунте есть обновление.",
          "zh-Hans": "您的账户有新动态。",
        }),
      href: null,
    };
  }

  const chatAccessibleLabel = chatUnread
    ? tr({
        en: `${t("chat")}: ${chatUnread} unread messages`,
        ru: `${t("chat")}: непрочитанных сообщений — ${chatUnread}`,
        "zh-Hans": `${t("chat")}：${chatUnread} 条未读消息`,
      })
    : t("chat");
  const notificationsAccessibleLabel = unreadNotifications
    ? tr({
        en: `${t("notifications")}: ${unreadNotifications} unread`,
        ru: `${t("notifications")}: непрочитанных — ${unreadNotifications}`,
        "zh-Hans": `${t("notifications")}：${unreadNotifications} 条未读`,
      })
    : t("notifications");

  return (
    <>
      <Link
        href="/chat"
        aria-label={chatAccessibleLabel}
        className="relative hidden h-9 items-center gap-1.5 rounded-[7px] bg-neutral-100 px-2.5 font-inter text-[13px] font-bold text-[var(--color-ink)] transition-colors motion-reduce:transition-none hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 md:flex"
      >
        <MessagesSquare aria-hidden="true" size={16} />
        {t("chat")}
        {chatUnread ? (
          <span
            aria-hidden="true"
            className="absolute -right-1.5 -top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 font-inter text-[10px] font-bold leading-[18px] text-white ring-2 ring-white"
          >
            {countLabel(chatUnread)}
          </span>
        ) : null}
      </Link>

      <div ref={rootRef} className="relative hidden md:block">
        <button
          ref={triggerRef}
          type="button"
          aria-label={notificationsAccessibleLabel}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => {
            setOpen((current) => !current);
            if (!open) void loadNotificationActivity();
          }}
          className={cn(
            "relative flex size-9 items-center justify-center rounded-[7px] bg-neutral-100 text-[var(--color-ink)] transition-colors motion-reduce:transition-none hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
            open && "bg-neutral-200",
          )}
        >
          <Bell aria-hidden="true" size={16} />
          {unreadNotifications ? (
            <span
              aria-hidden="true"
              className="absolute -right-1.5 -top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 font-inter text-[10px] font-bold leading-[18px] text-white ring-2 ring-white"
            >
              {countLabel(unreadNotifications)}
            </span>
          ) : null}
        </button>

        {open ? (
          <section
            ref={panelRef}
            id={panelId}
            aria-labelledby={headingId}
            aria-busy={readingAll || undefined}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(400px,calc(100vw-2rem))] overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-white shadow-[0_18px_48px_rgba(16,27,56,0.18)]"
          >
            <div className="flex min-h-14 items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
              <div>
                <h2
                  id={headingId}
                  className="font-geist text-base font-[650] text-[var(--color-ink)]"
                >
                  {t("notifications")}
                </h2>
                <p className="mt-0.5 font-inter text-[11px] text-[var(--color-muted)]">
                  {unreadNotifications
                    ? tr({
                        en: `${unreadNotifications} unread`,
                        ru: `Непрочитанных: ${unreadNotifications}`,
                        "zh-Hans": `${unreadNotifications} 条未读`,
                      })
                    : tr({ en: "All caught up", ru: "Всё прочитано", "zh-Hans": "已全部读完" })}
                </p>
              </div>
              {unreadNotifications ? (
                <button
                  type="button"
                  disabled={readingAll}
                  onClick={() => void readAllNotifications()}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 font-inter text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-soft-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-60"
                >
                  {readingAll ? (
                    <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" size={14} />
                  ) : (
                    <CheckCheck aria-hidden="true" size={14} />
                  )}
                  {tr({ en: "Mark all read", ru: "Прочитать все", "zh-Hans": "全部标为已读" })}
                </button>
              ) : null}
            </div>

            <div className="max-h-[min(520px,calc(100vh-120px))] overflow-y-auto" aria-live="polite">
              {loading ? (
                <div role="status" className="flex min-h-40 items-center justify-center gap-2 px-5 font-inter text-sm text-[var(--color-muted)]">
                  <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" size={17} />
                  {tr({ en: "Loading notifications…", ru: "Загружаем уведомления…", "zh-Hans": "正在加载通知…" })}
                </div>
              ) : loadFailed ? (
                <div className="p-5 text-center">
                  <p className="font-inter text-sm text-[var(--color-muted)]">
                    {tr({ en: "Could not load notifications.", ru: "Не удалось загрузить уведомления.", "zh-Hans": "无法加载通知。" })}
                  </p>
                  <button
                    type="button"
                    onClick={() => void loadNotificationActivity()}
                    className="mt-3 rounded-md px-3 py-2 font-inter text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-soft-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  >
                    {tr({ en: "Try again", ru: "Повторить", "zh-Hans": "重试" })}
                  </button>
                </div>
              ) : activityNotifications.length ? (
                <ul className="divide-y divide-[var(--color-border)]">
                  {activityNotifications.slice(0, 30).map((notification) => {
                    const presentation = notificationPresentation(notification);
                    const content = (
                      <>
                        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-soft-blue)] text-[var(--color-primary)]">
                          <ClipboardList aria-hidden="true" size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-3">
                            <span className="font-inter text-[13px] font-bold text-[var(--color-ink)]">
                              {presentation.title}
                            </span>
                            {notification.read_at === null ? (
                              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-red-600" aria-hidden="true" />
                            ) : null}
                          </span>
                          <span className="mt-1 block font-inter text-xs leading-[1.45] text-[var(--color-muted)]">
                            {presentation.body}
                          </span>
                          <time
                            dateTime={notification.created_at}
                            className="mt-2 block font-inter text-[10px] text-[var(--color-muted)]"
                          >
                            {formatDate(notification.created_at, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </time>
                        </span>
                      </>
                    );
                    return (
                      <li key={notification.id}>
                        {presentation.href ? (
                          <Link
                            href={presentation.href}
                            onClick={() => {
                              setOpen(false);
                              if (notification.read_at === null)
                                void readNotification(notification.id);
                            }}
                            className={cn(
                              "flex gap-3 px-4 py-3.5 transition-colors motion-reduce:transition-none hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]",
                              notification.read_at === null && "bg-blue-50/45",
                            )}
                          >
                            {content}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void readNotification(notification.id)}
                            className={cn(
                              "flex w-full gap-3 px-4 py-3.5 text-left transition-colors motion-reduce:transition-none hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]",
                              notification.read_at === null && "bg-blue-50/45",
                            )}
                          >
                            {content}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex min-h-44 flex-col items-center justify-center px-6 text-center">
                  <span className="flex size-11 items-center justify-center rounded-full bg-neutral-100 text-[var(--color-muted)]">
                    <Bell aria-hidden="true" size={19} />
                  </span>
                  <p className="mt-3 font-inter text-sm font-semibold text-[var(--color-ink)]">
                    {tr({ en: "No notifications yet", ru: "Уведомлений пока нет", "zh-Hans": "暂无通知" })}
                  </p>
                  <p className="mt-1 font-inter text-xs text-[var(--color-muted)]">
                    {tr({ en: "Updates about applications and moderation will appear here.", ru: "Здесь появятся обновления об откликах и модерации.", "zh-Hans": "申请和审核动态将显示在这里。" })}
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {unreadNotifications || chatUnread
          ? `${notificationsAccessibleLabel}. ${chatAccessibleLabel}.`
          : null}
      </span>
    </>
  );
}
