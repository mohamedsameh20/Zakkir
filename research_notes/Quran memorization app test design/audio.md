# Recitation Audio for Quran Memorization Apps: Features, Data Sources, Licensing, and Expo/RN Implementation

Context: target app is the Zakkir Android app (`/mnt/local_disk/zakkir_desktop/mobile`), currently `expo ^53.0.0`, `react-native 0.79.6`, with no audio playback library (no expo-audio / expo-av / track-player) in `mobile/package.json` (checked locally on 2026-10-03). Research date: 2026-10-03.

## 1. Memorization audio features in leading apps

### Takeaway
The common baseline across serious hifz apps is: reciter choice, verse repeat count (including infinite), range repeat count, a configurable delay between repeats, playback speed, offline download, and verse- or word-level follow-along highlighting. Tarteel goes further with voice-driven (AI) word tracking and hidden-word memorization mode, but that is speech recognition, not playback.

### Cited Findings
- **Quran.com (web)**: the Audio Player menu contains Playback Speed, Select Reciter, Download Audio File, Repeat Settings ("moved from the Audio Player control bar"), and an "Experience" group with Auto-Scroll and Word-by-word tooltip — [Quran.com product update](https://quran.com/en/product-updates/simplifying-word-by-word-and-audio-settings)
- **Quran for iOS (quran/quran-ios, the open-source Quran.com iOS app)**: "Advanced Audio Options" include verse repeat count, range repeat count, and delay settings between repetitions. PR #1036 made the counts persist between sessions: "Tapping Play in Advanced Audio Options saves both counts alongside the existing delay settings". Endless repetition is stored as 0, finite counts as positive integers — [quran-ios PR #1036](https://github.com/quran/quran-ios/pull/1036). A separate PR adds an "Audio Playback" settings page — [quran-ios PR #1105](https://github.com/quran/quran-ios/pull/1105)
- **Ayah (Islamic Network)**: described as free, open source, no ads, with a Mushaf view, multiple reciters, "verse-by-verse repeat with adjustable count and pause", and a personal "memorisation" tag. No AI or listening features — [quranicma.com comparison, 2026](https://quranicma.com/best-quran-memorization-apps-2026/) (third-party review, not first-party docs)
- **Tarteel**: memorization mode "hid[es] all the words that you haven't recited yet, and unveil[s] them as you recite". The algorithm "follows you word by word and highlights the section that you're reading", which also works for following an imam or an audio recording — [Tarteel blog](https://tarteel.ai/blog/introducing-automatic-recitation-and-memorization-on-tarteel/). The App Store listing also mentions repeat, audio follow-along (ayah-by-ayah or word-by-word), and custom ranges — [App Store](https://apps.apple.com/us/app/tarteel-ai-quran-memorization/id1391009396). Tarteel also has an "Adaptive Mode" — [Tarteel blog](https://tarteel.ai/blog/tarteel-ai-adaptive-mode/). Premium features are listed on [Tarteel pricing](https://tarteel.ai/pricing)
- A community catalogue of 50+ memorization apps exists for broader comparison — [howtomemorisethequran.com](https://howtomemorisethequran.com/top-quran-memorization-apps/)
- Sleep timers are common in RN audio stacks: RNTP v5 ships a "Sleep Timer with native countdown with optional volume fade-out" — [RNTP v5 release](https://github.com/DoubleSymmetry/react-native-track-player/releases)

### Inferences
- A minimum viable hifz audio spec for Zakkir:
  - reciter picker
  - from/to ayah range
  - verse repeat N (1–10 and infinite)
  - range repeat N (and infinite)
  - a delay between repeats, as fixed seconds or as a multiple of the ayah's duration (for example 1x the ayah length so the user can repeat it back; this is a common hifz technique)
  - speed control from 0.5x to 1.5x
  - download for offline
  - auto-scroll / highlighting of the current ayah
  - background playback with a media notification
  - an optional sleep timer
- Persist the repeat and delay settings, as Quran iOS does (PR #1036). Users complain when they reset.
- The "gap = ayah length" delay is easy with per-ayah files, because each file's duration is known. With gapless surah files you need verse timestamps (QF `timestamps` or mp3quran `ayat_timing`) to know the ayah length and where to seek.

### Gaps
- I could not fetch first-party feature documentation for Ayat (KSU), Quran Companion, Greentech Al Quran, or iQuran in this session's tool budget. I found no verified details of their exact repeat, delay, or speed options, so treat these as unknown.
- I did not verify the exact delay options on Quran.com/Quran iOS (fixed seconds vs. "ayah length" multiples). The PR only confirms that "delay settings" exist.
- The Ayah app's features come from a third-party review site, not from the app's repo or store listing.

## 2. Audio sources: structure, formats, bitrates, licensing

### Takeaway
Per-ayah MP3s with a `SSSAAA.mp3` naming scheme (EveryAyah, which QUL and Quran.com verse audio also mirror) or a 1..6236 global index (islamic.network CDN) are the easiest way to build repeat and range features. None of the free CDNs (EveryAyah, islamic.network, mp3quran.net) publishes an explicit license. The Quran Foundation (QF) API has explicit Developer Terms, but they limit caching to 1 week except through its Content Sync APIs. Licensing is the single biggest open risk.

### Cited Findings
**EveryAyah.com**
- File pattern: `https://everyayah.com/data/{Reciter_Bitrate}/SSSAAA.mp3`, where SSS is the zero-padded surah and AAA the zero-padded ayah (e.g. `001001.mp3`). Each reciter folder also has `000_versebyverse.zip` (full set), `000_checksum.md5`, and a `/zips/` subfolder — [EveryAyah recitations list](https://everyayah.com/recitations_ayat.html)
- Bitrates vary by reciter:
  - 192 kbps: e.g. Sudais, Abdullah Basfar, Hani Rifai, Khalid al-Qahtanee, Muhsin Al Qasim
  - 128 kbps: e.g. Abdul Basit Mujawwad/Murattal, Hudhaify, Husary, Nasser Alqatami, Yasser Ad-Dussary
  - 32–64 kbps: various reciters
  - The site also has Warsh recitations and translation audio (English, Persian, Urdu, Bosnian, Azerbaijani) — [EveryAyah](https://everyayah.com/recitations_ayat.html)
- **Licensing: UNCLEAR.** The recitations page shows no copyright notice, license, or terms-of-use text — [EveryAyah](https://everyayah.com/recitations_ayat.html)

**islamic.network / alquran.cloud CDN**
- Ayah audio: `https://cdn.islamic.network/quran/audio/{bitrate}/{edition}/{number}.mp3`, where `number` is the global ayah index 1–6236. Surah audio: `https://cdn.islamic.network/quran/audio-surah/{bitrate}/{edition}/{number}.mp3` — [alquran.cloud CDN docs](https://alquran.cloud/cdn)
- Bitrates: "Acceptable values are 192, 128, 64, 48, 40 and 32". 128 is recommended generally and 32 for cellular. Not every edition has every bitrate. Example editions: `ar.alafasy`, `ar.husary`, `ar.sudais`. The live list comes from the API — [alquran.cloud CDN](https://alquran.cloud/cdn)
- Served from cdn.islamic.network (and cdn.alislam.ru in Russia), over http and https — [alquran.cloud CDN](https://alquran.cloud/cdn)
- **Licensing: UNCLEAR.** The CDN docs give no license or attribution requirements — [alquran.cloud CDN](https://alquran.cloud/cdn)

**mp3quran.net API v3**
- `GET https://mp3quran.net/api/v3/reciters` takes language, reciter, rewaya, and surah filters. Each reciter has a `moshaf` array with name, `server` URL (e.g. `https://server6.mp3quran.net/akdr/`), total surah count, moshaf type, and a comma-separated list of available surahs. Files are **per surah**, not per ayah — [mp3quran API](https://www.mp3quran.net/eng/api)
- Verse timing endpoints:
  - `GET /api/v3/ayat_timing?surah=X&read=Y` returns per-ayah start/end times in ms
  - `/api/v3/ayat_timing/reads` lists the timed recitations
  - `/api/v3/ayat_timing/soar?read=X` lists the surahs available for a read
  - Source: [mp3quran API](https://www.mp3quran.net/eng/api)
- **Licensing: UNCLEAR.** The API docs have no license, terms, or conditions of use — [mp3quran API](https://www.mp3quran.net/eng/api)

**Quran Foundation (Quran.com) API v4**
- The chapter recitation audio endpoint has a `segments` boolean. When true, the response includes a `timestamps` array with verse keys, verse start/end times, and word `segments` as `[word_index, start_ms, end_ms]`. Without it, the response has the file id, chapter id, file size, format (mp3), and URL — [QF API docs: chapter reciter audio file](https://api-docs.quran.foundation/docs/content_apis_versioned/chapter-reciter-audio-file)
- Auth is required: OAuth2 client credentials, and the docs list 401/403 for a missing token or scope. Content API credentials "must stay on your backend". Mobile/frontend apps use PKCE without a secret — [QF Audio SDK docs (search summary)](https://api-docs.quran.foundation/docs/sdk/javascript/audio/), [QF OAuth2 quickstart](https://api-docs.quran.foundation/docs/quickstart/)
- Caching: "Do not cache or store QF Content for more than 1 week unless QF has expressly permitted longer storage". The exceptions are the Content Sync APIs and bundled font/Mushaf files. Content Sync supports recitations and chapter-recitations, and "Previously synced content may remain available while connectivity to QF is unavailable, even beyond seven days". However, Content Sync recitation rows contain audio **URLs**, not the files themselves — [QF FAQ](https://api-docs.quran.foundation/docs/tutorials/faq/)
- A search-result summary of the QF audio docs said recitation audio "must not be pre-cached" and that streams or caches must expire within 7 days. I could not get the verbatim text (the WebFetch of that page returned no content) — [QF Audio API](https://api-docs.quran.foundation/docs/sdk/javascript/audio/). **Conflict/ambiguity:** the FAQ's Content Sync exception suggests some offline use is allowed, but it is unclear whether downloaded MP3 *files* (as opposed to sync metadata) may be kept beyond 7 days.
- Commercial use: "A Developer may charge for an Application, offer subscriptions or in-app purchases, display advertising, accept donations, or use a freemium model without a separate commercial license". The conditions are that QF Content appears only within the app's end-user experience and is not sold or redistributed separately — [QF FAQ](https://api-docs.quran.foundation/docs/tutorials/faq/)
- Required attribution: "Quran data provided by Quran Foundation." Recitations must also be credited by their named source or edition — [QF FAQ](https://api-docs.quran.foundation/docs/tutorials/faq/)
- Authoritative terms: [QF Developer Terms](https://api-docs.quran.foundation/legal/developer-terms/) (linked from the FAQ; I did not read the full text)

**QUL (Quranic Universal Library, qul.tarteel.ai)**
- 133 recitation resources, in two kinds: ayah-by-ayah and surah-by-surah (gapless). By style: Murattal 35, Mujawwad 5, Muallim 2, Ijazah 1, Kids-repeat 2, plus Taraweeh editions. Downloads come as JSON or SQLite. 59 resources are tagged "with segments", and some have letter-level segment variants — [QUL recitation resources](https://qul.tarteel.ai/resources/recitation)
- Segment data gives "precise timestamps for each word in an Ayah", used to highlight the current word and sync the text with audio — [QUL docs: With segments](https://qul.tarteel.ai/docs/with-segments)
- **Licensing: UNCLEAR.**
  - The QUL FAQ says QUL data can be used in commercial projects but to "review the licensing terms for each resource", noting that some resources may require attribution or have restrictions — [QUL FAQ](https://qul.tarteel.ai/faq)
  - No resource page shows per-resource license text.
  - GitHub issue #772, asking for licensing clarity for bundling in a free offline app, is open with no maintainer response, and issue #747 on the same topic is referenced — [QUL issue #772](https://github.com/TarteelAI/quranic-universal-library/issues/772)
- QUL code repo: [TarteelAI/quranic-universal-library](https://github.com/TarteelAI/quranic-universal-library). Launch post: [Tarteel blog](https://tarteel.ai/blog/qul-launch/)

### Inferences
- **Per-ayah sources fit repeat logic best.** Per-ayah files (EveryAyah, islamic.network, QUL ayah-by-ayah) map directly to a playlist of ayah tracks. Verse repeat becomes "play track N k times", and range repeat becomes "loop playlist slice". You don't need to seek within a long file, and the gap equals the known file duration.
- **Storage estimate (inference, unverified durations).** A full murattal Quran is very roughly 20–30 hours depending on reciter. At 128 kbps (~57.6 MB/hour) that is about 1.1–1.7 GB per reciter. At 64 kbps it is about 0.6–0.85 GB, and at 32 kbps about 0.3–0.45 GB. Real per-reciter sizes should be measured, for example from EveryAyah's `000_versebyverse.zip` Content-Length or QF's `file_size` field.
- **Lowest legal risk for offline download is probably the QF API**, because its terms are explicit. But its 1-week cache rule may conflict with "download full Quran for offline". Ask QF for explicit permission, or use Content Sync. EveryAyah, islamic.network, and mp3quran are widely used by open-source apps, but they have no published license. For a published app, get written permission or at least credit the reciter and source, and flag this as a risk in the design doc.
- mp3quran is surah-level only. Its `ayat_timing` allows verse-level seeking for range and repeat, but per-ayah repeat on a long MP3 means seek-and-loop logic, which is more fragile.

### Gaps
- I did not find a verified license or terms page for EveryAyah, islamic.network/alquran.cloud audio, or mp3quran.net. They may exist on other pages I didn't reach. Reciters' own copyright over the recordings is undocumented everywhere.
- I could not verify Tanzil audio specifically (tanzil.net mainly provides text under its own license). Its audio offering and terms were not researched.
- I don't have verified full-Quran size figures per reciter and bitrate.
- I didn't read the full QF Developer Terms.
- The QF per-verse audio URL base (e.g. `verses.quran.com` / `audio.qurancdn.com`) was not verified in this session.

## 3. Word-level timing / segment data availability and license

### Takeaway
Word-level timings come from two places. One is the QF API: chapter audio with `segments=true` returns `[word_index, start_ms, end_ms]` per word, under the QF Developer Terms (attribution required, 1-week cache rule). The other is QUL: 59 recitations with word segments, and some with letter segments, downloadable as JSON or SQLite, but with an **unclear license**. mp3quran gives only verse-level (ayah) timings.

### Cited Findings
- QF chapter audio `segments=true` returns verse `timestamps` with word segments `[word_index, start_ms, end_ms]` in ms — [QF API docs](https://api-docs.quran.foundation/docs/content_apis_versioned/chapter-reciter-audio-file)
- QUL has 59 recitations "with segments" (word-level timestamps), downloadable as JSON or SQLite, and some letter-level variants — [QUL recitations](https://qul.tarteel.ai/resources/recitation), [QUL With segments docs](https://qul.tarteel.ai/docs/with-segments)
- QUL licensing for datasets is not stated per resource, and the GitHub issue asking for clarity is unanswered — [QUL issue #772](https://github.com/TarteelAI/quranic-universal-library/issues/772), [QUL FAQ](https://qul.tarteel.ai/faq)
- mp3quran `ayat_timing` gives per-ayah start/end (ms) for selected reads only — [mp3quran API](https://www.mp3quran.net/eng/api)

### Inferences
- Word timings belong to a specific recording, so the highlighting data must match the exact audio source and edition. Mixing EveryAyah audio with QF segments is not safe unless the recordings are identical.
- Implementation: poll position every ~50–100 ms (expo-audio player status, or RNTP `useProgress`). Then binary-search the segment array for the current word index.

### Gaps
- I did not verify whether QF per-verse (ayah-by-ayah) recitation endpoints also return word segments, or only chapter audio does.
- The license for QUL segment data is unresolved, so bundling it offline in a distributed app carries unclear legal risk.

## 4. React Native / Expo implementation (2026)

### Takeaway
**expo-audio** (current Expo SDK docs, SDK 57) now covers what's needed: background playback via config plugin, Android media session and notification through `setActiveForLockScreen`, gapless `useAudioPlaylist` with loop modes, and `playbackRate` from 0.1 to 2.0 with pitch correction. The app is on SDK 53, though, and changelog evidence suggests lock screen controls in that era were **iOS-only** (expo-audio 0.4.8). Plan to **upgrade the Expo SDK** before relying on expo-audio for background hifz playback. **react-native-track-player v5** (`@rntp/player`) is Media3-based with a sleep timer and caching, but it is **commercially licensed**. v4 stays Apache-2.0 but is legacy.

### Cited Findings
**expo-audio**
- Config plugin `enableBackgroundPlayback: true` adds `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_MEDIA_PLAYBACK` permissions on Android and declares the service `expo.modules.audio.service.AudioControlsService` with `foregroundServiceType="mediaPlayback"`, using a `androidx.media3.session.MediaSessionService` intent filter. On iOS it adds the `audio` UIBackgroundMode — [Expo audio docs (latest)](https://docs.expo.dev/versions/latest/sdk/audio/)
- "On Android, you have to enable the lock screen controls with `setActiveForLockScreen` for sustained background playback. Otherwise, the audio will stop after approximately 3 minutes" — [Expo audio docs](https://docs.expo.dev/versions/latest/sdk/audio/)
- Runtime setup: `setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' })`. `setActiveForLockScreen(active, metadata, options)` takes title, artist, album, and artwork, and `AudioLockScreenOptions` has `showSeekForward`/`showSeekBackward`/`isLiveStream` — [Expo audio docs](https://docs.expo.dev/versions/latest/sdk/audio/)
- Playlists:
  - `useAudioPlaylist(options)` / `createAudioPlaylist()` support gapless playback, with `add`, `insert`, `remove`, `clear`, `next`, `previous`, and `skipTo`
  - Loop modes are `'none' | 'single' | 'all'`
  - Single players have a `loop` boolean
  - Source: [Expo audio docs](https://docs.expo.dev/versions/latest/sdk/audio/)
- `playbackRate` is 0.1–2.0 on Android and 0.0–2.0 on iOS. `setPlaybackRate(rate, pitchCorrectionQuality)`, where quality is iOS-only — [Expo audio docs](https://docs.expo.dev/versions/latest/sdk/audio/)
- The docs currently served are for **SDK 57**. Requesting the v53 URL returned the latest content — [Expo docs](https://docs.expo.dev/versions/v53.0.0/sdk/audio/)
- Changelog entries:
  - 0.4.8 (2025-07-03, SDK 53 era): "Support lock screen controls" — iOS
  - 1.0.0 (2025-08-13, SDK 54): "Prevent autoplaying when setting the playback rate"
  - 1.1.0 (2025-12-11): added `showSeekForward`/`showSeekBackward`
  - Source: [expo-audio CHANGELOG (sdk-54 branch)](https://github.com/expo/expo/blob/sdk-54/packages/expo-audio/CHANGELOG.md)
  - An iOS lock screen fix PR: [expo PR #40919](https://github.com/expo/expo/pull/40919)
- A recent PR changes the `enableBackgroundPlayback` default to false, so set it explicitly — [expo PR #49880](https://github.com/expo/expo/pull/49880)

**react-native-track-player (RNTP)**
- v5.0.0 is a full rewrite, shipped as the new npm package `@rntp/player`. It uses TurboModule + JSI with synchronous getters (`getProgress()`, `getQueue()`, `isPlaying()`), a Media3 core on Android for queueing, caching, and playback control, a native sleep timer with fade-out, caching and preloading, and hooks. It requires RN ≥ 0.76 with the New Architecture and bridgeless mode — [RNTP releases](https://github.com/DoubleSymmetry/react-native-track-player/releases), [RNTP repo](https://github.com/doublesymmetry/react-native-track-player)
- "Starting with V5, react-native-track-player is commercially licensed. Personal and educational use remains free; commercial use requires a paid license." v4 (`react-native-track-player`) remains Apache-2.0 on its last release. Pricing is at rntp.dev — [RNTP repo](https://github.com/doublesymmetry/react-native-track-player), [rntp.dev](https://www.rntp.dev/)
- Comparison article: [LogRocket: RNTP vs Expo Audio](https://blog.logrocket.com/react-native-track-player-vs-expo-audio/)

**Android / Google Play policy**
- Apps targeting Android 14+ must declare foreground service types. A mediaPlayback service needs the `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_MEDIA_PLAYBACK` permissions — [Android 14 FGS types](https://developer.android.com/about/versions/14/changes/fgs-types-required), [Declare FGS](https://developer.android.com/develop/background-work/services/fgs/declare)
- Play Console's App content page requires a declaration for each type, covering:
  1. a functionality description
  2. the user impact if deferred or interrupted
  3. "a link to a video demonstrating each foreground service feature"
  4. a selected use case
  - The allowed mediaPlayback use cases are "Continue audio or video playback from the background, including streaming" and Picture-in-Picture. The service must be "user perceptible", through user initiation or a notification — [Play Console Help: FGS requirements](https://support.google.com/googleplay/android-developer/answer/13392821?hl=en)
- Google's recommended pattern for background playback is Media3 `MediaSessionService` — [Android Media3 background playback](https://developer.android.com/media/media3/session/background-playback). expo-audio's service uses this.

### Inferences
- **Recommended path:** upgrade Zakkir mobile to a current Expo SDK, then use expo-audio with:
  - `enableBackgroundPlayback: true`
  - `setActiveForLockScreen` (mandatory, or Android kills playback after ~3 min)
  - an `AudioPlaylist` of per-ayah sources
- **Repeat logic belongs in JS.** For verse repeat N, either insert duplicates into the playlist, or use `loop: 'single'` and count completions with a status listener. For the delay ("gap = ayah length"), pause, wait `duration × k`, then resume. Pausing in background may let Android reclaim the service if the media session goes inactive, so an alternative is to insert a generated silent MP3 of the needed length as a track. Test this on a device. Range repeat N can use the playlist `'all'` loop plus a counter.
- **RNTP v5** is technically the strongest option (Media3 queue, caching, native sleep timer), but Zakkir would need a paid license for any commercial distribution. Whether a free, ad-free app counts as "commercial" should be checked on rntp.dev. RNTP v4 is Apache-2.0 but legacy, and its compatibility with RN 0.79 New Architecture was not verified.
- **Downloads:** use `expo-file-system` with per-reciter folders, e.g. `documentDirectory/audio/{reciter}/SSSAAA.mp3`. Download per surah or on demand, and check against EveryAyah's `000_checksum.md5` when using that source. Show storage use per reciter, since one reciter is roughly 0.3–1.7 GB depending on bitrate.
- **Play Store submission:** prepare the FGS mediaPlayback declaration and a demo video showing the user starting recitation and backgrounding the app.

### Gaps
- I could not confirm the exact expo-audio version bundled with SDK 53, or whether Android lock screen/media session and `useAudioPlaylist` existed in SDK 53. The changelog evidence points to iOS-only lock screen support then, so verify against `expo-audio@~0.4.x` docs or the SDK 54/55 release notes.
- I did not research the expo-file-system API changes in recent SDKs (the new `File`/`Directory` API vs legacy `downloadAsync`/`createDownloadResumable`), or background download behavior when the app is killed.
- I did not verify RNTP v5 pricing tiers or how it defines "commercial", nor whether RNTP v5 has an Expo config plugin.
- No measured data on gapless transition quality between per-ayah MP3s (encoder padding) in expo-audio playlists.
