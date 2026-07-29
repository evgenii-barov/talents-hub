import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("reserves the document scrollbar gutter before async content loads", async () => {
  const stylesheet = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(stylesheet, /scrollbar-gutter:\s*stable/);
});
