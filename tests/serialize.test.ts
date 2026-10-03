import test from "node:test";
import assert from "node:assert/strict";
import { serialize } from "../src/notifications/serialize.ts";

const tick = () => new Promise((r) => setTimeout(r, 1));

test("overlapping calls run one after another, in order", async () => {
  const log: string[] = [];
  const run = serialize(async (id: string) => {
    log.push(`cancel ${id}`);
    await tick();
    log.push(`schedule ${id}`);
  });
  await Promise.all([run("restore"), run("page")]);
  assert.deepEqual(log, ["cancel restore", "schedule restore", "cancel page", "schedule page"]);
});

test("a failed call does not block the next one", async () => {
  const log: string[] = [];
  const run = serialize(async (fail: boolean) => {
    await tick();
    if (fail) throw new Error("boom");
    log.push("ok");
  });
  await assert.rejects(run(true));
  await run(false);
  assert.deepEqual(log, ["ok"]);
});
