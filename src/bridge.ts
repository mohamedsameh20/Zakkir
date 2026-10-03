// Typed protocol between the native shell and the WebView page. The page side
// is web/bridge.js (window.ZakkirNative); change both together.

type Json = Record<string, unknown>;

/** Messages the page posts to the shell. */
export type WebMessage =
  | { type: "load-settings" }
  | { type: "save-settings"; patch: Json }
  | { type: "schedule-notifications"; times: Json; settings: Json }
  | { type: "theme-color"; bg?: string; isDark?: boolean }
  | { type: "haptic"; kind: "light" | "selection" | "success" }
  | { type: "view-change"; view: string };

/** Messages the shell delivers to the page through ZakkirNative.receive(). */
export type NativeMessage =
  | { type: "settings"; value: Json; locale: string }
  | { type: "back" };

const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Parse a raw WebView message, or null if it isn't one we understand. */
export function parseWebMessage(raw: string): WebMessage | null {
  let message: unknown;
  try {
    message = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(message)) return null;
  switch (message.type) {
    case "load-settings":
      return { type: "load-settings" };
    case "save-settings":
      return isObject(message.patch) ? { type: "save-settings", patch: message.patch } : null;
    case "schedule-notifications":
      return {
        type: "schedule-notifications",
        times: isObject(message.times) ? message.times : {},
        settings: isObject(message.settings) ? message.settings : {},
      };
    case "theme-color":
      return {
        type: "theme-color",
        bg: typeof message.bg === "string" ? message.bg : undefined,
        isDark: typeof message.isDark === "boolean" ? message.isDark : undefined,
      };
    case "haptic": {
      const kind = message.kind === "success" || message.kind === "selection" ? message.kind : "light";
      return { type: "haptic", kind };
    }
    case "view-change":
      return typeof message.view === "string" ? { type: "view-change", view: message.view } : null;
    default:
      return null;
  }
}

/** JavaScript to inject so the page receives a message. */
export function deliverScript(message: NativeMessage): string {
  return `window.ZakkirNative&&window.ZakkirNative.receive(${JSON.stringify(message)});true;`;
}
