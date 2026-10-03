# Zakkir for Android

Prayer times, reminders and Azkar (Hisn al-Muslim) on Android.

This branch (`zakkir-android`) holds only the Android app. The other Zakkir
versions live on their own branches: the Firefox extension on
`zakkir-firefox`, and the retired desktop (Electron) app on `main`.

## How it is built

The app is an Expo / React Native shell around a WebView.

- `App.tsx` is the native shell: it hosts the WebView, stores settings, and
  handles haptics and the back button.
- `src/bridge.ts` types every message between the shell and the page; the
  page side is `web/bridge.js` (`window.ZakkirNative`). Change both together.
- `src/notifications/` schedules prayer notifications: `plan.ts` is the pure
  planning logic, `schedule.ts` talks to `expo-notifications`.
- `web/` is the UI that runs inside the WebView: `popup.js`, `popup.css`,
  `mobile.css` (Android layout on top of `popup.css`), the Azkar data, fonts
  and sounds.
- `scripts/generate-renderer.cjs` inlines `web/` into `renderer.generated.ts`,
  a single HTML document. `scripts/sounds.cjs` copies the notification sounds
  to `assets/sounds/` for Android's `res/raw`. Both outputs are generated on
  every build and are not committed.

## Development

```bash
npm install
npm run typecheck   # regenerate the renderer and type-check
npm test            # unit tests + renderer smoke test (node:test)
```

The smoke test (`tests/renderer.smoke.cjs`) loads the generated renderer in
headless Chromium with a fake native bridge and clicks through every view. It
needs `npm run generate-renderer` first and skips if no Chromium/Chrome is
found (set `CHROME_BIN` to point at one).

### Quick checks on the emulator (Expo Go)

```bash
npm run generate-renderer && npx expo start --android
```

This loads the app in Expo Go with no native build. Expo Go doesn't apply
`app.json` config plugins, so custom notification sounds can only be checked
in a real APK.

### Local release build

On NixOS, `shell.nix` provides JDK 17 and the Android SDK paths. If `nix-shell`
is unavailable, export them yourself:

```bash
export JAVA_HOME=$(nix-build '<nixpkgs>' -A jdk17 --no-out-link)
export ANDROID_HOME=$HOME/Android/Sdk ANDROID_SDK_ROOT=$HOME/Android/Sdk
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

npx expo prebuild --platform android --no-install   # first time, or after app.json changes
npm run build:apk
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

The release variant is used because debug builds expect a Metro dev server.

### Release builds (CI)

`.github/workflows/android.yml` runs on every push to `zakkir-android`. It
regenerates everything from source, type-checks, runs the unit tests, prebuilds,
assembles the release APK and uploads it as the `zakkir-android-apk` artifact.

## Credits

- Prayer times: [AlAdhan API](https://aladhan.com)
- Azkar: Hisn al-Muslim
