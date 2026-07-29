import assert from "node:assert/strict";
import test from "node:test";

import { resolveChatWebSocketUrl } from "./chat-url.ts";

test("resolves the production same-origin API path to a secure chat websocket", () => {
  assert.equal(
    resolveChatWebSocketUrl("/api", "https://talents-hub.online"),
    "wss://talents-hub.online/ws/chat/",
  );
});

test("preserves an absolute development API host", () => {
  assert.equal(
    resolveChatWebSocketUrl("http://localhost:8000/api"),
    "ws://localhost:8000/ws/chat/",
  );
});
