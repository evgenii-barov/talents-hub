"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  GripVertical,
  Info,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  Search,
  Send,
  UserRound,
  UsersRound,
} from "lucide-react";

import { useLocale } from "@/components/i18n/locale-provider";
import { ApiError } from "@/lib/api";
import { trackAnalytics } from "@/lib/analytics";
import { resolveMediaUrl } from "@/lib/media";
import {
  type ChatMessage,
  type ChatRealtimeEvent,
  type Conversation,
  createConversation,
  getChatWebSocketUrl,
  getConversationMessages,
  getConversations,
  markConversationRead,
  sendChatMessage,
  sendRealtimeChatMessage,
  sendRealtimeReadReceipt,
} from "@/lib/chat";
import {
  conversationInputFor,
  type NewConversationTarget,
  resolveConversationSelection,
} from "@/lib/chat-selection";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(value: string | null, locale: string): string {
  return value
    ? new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "";
}

function Avatar({
  initials: value,
  src,
  alt,
  size = "size-11",
}: {
  initials: string;
  src?: string | null;
  alt?: string;
  size?: string;
}) {
  const imageUrl = resolveMediaUrl(src);
  return (
    <span
      className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)] font-geist text-xs font-bold text-white`}
    >
      {imageUrl ? (
        // Chat avatars can be served by the configured backend media storage.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="size-full object-cover" src={imageUrl} alt={alt || value} />
      ) : (
        value
      )}
    </span>
  );
}

function avatarForConversation(conversation: Conversation): {
  name: string;
  url: string | null;
} {
  const visibleParticipants = conversation.participants.filter(
    (participant) => !participant.is_self,
  );
  const participant =
    conversation.kind === "organization"
      ? visibleParticipants.find((item) => item.kind === "organization")
      : conversation.kind === "direct"
        ? visibleParticipants[0]
        : undefined;
  return {
    name:
      participant?.display_name ||
      conversation.last_message?.sender_name ||
      conversation.subject,
    url:
      participant?.avatar_url ||
      conversation.last_message?.sender_avatar_url ||
      null,
  };
}

function ResizeHandle({
  value,
  min,
  max,
  direction,
  label,
  className,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  direction: 1 | -1;
  label: string;
  className: string;
  onChange: (value: number) => void;
}) {
  const clamp = (nextValue: number) => Math.min(max, Math.max(min, nextValue));

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.focus();
    event.preventDefault();
    const startX = event.clientX;
    const startValue = value;
    const handlePointerMove = (moveEvent: PointerEvent) => {
      onChange(clamp(startValue + (moveEvent.clientX - startX) * direction));
    };
    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const physicalDirection = event.key === "ArrowRight" ? 1 : -1;
    onChange(clamp(value + physicalDirection * direction * 16));
  }

  return (
    <div
      role="separator"
      aria-label={label}
      aria-orientation="vertical"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      className={`${className} group relative w-2 shrink-0 cursor-col-resize touch-none items-center justify-center bg-white outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]`}
    >
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--color-border)] group-hover:bg-[var(--color-primary)]" />
      <GripVertical
        aria-hidden="true"
        className="relative rounded bg-white text-[var(--color-muted)] group-hover:text-[var(--color-primary)]"
        size={12}
      />
    </div>
  );
}

function titleFor(conversation: Conversation, fallback: string): string {
  return (
    conversation.subject ||
    conversation.participants
      .filter((participant) => !participant.is_self)
      .map((participant) => participant.display_name)
      .join(", ") ||
    fallback
  );
}

function subtitleFor(
  conversation: Conversation,
  directLabel: string,
  organizationLabel: string,
  groupLabel: string,
): string {
  if (conversation.project?.title) return conversation.project.title;
  if (conversation.kind === "organization") {
    return (
      conversation.participants.find(
        (participant) => participant.kind === "organization" && !participant.is_self,
      )?.display_name || organizationLabel
    );
  }
  if (conversation.kind === "group") {
    return `${groupLabel} · ${conversation.participants.length}`;
  }
  return directLabel;
}

function addMessage(
  messages: ChatMessage[],
  message: ChatMessage,
): ChatMessage[] {
  if (messages.some((current) => current.id === message.id)) return messages;
  return [...messages, message].sort((left, right) =>
    left.created_at.localeCompare(right.created_at),
  );
}

function ChatClient() {
  const { locale, tr } = useLocale();
  const searchParams = useSearchParams();
  const requestedRecipientId = searchParams.get("recipient");
  const requestedOrganizationId = searchParams.get("organization");
  const requestedProjectId = searchParams.get("project");
  const requestedProjectTitle = searchParams.get("projectName") || undefined;
  const requestedRecipientName =
    searchParams.get("name") || tr("New conversation", "Новый диалог");
  const requestedTarget = useMemo<NewConversationTarget | undefined>(() => {
    if (requestedOrganizationId) {
      return {
        kind: "organization",
        id: requestedOrganizationId,
        name: requestedRecipientName,
        projectId: requestedProjectId || undefined,
        projectTitle: requestedProjectTitle,
      };
    }
    if (requestedRecipientId) {
      return {
        kind: "talent",
        id: requestedRecipientId,
        name: requestedRecipientName,
        projectId: requestedProjectId || undefined,
        projectTitle: requestedProjectTitle,
      };
    }
    return undefined;
  }, [
    requestedOrganizationId,
    requestedProjectId,
    requestedProjectTitle,
    requestedRecipientId,
    requestedRecipientName,
  ]);
  const socketRef = useRef<WebSocket | null>(null);
  const activeIdRef = useRef<string | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [senderOrganizationId, setSenderOrganizationId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [error, setError] = useState("");
  const [leftPaneWidth, setLeftPaneWidth] = useState(360);
  const [leftPaneCollapsed, setLeftPaneCollapsed] = useState(false);
  const [rightPaneWidth, setRightPaneWidth] = useState(380);
  const [rightPaneCollapsed, setRightPaneCollapsed] = useState(false);
  const [newRecipient, setNewRecipient] =
    useState<NewConversationTarget>();

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const loadConversations = useCallback(async () => {
    try {
      const nextConversations = await getConversations();
      const selection = resolveConversationSelection(
        nextConversations,
        activeIdRef.current,
        requestedTarget,
      );
      setConversations(nextConversations);
      setActiveId(selection.activeId);
      setNewRecipient(selection.newRecipient);
      setError("");
    } catch (nextError) {
      setError(
        nextError instanceof ApiError && nextError.status === 403
          ? tr(
              "Sign in to use messages.",
              "Войдите, чтобы пользоваться сообщениями.",
            )
          : tr(
              "Could not load conversations.",
              "Не удалось загрузить диалоги.",
            ),
      );
    } finally {
      setLoading(false);
    }
  }, [requestedTarget, tr]);

  const markActiveConversationRead = useCallback((conversationId: string) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      sendRealtimeReadReceipt(socket, conversationId);
      return Promise.resolve();
    }
    return markConversationRead(conversationId);
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    let closedByComponent = false;
    let reconnectTimer: number | undefined;

    function connect(): void {
      const socket = new WebSocket(getChatWebSocketUrl());
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setRealtimeConnected(true);
        void loadConversations();
        if (activeIdRef.current) {
          void getConversationMessages(activeIdRef.current)
            .then(setMessages)
            .catch(() => undefined);
        }
      };
      socket.onmessage = (event) => {
        let realtimeEvent: ChatRealtimeEvent;
        try {
          realtimeEvent = JSON.parse(event.data) as ChatRealtimeEvent;
        } catch {
          return;
        }
        if (realtimeEvent.type === "chat.message.created") {
          if (activeIdRef.current === realtimeEvent.conversation_id) {
            setMessages((current) =>
              addMessage(current, realtimeEvent.message),
            );
            if (!realtimeEvent.message.is_self)
              void markActiveConversationRead(realtimeEvent.conversation_id);
          }
          void loadConversations();
          return;
        }
        if (realtimeEvent.type === "chat.conversation.read") {
          void loadConversations();
          return;
        }
        if (realtimeEvent.type === "chat.error") setError(realtimeEvent.detail);
      };
      socket.onclose = (event) => {
        setRealtimeConnected(false);
        if (closedByComponent || event.code === 4401) return;
        const delay = Math.min(
          1000 * 2 ** reconnectAttemptsRef.current,
          10_000,
        );
        reconnectAttemptsRef.current += 1;
        reconnectTimer = window.setTimeout(connect, delay);
      };
    }

    connect();
    return () => {
      closedByComponent = true;
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [loadConversations, markActiveConversationRead]);

  useEffect(() => {
    if (realtimeConnected) return;
    const timer = window.setInterval(() => void loadConversations(), 10_000);
    return () => window.clearInterval(timer);
  }, [loadConversations, realtimeConnected]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    void getConversationMessages(activeId)
      .then((nextMessages) => {
        setMessages(nextMessages);
        return markActiveConversationRead(activeId);
      })
      .catch(() =>
        setError(
          tr("Could not load messages.", "Не удалось загрузить сообщения."),
        ),
      );
  }, [activeId, markActiveConversationRead, tr]);

  useEffect(() => {
    if (!activeId || realtimeConnected) return;
    const timer = window.setInterval(() => {
      void getConversationMessages(activeId)
        .then(setMessages)
        .catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [activeId, realtimeConnected]);

  const active = conversations.find(
    (conversation) => conversation.id === activeId,
  );
  const visibleConversations = useMemo(
    () =>
      conversations.filter(
        (conversation) =>
          titleFor(conversation, tr("Conversation", "Диалог"))
            .toLowerCase()
            .includes(query.toLowerCase()) ||
          conversation.last_message?.body
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [conversations, query, tr],
  );
  const activeTitle = active
    ? titleFor(active, tr("Conversation", "Диалог"))
    : newRecipient?.name || tr("Messages", "Сообщения");
  const activeSubtitle = active
    ? subtitleFor(
        active,
        tr("Direct conversation", "Личный диалог"),
        tr("Organization conversation", "Диалог с организацией"),
        tr("Group conversation", "Беседа"),
      )
    : newRecipient
      ? newRecipient.projectTitle ||
        (newRecipient.kind === "organization"
          ? tr("Organization conversation", "Диалог с организацией")
          : tr("Start a private conversation", "Начните личный диалог"))
      : "";
  const activeConversationAvatar = active
    ? avatarForConversation(active)
    : { name: activeTitle, url: null };
  const senderOrganizations =
    active?.participants.filter(
      (participant) => participant.kind === "organization" && participant.is_self,
    ) || [];
  const visibleParticipants =
    active?.participants.filter((participant) => !participant.is_self) || [];
  const primaryOrganization = visibleParticipants.find(
    (participant) => participant.kind === "organization",
  );

  useEffect(() => {
    setSenderOrganizationId("");
  }, [activeId]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError("");
    try {
      const socket = socketRef.current;
      if (activeId && socket?.readyState === WebSocket.OPEN) {
        sendRealtimeChatMessage(
          socket,
          activeId,
          body,
          senderOrganizationId || undefined,
        );
      } else if (activeId) {
        const message = await sendChatMessage(
          activeId,
          body,
          senderOrganizationId || undefined,
        );
        setMessages((current) => addMessage(current, message));
        await loadConversations();
      } else if (newRecipient) {
        const conversation = await createConversation(
          conversationInputFor(newRecipient, body),
        );
        trackAnalytics("conversation created", {
          kind: conversation.kind,
          project_context: Boolean(conversation.project),
        });
        setConversations((current) => [
          conversation,
          ...current.filter((item) => item.id !== conversation.id),
        ]);
        setMessages(
          conversation.last_message ? [conversation.last_message] : [],
        );
        setActiveId(conversation.id);
        setNewRecipient(undefined);
        await loadConversations();
      } else {
        return;
      }
      setDraft("");
    } catch (nextError) {
      setError(
        nextError instanceof ApiError
          ? nextError.message
          : tr(
              "Could not send the message.",
              "Не удалось отправить сообщение.",
            ),
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-72px)] min-h-0 flex-col overflow-hidden bg-[var(--color-background)]">
      <main className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          style={{ width: leftPaneCollapsed ? 72 : leftPaneWidth }}
          className={`hidden shrink-0 flex-col overflow-hidden bg-white lg:flex ${
            leftPaneCollapsed ? "p-2" : "p-3"
          }`}
        >
          {leftPaneCollapsed ? (
            <button
              type="button"
              onClick={() => setLeftPaneCollapsed(false)}
              aria-label={tr("Expand conversations", "Развернуть список диалогов")}
              title={tr("Expand conversations", "Развернуть список диалогов")}
              className="mx-auto flex size-10 shrink-0 items-center justify-center rounded-md text-[var(--color-muted)] hover:bg-neutral-100 hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
            >
              <PanelLeftOpen aria-hidden="true" size={18} />
            </button>
          ) : (
            <>
              <div className="flex shrink-0 items-center justify-between gap-3 px-2.5 pt-1.5">
                <h1 className="truncate font-geist text-[22px] font-[650] text-[var(--color-ink)]">
                  {tr("Messages", "Сообщения")}
                </h1>
                <button
                  type="button"
                  onClick={() => setLeftPaneCollapsed(true)}
                  aria-label={tr("Collapse conversations", "Свернуть список диалогов")}
                  title={tr("Collapse conversations", "Свернуть список диалогов")}
                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-[var(--color-muted)] hover:bg-neutral-100 hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                >
                  <PanelLeftClose aria-hidden="true" size={18} />
                </button>
              </div>
              <label className="relative mt-4 block shrink-0">
                <Search
                  className="absolute left-3 top-3 text-[var(--color-muted)]"
                  size={16}
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label={tr("Search messages", "Поиск сообщений")}
                  className="h-10 w-full rounded-[7px] bg-neutral-100 pl-[38px] pr-3 font-inter text-[13px] outline-none placeholder:text-[var(--color-muted)] focus:ring-2 focus:ring-blue-100"
                  placeholder={tr("Search messages", "Поиск сообщений")}
                />
              </label>
            </>
          )}
          <div
            className={`${leftPaneCollapsed ? "mt-3" : "mt-5"} min-h-0 flex-1 space-y-2 overflow-y-auto pb-3 ${leftPaneCollapsed ? "px-0.5" : "pr-1"}`}
          >
            {visibleConversations.map((conversation) => {
              const title = titleFor(
                conversation,
                tr("Conversation", "Диалог"),
              );
              const conversationAvatar = avatarForConversation(conversation);
              const preview = conversation.last_message;
              if (leftPaneCollapsed) {
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => {
                      setActiveId(conversation.id);
                      setNewRecipient(undefined);
                    }}
                    aria-label={title}
                    title={title}
                    className={`relative flex h-14 w-full items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 ${
                      activeId === conversation.id
                        ? "bg-[var(--color-soft-blue)]"
                        : "hover:bg-neutral-50"
                    }`}
                  >
                    <Avatar
                      initials={initials(conversationAvatar.name)}
                      src={conversationAvatar.url}
                      alt={conversationAvatar.name}
                      size="size-10"
                    />
                    {conversation.unread_count ? (
                      <span className="absolute right-0.5 top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 font-inter text-[10px] font-bold leading-[18px] text-white">
                        {conversation.unread_count > 99
                          ? "99+"
                          : conversation.unread_count}
                      </span>
                    ) : null}
                  </button>
                );
              }
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => {
                    setActiveId(conversation.id);
                    setNewRecipient(undefined);
                  }}
                  className={`grid h-[92px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 overflow-hidden rounded-lg p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 ${activeId === conversation.id ? "bg-[var(--color-soft-blue)]" : "hover:bg-neutral-50"}`}
                >
                  <Avatar
                    initials={initials(conversationAvatar.name)}
                    src={conversationAvatar.url}
                    alt={conversationAvatar.name}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-inter text-[13px] font-bold leading-[1.35] text-[var(--color-ink)]">
                      {title}
                    </span>
                    <span className="mt-1 block truncate font-inter text-[11px] font-bold text-[var(--color-primary)]">
                      {subtitleFor(
                        conversation,
                        tr("Direct conversation", "Личный диалог"),
                        tr("Organization conversation", "Диалог с организацией"),
                        tr("Group conversation", "Беседа"),
                      )}
                    </span>
                    <span className="mt-1 flex min-w-0 items-baseline font-inter text-[11px] text-[var(--color-muted)]">
                      {preview ? (
                        <>
                          <span className="shrink-0 font-semibold text-[var(--color-ink)]">
                            {preview.sender_name}:&nbsp;
                          </span>
                          <span className="truncate">{preview.body}</span>
                        </>
                      ) : (
                        <span className="truncate">
                          {tr("No messages yet", "Сообщений пока нет")}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="flex h-full flex-col items-end justify-between whitespace-nowrap font-inter text-[10px] font-semibold tabular-nums text-[var(--color-muted)]">
                    <span>{formatTime(conversation.last_message_at, locale)}</span>
                    {conversation.unread_count ? (
                      <span className="flex min-w-[18px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 leading-[18px] text-white">
                        {conversation.unread_count > 99
                          ? "99+"
                          : conversation.unread_count}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
            {!loading && visibleConversations.length === 0 ? (
              <p className="px-2.5 font-inter text-sm text-[var(--color-muted)]">
                {tr("No conversations yet.", "Диалогов пока нет.")}
              </p>
            ) : null}
          </div>
        </aside>
        {!leftPaneCollapsed ? (
          <ResizeHandle
            value={leftPaneWidth}
            min={280}
            max={480}
            direction={1}
            onChange={setLeftPaneWidth}
            label={tr(
              "Resize conversations panel",
              "Изменить ширину списка диалогов",
            )}
            className="hidden lg:flex"
          />
        ) : null}
        <section className="flex min-w-0 flex-1 flex-col bg-white">
          <header className="flex h-[78px] shrink-0 items-center border-b border-[var(--color-border)] px-4 sm:px-6">
            {active || newRecipient ? (
              <>
                <Avatar
                  initials={initials(activeConversationAvatar.name)}
                  src={activeConversationAvatar.url}
                  alt={activeConversationAvatar.name}
                  size="size-[42px]"
                />
                <div className="ml-3 min-w-0 flex-1">
                  {active && conversations.length ? (
                    <select
                      value={active.id}
                      onChange={(event) => {
                        setActiveId(event.target.value);
                        setNewRecipient(undefined);
                      }}
                      aria-label={tr("Choose a conversation", "Выберите диалог")}
                      className="block w-full max-w-52 truncate bg-transparent font-inter text-sm font-bold text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-blue-100 lg:hidden"
                    >
                      {conversations.map((conversation) => (
                        <option key={conversation.id} value={conversation.id}>
                          {titleFor(conversation, tr("Conversation", "Диалог"))}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <h2 className={`${active ? "hidden lg:block" : "block"} truncate font-inter text-[15px] font-bold text-[var(--color-ink)]`}>
                    {activeTitle}
                  </h2>
                  <p className="mt-0.5 truncate font-inter text-xs text-[var(--color-muted)]">
                    {activeSubtitle}
                  </p>
                </div>
                <span
                  className={`ml-2 inline-flex shrink-0 items-center gap-1.5 font-inter text-xs sm:ml-auto sm:pl-3 ${realtimeConnected ? "text-emerald-600" : "text-[var(--color-muted)]"}`}
                >
                  <span
                    aria-hidden="true"
                    className={`size-2 rounded-full ${realtimeConnected ? "bg-emerald-500" : "bg-neutral-400"}`}
                  />
                  <span className="sr-only sm:not-sr-only">
                    {realtimeConnected
                      ? tr("Live", "Онлайн")
                      : tr("Reconnecting…", "Переподключение…")}
                  </span>
                </span>
                <Info className="ml-2 shrink-0 text-[var(--color-primary)] sm:ml-3" size={18} />
              </>
            ) : (
              <h2 className="font-inter text-[15px] font-bold text-[var(--color-ink)]">
                {tr("Choose a conversation", "Выберите диалог")}
              </h2>
            )}
          </header>
          {error ? (
            <p className="m-6 rounded-md border border-red-200 bg-red-50 p-3 font-inter text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            {active || newRecipient ? (
              <div className="space-y-5">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${message.is_self ? "justify-end" : "justify-start"}`}
                  >
                    {!message.is_self ? (
                      <Avatar
                        initials={initials(message.sender_name)}
                        src={message.sender_avatar_url}
                        alt={message.sender_name}
                        size="size-8"
                      />
                    ) : null}
                    <div
                      className={`min-w-0 max-w-[min(420px,85%)] rounded-[10px] px-4 py-3 ${message.is_self ? "bg-[var(--color-primary)] text-white" : "bg-neutral-100 text-[var(--color-ink)]"}`}
                    >
                      {!message.is_self &&
                      (active?.kind === "group" ||
                        message.sender_kind === "organization") ? (
                        <p className="mb-1 truncate font-inter text-[11px] font-bold text-[var(--color-primary)]">
                          {message.sender_name}
                        </p>
                      ) : null}
                      <p className="whitespace-pre-wrap break-words font-inter text-[13px] leading-[1.4] [overflow-wrap:anywhere]">
                        {message.body}
                      </p>
                      <p
                        className={`mt-2 font-inter text-[10px] tabular-nums ${message.is_self ? "text-blue-100" : "text-[var(--color-muted)]"}`}
                      >
                        {formatTime(message.created_at, locale)}
                      </p>
                    </div>
                    {message.is_self ? (
                      <Avatar
                        initials={initials(message.sender_name)}
                        src={message.sender_avatar_url}
                        alt={message.sender_name}
                        size="size-8"
                      />
                    ) : null}
                  </div>
                ))}
                {newRecipient && !active ? (
                  <p className="rounded-lg bg-neutral-100 p-4 font-inter text-sm text-[var(--color-muted)]">
                    {tr(
                      "Write the first message to",
                      "Напишите первое сообщение для",
                    )}{" "}
                    {newRecipient.name}.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="font-inter text-sm text-[var(--color-muted)]">
                {tr(
                  "Choose a conversation from the list, or open a public profile and select Message.",
                  "Выберите диалог из списка или откройте публичный профиль и нажмите «Написать».",
                )}
              </p>
            )}
          </div>
          {active || newRecipient ? (
            <form
              onSubmit={sendMessage}
              className="mx-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] mt-3 flex min-h-[62px] shrink-0 items-center rounded-[10px] border border-[var(--color-border)] bg-white px-2 sm:m-6 sm:px-3"
            >
              <button
                disabled
                type="button"
                aria-label={tr(
                  "Attachments are not available yet",
                  "Вложения пока недоступны",
                )}
                className="flex items-center justify-center text-[var(--color-muted)]"
              >
                <Paperclip size={18} />
              </button>
              {senderOrganizations.length ? (
                <select
                  value={senderOrganizationId}
                  onChange={(event) => setSenderOrganizationId(event.target.value)}
                  aria-label={tr("Send as", "Отправитель")}
                  className="ml-2 max-w-40 shrink-0 truncate rounded-md bg-neutral-100 px-2 py-1.5 font-inter text-[11px] font-semibold text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">{tr("As yourself", "От себя")}</option>
                  {senderOrganizations.map((organization) => (
                    <option key={organization.id} value={organization.entity_id}>
                      {organization.display_name}
                    </option>
                  ))}
                </select>
              ) : null}
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="min-w-0 flex-1 px-3 font-inter text-[13px] outline-none placeholder:text-[var(--color-muted)]"
                placeholder={tr("Write a message…", "Напишите сообщение…")}
              />
              <button
                type="submit"
                aria-label={tr("Send message", "Отправить сообщение")}
                className="flex items-center justify-center text-[var(--color-primary)] disabled:opacity-40"
                disabled={!draft.trim() || sending}
              >
                <Send size={20} />
              </button>
            </form>
          ) : null}
        </section>
        {active ? (
          <>
            {!rightPaneCollapsed ? (
              <ResizeHandle
                value={rightPaneWidth}
                min={300}
                max={520}
                direction={-1}
                onChange={setRightPaneWidth}
                label={tr(
                  "Resize details panel",
                  "Изменить ширину панели сведений",
                )}
                className="hidden xl:flex"
              />
            ) : null}
            <aside
              style={{ width: rightPaneCollapsed ? 72 : rightPaneWidth }}
              className={`relative hidden shrink-0 overflow-y-auto bg-white xl:block ${
                rightPaneCollapsed ? "p-2" : "p-5"
              }`}
            >
              {rightPaneCollapsed ? (
                <div className="flex min-h-full flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRightPaneCollapsed(false)}
                    aria-label={tr("Expand details", "Развернуть панель сведений")}
                    title={tr("Expand details", "Развернуть панель сведений")}
                    className="flex size-10 shrink-0 items-center justify-center rounded-md text-[var(--color-muted)] hover:bg-neutral-100 hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                  >
                    <PanelRightOpen aria-hidden="true" size={18} />
                  </button>
                  <div className="relative flex flex-col items-center gap-2 border-t border-[var(--color-border)] pt-3">
                    {active.participants.slice(0, 7).map((participant) => (
                      <Avatar
                        key={participant.id}
                        initials={initials(participant.display_name)}
                        src={participant.avatar_url}
                        alt={participant.display_name}
                        size="size-9"
                      />
                    ))}
                    {active.unread_count ? (
                      <span className="absolute -right-1 top-1 flex min-w-[18px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 font-inter text-[10px] font-bold leading-[18px] text-white">
                        {active.unread_count > 99 ? "99+" : active.unread_count}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setRightPaneCollapsed(true)}
                    aria-label={tr("Collapse details", "Свернуть панель сведений")}
                    title={tr("Collapse details", "Свернуть панель сведений")}
                    className="absolute right-6 top-6 z-10 flex size-8 items-center justify-center rounded-md text-[var(--color-muted)] hover:bg-white hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                  >
                    <PanelRightClose aria-hidden="true" size={18} />
                  </button>
            <div className="rounded-[10px] bg-neutral-100 p-4 pr-12">
              <p className="flex items-center gap-1.5 font-inter text-[10px] font-bold text-[var(--color-primary)]">
                {active.project ? (
                  <ArrowUpRight aria-hidden="true" size={13} />
                ) : active.kind === "group" ? (
                  <UsersRound aria-hidden="true" size={13} />
                ) : active.kind === "direct" ? (
                  <UserRound aria-hidden="true" size={13} />
                ) : (
                  <Building2 aria-hidden="true" size={13} />
                )}
                {active.project
                  ? tr("PROJECT CONTEXT", "КОНТЕКСТ ПРОЕКТА")
                  : active.kind === "group"
                    ? tr("GROUP CONVERSATION", "ГРУППОВАЯ БЕСЕДА")
                    : active.kind === "organization"
                      ? tr("ORGANIZATION", "ОРГАНИЗАЦИЯ")
                      : tr("DIRECT CONVERSATION", "ЛИЧНЫЙ ДИАЛОГ")}
              </p>
              <h2 className="mt-3 break-words font-geist text-xl font-[650] text-balance text-[var(--color-ink)] [overflow-wrap:anywhere]">
                {active.project?.title || primaryOrganization?.display_name || activeTitle}
              </h2>
              <p className="mt-2 break-words font-inter text-xs leading-[1.4] text-pretty text-[var(--color-muted)] [overflow-wrap:anywhere]">
                {active.project?.short_description ||
                  (active.kind === "group"
                    ? tr(
                        "A shared conversation for talents and organizations.",
                        "Общая беседа для талантов и организаций.",
                      )
                    : active.kind === "organization"
                      ? tr(
                          "Messages can be sent personally or on behalf of the organization.",
                          "Сообщения можно отправлять лично или от имени организации.",
                        )
                      : tr(
                          "A private conversation between two talents.",
                          "Личный диалог между двумя талантами.",
                        ))}
              </p>
            </div>
            <div className="mt-5 rounded-[10px] border border-[var(--color-border)] p-4">
              <h3 className="font-geist text-base font-[650]">
                {tr("Participants", "Участники")}
              </h3>
              <div className="mt-3 space-y-2">
                {active.participants.map((participant) => {
                  const href: Route | null = participant.profile_slug
                    ? (`/talents/${participant.profile_slug}` as Route)
                    : participant.organization_slug
                      ? (`/organizations/${participant.organization_slug}` as Route)
                      : null;
                  const content = (
                    <>
                      <Avatar
                        initials={initials(participant.display_name)}
                        src={participant.avatar_url}
                        alt={participant.display_name}
                        size="size-8"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate font-inter text-xs font-semibold text-[var(--color-ink)]">
                            {participant.display_name}
                          </span>
                          {participant.is_self ? (
                            <span className="shrink-0 rounded-full bg-[var(--color-soft-blue)] px-1.5 py-0.5 font-inter text-[9px] font-bold text-[var(--color-primary)]">
                              {tr({ en: "You", ru: "Вы", "zh-Hans": "你" })}
                            </span>
                          ) : null}
                        </span>
                        <span className="block font-inter text-[10px] text-[var(--color-muted)]">
                          {participant.kind === "organization"
                            ? tr("Organization", "Организация")
                            : tr({
                                en: "Participant",
                                ru: "Участник",
                                "zh-Hans": "参与者",
                              })}
                        </span>
                      </span>
                      {href ? (
                        <ArrowUpRight
                          aria-hidden="true"
                          className="shrink-0 text-[var(--color-muted)] group-hover:text-[var(--color-primary)]"
                          size={14}
                        />
                      ) : null}
                    </>
                  );
                  return href ? (
                    <Link
                      key={participant.id}
                      href={href}
                      title={tr({
                        en: "Open profile",
                        ru: "Открыть профиль",
                        "zh-Hans": "打开资料",
                      })}
                      className="group flex items-center gap-2 rounded-md p-1.5 hover:bg-neutral-50"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={participant.id} className="flex items-center gap-2 p-1.5">
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
            {active.project || primaryOrganization?.organization_slug ? (
              <div className="mt-5 rounded-[10px] border border-[var(--color-border)] p-4">
              <h3 className="font-geist text-base font-[650]">
                {tr("Quick actions", "Быстрые действия")}
              </h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {active.project ? (
                  <Link
                    href={`/projects/${active.project.slug}`}
                    className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-md border border-[var(--color-border)] px-2.5 py-2 text-center font-inter text-xs font-semibold leading-tight text-[var(--color-ink)]"
                  >
                    <ArrowUpRight className="shrink-0" size={14} />
                    <span>{tr("View project", "Открыть проект")}</span>
                  </Link>
                ) : null}
                {primaryOrganization?.organization_slug ? (
                  <Link
                    href={`/organizations/${primaryOrganization.organization_slug}`}
                    className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-md border border-[var(--color-border)] px-2.5 py-2 text-center font-inter text-xs font-semibold leading-tight text-[var(--color-ink)]"
                  >
                    <Building2 className="shrink-0" size={14} />
                    <span>{tr("View organization", "Открыть организацию")}</span>
                  </Link>
                ) : null}
              </div>
              </div>
            ) : null}
                </>
              )}
            </aside>
          </>
        ) : null}
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[var(--color-background)]" />}
    >
      <ChatClient />
    </Suspense>
  );
}
