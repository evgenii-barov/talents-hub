import assert from "node:assert/strict";
import test from "node:test";

import {
  isAnalyticsConfigured,
  sanitizeAnalyticsData,
} from "./analytics.ts";

test("Umami configuration requires a safe URL and UUID website ID", () => {
  const websiteId = "94db1cb1-74f4-4a40-ad6c-962362670409";

  assert.equal(
    isAnalyticsConfigured("https://insights.example.org/th.js", websiteId),
    true,
  );
  assert.equal(isAnalyticsConfigured("javascript:alert(1)", websiteId), false);
  assert.equal(
    isAnalyticsConfigured("https://insights.example.org/th.js", "replace-me"),
    false,
  );
});

test("analytics event properties remove likely personal or free-text data", () => {
  assert.deepEqual(
    sanitizeAnalyticsData({
      project_id: "project-id",
      role_count: 2,
      email: "person@example.org",
      message_body: "private message",
      search_query: "private search",
    }),
    { project_id: "project-id", role_count: 2 },
  );
});
