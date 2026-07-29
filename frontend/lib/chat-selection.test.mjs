import assert from "node:assert/strict";
import test from "node:test";

import {
  conversationInputFor,
  resolveConversationSelection,
} from "./chat-selection.ts";

const self = {
  kind: "talent",
  entity_id: "profile-self",
  is_self: true,
};

test("a profile Message link selects an existing direct conversation with that talent", () => {
  const conversations = [
    {
      id: "unrelated-conversation",
      kind: "direct",
      participants: [
        self,
        { kind: "talent", entity_id: "profile-other", is_self: false },
      ],
    },
    {
      id: "requested-conversation",
      kind: "direct",
      participants: [
        self,
        { kind: "talent", entity_id: "profile-requested", is_self: false },
      ],
    },
  ];

  assert.deepEqual(
    resolveConversationSelection(
      conversations,
      undefined,
      {
        kind: "talent",
        id: "profile-requested",
        name: "Requested talent",
      },
    ),
    { activeId: "requested-conversation", newRecipient: undefined },
  );
});

test("a profile Message link opens a composer when no direct conversation exists", () => {
  const conversations = [
    {
      id: "unrelated-conversation",
      kind: "direct",
      participants: [
        self,
        { kind: "talent", entity_id: "profile-other", is_self: false },
      ],
    },
  ];

  assert.deepEqual(
    resolveConversationSelection(
      conversations,
      undefined,
      {
        kind: "talent",
        id: "profile-requested",
        name: "Requested talent",
      },
    ),
    {
      activeId: undefined,
      newRecipient: {
        kind: "talent",
        id: "profile-requested",
        name: "Requested talent",
      },
    },
  );
});

test("a project Message link selects the organizer conversation for that project", () => {
  const conversations = [
    {
      id: "same-organizer-other-project",
      kind: "organization",
      project: { id: "project-other" },
      participants: [
        self,
        { kind: "organization", entity_id: "organization", is_self: false },
      ],
    },
    {
      id: "requested-project-conversation",
      kind: "organization",
      project: { id: "project-requested" },
      participants: [
        self,
        { kind: "organization", entity_id: "organization", is_self: false },
      ],
    },
  ];

  assert.deepEqual(
    resolveConversationSelection(conversations, undefined, {
      kind: "organization",
      id: "organization",
      name: "Open Cities Lab",
      projectId: "project-requested",
      projectTitle: "Neighbourhood Climate Lab",
    }),
    {
      activeId: "requested-project-conversation",
      newRecipient: undefined,
    },
  );
});

test("a project Message link selects the owner's direct conversation for that project", () => {
  const conversations = [
    {
      id: "same-owner-other-project",
      kind: "direct",
      project: { id: "project-other" },
      participants: [
        self,
        { kind: "talent", entity_id: "project-owner", is_self: false },
      ],
    },
    {
      id: "requested-owner-conversation",
      kind: "direct",
      project: { id: "project-requested" },
      participants: [
        self,
        { kind: "talent", entity_id: "project-owner", is_self: false },
      ],
    },
  ];

  assert.deepEqual(
    resolveConversationSelection(conversations, undefined, {
      kind: "talent",
      id: "project-owner",
      name: "Alex Volkov",
      projectId: "project-requested",
      projectTitle: "Neighbourhood Climate Lab",
    }),
    {
      activeId: "requested-owner-conversation",
      newRecipient: undefined,
    },
  );
});

test("a new organizer conversation includes the project context", () => {
  const target = {
    kind: "organization",
    id: "organization",
    name: "Open Cities Lab",
    projectId: "project-requested",
    projectTitle: "Neighbourhood Climate Lab",
  };

  assert.deepEqual(conversationInputFor(target, "Hello about the project"), {
    organization_ids: ["organization"],
    project_id: "project-requested",
    message: "Hello about the project",
  });
});
