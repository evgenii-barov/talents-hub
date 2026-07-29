import { apiFetch } from "@/lib/api";

export type ApplicationStatus = "submitted" | "in_review" | "shortlisted" | "accepted" | "rejected" | "withdrawn" | "cancelled";
export interface ProjectApplication {
  id: string;
  project_role: string;
  project_id: string;
  project_title: string;
  project_slug: string;
  role_title: string;
  applicant_name: string;
  applicant_profile_slug: string | null;
  cover_letter: string;
  status: ApplicationStatus;
  submitted_at: string;
  reviewed_at: string | null;
  review_note: string;
}

export function getMyApplications() { return apiFetch<ProjectApplication[]>("/v1/me/applications/"); }
export function getProjectApplications(projectId: string) { return apiFetch<ProjectApplication[]>(`/v1/me/projects/${projectId}/applications/`); }
export function transitionApplication(id: string, status: ApplicationStatus, review_note = "") { return apiFetch<ProjectApplication>(`/v1/applications/${id}/transition/`, { method: "PATCH", body: { status, review_note } }); }
