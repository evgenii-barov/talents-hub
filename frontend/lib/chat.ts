import { API_URL, apiFetch } from "@/lib/api";

export type ConversationParticipant = {
  id: string;
  kind: "talent" | "organization";
  entity_id: string;
  display_name: string;
  profile_slug: string | null;
  organization_slug: string | null;
  avatar_url: string | null;
  is_self: boolean;
  last_read_at: string | null;
};

export type ChatMessage = {
  id: string;
  sender: number;
  sender_kind: "talent" | "organization";
  sender_name: string;
  sender_profile_slug: string | null;
  sender_organization: string | null;
  sender_organization_slug: string | null;
  sender_avatar_url: string | null;
  is_self: boolean;
  body: string;
  client_message_id: string | null;
  created_at: string;
};

export type ChatRealtimeEvent =
  | { type: "chat.message.created"; conversation_id: string; message: ChatMessage }
  | { type: "chat.conversation.read"; conversation_id: string; user_id: number; last_read_at: string }
  | { type: "chat.error"; code: string; detail: string };

export type Conversation = {
  id: string;
  kind: "direct" | "organization" | "group";
  subject: string;
  project: { id: string; slug: string; title: string; short_description: string } | null;
  participants: ConversationParticipant[];
  last_message: ChatMessage | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
};

export function getConversations() {
  return apiFetch<Conversation[]>("/v1/conversations/");
}

export function getConversationMessages(conversationId: string) {
  return apiFetch<ChatMessage[]>(`/v1/conversations/${conversationId}/messages/`);
}

export function createConversation(input: {
  participant_profile_ids?: string[];
  organization_ids?: string[];
  project_id?: string;
  subject?: string;
  message: string;
  sender_organization_id?: string;
}) {
  return apiFetch<Conversation>("/v1/conversations/", { method: "POST", body: input });
}

export function sendChatMessage(
  conversationId: string,
  body: string,
  senderOrganizationId?: string,
) {
  return apiFetch<ChatMessage>(`/v1/conversations/${conversationId}/messages/`, {
    method: "POST",
    body: { body, sender_organization_id: senderOrganizationId },
  });
}

export function markConversationRead(conversationId: string) {
  return apiFetch<void>(`/v1/conversations/${conversationId}/read/`, { method: "POST" });
}

export function getChatWebSocketUrl(): string {
  const url = new URL(API_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  const basePath = url.pathname.replace(/\/api\/?$/, "");
  url.pathname = `${basePath}/ws/chat/`.replace(/\/{2,}/g, "/");
  return url.toString();
}

export function sendRealtimeChatMessage(
  socket: WebSocket,
  conversationId: string,
  body: string,
  senderOrganizationId?: string,
): string {
  const clientMessageId = crypto.randomUUID();
  socket.send(
    JSON.stringify({
      type: "chat.message.send",
      conversation_id: conversationId,
      body,
      client_message_id: clientMessageId,
      sender_organization_id: senderOrganizationId,
    }),
  );
  return clientMessageId;
}

export function sendRealtimeReadReceipt(socket: WebSocket, conversationId: string): void {
  socket.send(JSON.stringify({ type: "chat.conversation.read", conversation_id: conversationId }));
}
