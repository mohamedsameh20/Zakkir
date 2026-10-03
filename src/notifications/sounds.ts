// Notification sounds. Android decides the sound from the channel, not from
// the individual notification, and a channel's sound is immutable once
// created. So there is one channel per selectable sound, picked at schedule
// time. Resource names must match the files the expo-notifications config
// plugin copies into res/raw (see scripts/sounds.cjs).

export const SOUND_IDS = ["chime", "soft-ping"] as const;
export const SILENT_SOUND_ID = "silent";
export const DEFAULT_SOUND_ID = "chime";
// Sounds that earlier builds registered channels for but no longer ship.
// The bell is gone for good: a hadith in Sahih Muslim censures bells.
export const REMOVED_SOUND_IDS = ["adhan-1", "adhan-2", "bell"];

export const SOUND_LABELS: Record<string, string> = {
  chime: "Chime",
  "soft-ping": "Soft Ping",
  [SILENT_SOUND_ID]: "Silent",
};

/** res/raw resource name for a sound id, as written by scripts/sounds.cjs. */
export function soundResource(soundId: string): string {
  return `${soundId.replace(/-/g, "_")}.mp3`;
}

/** Channel id for a sound id. Stable across launches so channels are reused. */
export function channelIdFor(soundId: string): string {
  return `prayer-reminders-${soundId.replace(/-/g, "_")}`;
}

/** Normalise whatever the WebView persisted into a known sound id. */
export function resolveSoundId(value: unknown): string {
  const id = typeof value === "string" ? value : "";
  if (id === SILENT_SOUND_ID) return SILENT_SOUND_ID;
  return (SOUND_IDS as readonly string[]).includes(id) ? id : DEFAULT_SOUND_ID;
}
