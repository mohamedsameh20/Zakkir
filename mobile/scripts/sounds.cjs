// Single source of truth for the notification sounds shared by the WebView
// renderer, the Android notification channels, and the Expo config plugin.
//
// The web/desktop assets live in <repo-root>/sounds as kebab-case files
// (adhan-1.mp3). Android resource names may only contain lowercase letters,
// digits and underscores, so the Android copies are named adhan_1.mp3 etc.
// and are generated into mobile/assets/sounds (git-ignored, derived output).

const fs = require("fs");
const path = require("path");

const mobile = path.resolve(__dirname, "..");
const root = path.resolve(mobile, "..");

// Order matches the SOUNDS list rendered by popup.js. "silent" is intentionally
// absent: it is the absence of a sound, handled by a dedicated silent channel.
// The adhan recordings (adhan-1, adhan-2) are left out of the Android app until
// their source and rights are confirmed; the browser extension still ships them.
const SOUND_IDS = ["chime", "bell", "soft-ping"];

const ANDROID_SOUNDS_DIR = path.join(mobile, "assets", "sounds");

/** Android resource-safe basename for a sound id, without extension. */
function androidResourceName(soundId) {
  return String(soundId).replace(/-/g, "_");
}

/** Path, relative to the mobile project root, used by the config plugin. */
function androidAssetRelativePath(soundId) {
  return `./assets/sounds/${androidResourceName(soundId)}.mp3`;
}

/**
 * Copy <root>/sounds/<id>.mp3 to mobile/assets/sounds/<id_underscored>.mp3.
 * Only rewrites when the contents differ so repeated builds stay incremental.
 */
function syncAndroidSoundAssets() {
  fs.mkdirSync(ANDROID_SOUNDS_DIR, { recursive: true });
  const written = [];
  for (const soundId of SOUND_IDS) {
    const source = path.join(root, "sounds", `${soundId}.mp3`);
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
