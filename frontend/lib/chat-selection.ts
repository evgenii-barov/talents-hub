export type NewConversationTarget = {
  kind: "talent" | "organization";
  id: string;
  name: string;
  projectId?: string;
  projectTitle?: string;
};

export type ConversationSelection = {
  activeId: string | undefined;
  newRecipient: NewConversationTarget | undefined;
};

type SelectableConversation = {
  id: string;
  kind: "direct" | "organization" | "group";
  project?: { id: string } | null;
  participants: Array<{
    kind: "talent" | "organization";
    entity_id: string;
    is_self: boolean;
  }>;
};

export function resolveConversationSelection(
  conversations: SelectableConversation[],
  currentActiveId: string | undefined,
  target: NewConversationTarget | undefined,
): ConversationSelection {
  if (target) {
    const expectedConversationKind =
      target.kind === "organization" ? "organization" : "direct";
    const existingConversation = conversations.find(
      (conversation) =>
        conversation.kind === expectedConversationKind &&
        (!target.projectId || conversation.project?.id === target.projectId) &&
        conversation.participants.some(
          (participant) =>
            participant.kind === target.kind &&
            !participant.is_self &&
            participant.entity_id === target.id,
        ),
    );

    return existingConversation
      ? { activeId: existingConversation.id, newRecipient: undefined }
      : {
          activeId: undefined,
          newRecipient: target,
        };
  }

  const activeId =
    currentActiveId &&
    conversations.some((conversation) => conversation.id === currentActiveId)
      ? currentActiveId
      : conversations[0]?.id;

  return {
    activeId,
    newRecipient: undefined,
  };
}

export function conversationInputFor(
  target: NewConversationTarget,
  message: string,
): {
  participant_profile_ids?: string[];
  organization_ids?: string[];
  project_id?: string;
  message: string;
} {
  return {
    ...(target.kind === "organization"
      ? { organization_ids: [target.id] }
      : { participant_profile_ids: [target.id] }),
    ...(target.projectId ? { project_id: target.projectId } : {}),
    message,
  };
}
