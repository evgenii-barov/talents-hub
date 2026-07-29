import { apiFetch, toQuery } from "@/lib/api";

export interface ModerationCase {
  id: string;
  target_type: "profile" | "organization" | "project" | "media";
  object_id: string;
  status: "open" | "in_review" | "approved" | "changes_requested" | "rejected" | "closed";
  reason_code: string;
  decision_note: string;
  opened_at: string;
  resolved_at: string | null;
}

export function getModerationCases(status = "open") { return apiFetch<ModerationCase[]>(`/v1/moderation/cases/${toQuery({ status })}`); }
export function decideModerationCase(id: string, decision: "approved" | "changes_requested" | "rejected", note: string) { return apiFetch<ModerationCase>(`/v1/moderation/cases/${id}/decision/`, { method: "PATCH", body: { decision, note } }); }
