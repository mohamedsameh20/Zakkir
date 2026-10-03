// Single source of truth for the notification sounds shared by the WebView
// renderer, the Android notification channels, and the Expo config plugin.
//
// The web assets live in web/sounds as kebab-case files (soft-ping.mp3).
// Android resource names may only contain lowercase letters, digits and
// underscores, so the Android copies are named soft_ping.mp3 etc. and are
// generated into assets/sounds (git-ignored, derived output).

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

// Order matches the SOUNDS list rendered by popup.js. "silent" is intentionally
// absent: it is the absence of a sound, handled by a dedicated silent channel.
// The adhan recordings (adhan-1, adhan-2) stay out of the app until their
// source and rights are confirmed. There is deliberately no bell: a hadith in
// Sahih Muslim calls the bell "the flute of Shaytan".
const SOUND_IDS = ["chime", "soft-ping"];

const ANDROID_SOUNDS_DIR = path.join(root, "assets", "sounds");

/** Android resource-safe basename for a sound id, without extension. */
function androidResourceName(soundId) {
  return String(soundId).replace(/-/g, "_");
}

/** Path, relative to the project root, used by the config plugin. */
function androidAssetRelativePath(soundId) {
  return `./assets/sounds/${androidResourceName(soundId)}.mp3`;
}

/**
 * Copy web/sounds/<id>.mp3 to assets/sounds/<id_underscored>.mp3.
 * Only rewrites when the contents differ so repeated builds stay incremental.
 */
function syncAndroidSoundAssets() {
  fs.mkdirSync(ANDROID_SOUNDS_DIR, { recursive: true });
  const written = [];
  for (const soundId of SOUND_IDS) {
    const source = path.join(root, "web", "sounds", `${soundId}.mp3`);
    if (!fs.existsSync(source)) continue;
    const destination = path.join(ANDROID_SOUNDS_DIR, `${androidResourceName(soundId)}.mp3`);
    const incoming = fs.readFileSync(source);
    let identical = false;
    if (fs.existsSync(destination)) {
      identical = fs.readFileSync(destination).equals(incoming);
    }
    if (!identical) fs.writeFileSync(destination, incoming);
    written.push(destination);
  }
  // Drop sounds that were removed from SOUND_IDS so they stop being bundled.
  for (const name of fs.readdirSync(ANDROID_SOUNDS_DIR)) {
    const file = path.join(ANDROID_SOUNDS_DIR, name);
    if (name.endsWith(".mp3") && !written.includes(file)) fs.rmSync(file);
  }
  return written;
}

module.exports = {
  SOUND_IDS,
  ANDROID_SOUNDS_DIR,
  androidResourceName,
  androidAssetRelativePath,
  syncAndroidSoundAssets,
};
