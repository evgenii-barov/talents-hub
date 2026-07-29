import { apiFetch } from "@/lib/api";

export type NotificationItem = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export function getNotifications() {
  return apiFetch<NotificationItem[]>("/v1/notifications/");
}

export function markNotificationRead(notificationId: string) {
  return apiFetch<NotificationItem>(`/v1/notifications/${notificationId}/read/`, {
    method: "POST",
  });
}

export function markAllNotificationsRead() {
  return apiFetch<{ updated: number }>("/v1/notifications/read-all/", {
    method: "POST",
  });
}
