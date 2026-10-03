import test from "node:test";
import assert from "node:assert/strict";
import { deliverScript, parseWebMessage } from "../src/bridge.ts";

test("parses every message the page sends", () => {
  assert.deepEqual(parseWebMessage('{"type":"load-settings"}'), { type: "load-settings" });
  assert.deepEqual(parseWebMessage('{"type":"save-settings","patch":{"zoom":1.1}}'), { type: "save-settings", patch: { zoom: 1.1 } });
  assert.deepEqual(parseWebMessage('{"type":"schedule-notifications","times":{"Fajr":"05:00"}}'), {
    type: "schedule-notifications", times: { Fajr: "05:00" }, settings: {},
  });
  assert.deepEqual(parseWebMessage('{"type":"theme-color","bg":"#fff","isDark":false}'), { type: "theme-color", bg: "#fff", isDark: false });
  assert.deepEqual(parseWebMessage('{"type":"haptic","kind":"success"}'), { type: "haptic", kind: "success" });
  assert.deepEqual(parseWebMessage('{"type":"view-change","view":"settings"}'), { type: "view-change", view: "settings" });
});

test("rejects malformed or unknown messages", () => {
  assert.equal(parseWebMessage("not json"), null);
  assert.equal(parseWebMessage("[]"), null);
  assert.equal(parseWebMessage('{"type":"nope"}'), null);
  assert.equal(parseWebMessage('{"type":"save-settings","patch":"x"}'), null);
  assert.equal(parseWebMessage('{"type":"view-change"}'), null);
});

test("unknown haptic kinds fall back to a light tick", () => {
  assert.deepEqual(parseWebMessage('{"type":"haptic","kind":"boom"}'), { type: "haptic", kind: "light" });
});

test("delivered scripts call ZakkirNative.receive with the message", () => {
  const calls: unknown[] = [];
  const window = { ZakkirNative: { receive: (m: unknown) => calls.push(m) } };
  new Function("window", deliverScript({ type: "settings", value: { a: "</script>" }, locale: "ar" }))(window);
  assert.deepEqual(calls, [{ type: "settings", value: { a: "</script>" }, locale: "ar" }]);
});
