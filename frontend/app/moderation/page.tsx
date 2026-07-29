"use client";

import { useCallback, useEffect, useState } from "react";

import { AuthenticatedHeader } from "@/components/layout/authenticated-header";
import { useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import {
  decideModerationCase,
  getModerationCases,
  type ModerationCase,
} from "@/lib/moderation";

const targetLabel: Record<ModerationCase["target_type"], string> = {
  profile: "Profile",
  organization: "Organization",
  project: "Project",
  media: "Media",
};

export default function ModerationPage() {
  const { formatDate, localize, tr } = useLocale();
  const localizedTargetLabel: Record<ModerationCase["target_type"], string> =
    localize({
      en: targetLabel,
      ru: {
          profile: "Профиль",
          organization: "Организация",
          project: "Проект",
          media: "Медиа",
        },
      "zh-Hans": {
        profile: "个人资料",
        organization: "机构",
        project: "项目",
        media: "媒体",
      },
    });
  const statusLabel = localize<Record<string, string>>({
      en: {},
      ru: {
          open: "Открытые",
          in_review: "На рассмотрении",
          approved: "Одобрено",
          changes_requested: "Нужны изменения",
          rejected: "Отклонено",
        },
      "zh-Hans": {
        open: "待处理",
        in_review: "审核中",
        approved: "已批准",
        changes_requested: "需要修改",
        rejected: "已拒绝",
      },
    });
  const [cases, setCases] = useState<ModerationCase[]>([]);
  const [status, setStatus] = useState("open");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCases(await getModerationCases(status));
    } catch (error) {
      setMessage(
        error instanceof ApiError && error.status === 403
          ? tr(
              "This queue is available only to moderators and administrators.",
              "Эта очередь доступна только модераторам и администраторам.",
            )
          : tr(
              "Could not load moderation cases.",
              "Не удалось загрузить очередь модерации.",
            ),
      );
    } finally {
      setLoading(false);
    }
  }, [status, tr]);
  useEffect(() => {
    void load();
  }, [load]);
  async function decide(
    item: ModerationCase,
    decision: "approved" | "changes_requested" | "rejected",
  ) {
    const note =
      window.prompt(
        tr(
          "Decision note (shown to the owner):",
          "Комментарий к решению, который увидит владелец:",
        ),
        "",
      ) ?? "";
    try {
      await decideModerationCase(item.id, decision, note);
      setMessage(
        tr(
          "Decision saved and the owner was notified.",
          "Решение сохранено, владелец получил уведомление.",
        ),
      );
      await load();
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.message
          : tr("Could not save decision.", "Не удалось сохранить решение."),
      );
    }
  }
  return (
    <div className="min-h-full bg-[var(--color-background)]">
      <AuthenticatedHeader />
      <main className="mx-auto max-w-[980px] px-6 py-9">
        <h1 className="font-geist text-[28px] font-[650]">
          {tr("Moderation queue", "Очередь модерации")}
        </h1>
        <p className="mt-2 font-inter text-sm text-[var(--color-muted)]">
          {tr(
            "Review public profiles, projects, organisations and uploaded media. Every decision is recorded in the audit log.",
            "Проверяйте публичные профили, проекты, организации и загруженные медиа. Каждое решение сохраняется в журнале аудита.",
          )}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            "open",
            "in_review",
            "approved",
            "changes_requested",
            "rejected",
          ].map((item) => (
            <Button
              key={item}
              size="sm"
              variant={status === item ? "default" : "outline"}
              onClick={() => setStatus(item)}
            >
              {statusLabel[item] || item.replaceAll("_", " ")}
            </Button>
          ))}
        </div>
        {message ? (
          <p className="mt-5 rounded-lg bg-[var(--color-soft-blue)] p-4 font-inter text-sm text-[var(--color-primary)]">
            {message}
          </p>
        ) : null}
        {loading ? (
          <p className="mt-6 font-inter text-sm text-[var(--color-muted)]">
            {tr("Loading queue…", "Загружаем очередь…")}
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {cases.map((item) => (
              <article
                key={item.id}
                className="rounded-[10px] border border-[var(--color-border)] bg-white p-5"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-inter text-sm font-bold">
                      {localizedTargetLabel[item.target_type]} ·{" "}
                      {tr("review", "проверка")}
                    </p>
                    <p className="mt-1 font-inter text-xs text-[var(--color-muted)]">
                      {tr("Reason", "Причина")}: {item.reason_code} ·{" "}
                      {tr("Opened", "Создано")}{" "}
                      {formatDate(item.opened_at, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <span className="rounded-full bg-neutral-100 px-2 py-1 font-inter text-xs font-bold">
                    {statusLabel[item.status] ||
                      item.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-3 break-all font-inter text-xs text-[var(--color-muted)]">
                  ID: {item.object_id}
                </p>
                {item.decision_note ? (
                  <p className="mt-3 rounded bg-neutral-100 p-3 font-inter text-sm">
                    {item.decision_note}
                  </p>
                ) : null}
                {["open", "in_review"].includes(item.status) ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => void decide(item, "approved")}
                    >
                      {tr("Approve", "Одобрить")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void decide(item, "changes_requested")}
                    >
                      {tr("Request changes", "Запросить изменения")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void decide(item, "rejected")}
                    >
                      {tr("Reject", "Отклонить")}
                    </Button>
                  </div>
                ) : null}
              </article>
            ))}
            {cases.length === 0 ? (
              <p className="rounded-[10px] border border-[var(--color-border)] bg-white p-5 font-inter text-sm text-[var(--color-muted)]">
                {tr("No cases in this queue.", "В этой очереди нет заявок.")}
              </p>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
