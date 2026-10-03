# Page-exact Madani mushaf rendering with per-word interactivity, and licensing of the fonts and text

Scope: rendering the 604-page King Fahd Complex (KFGQPC) Madani mushaf with the printed line breaks, in an Expo / React Native Android app (possibly inside a WebView), so individual words can be hidden, revealed, and highlighted for memorization self-tests. Current as of 2026-10-03. Measurements marked "measured" were taken on 2026-10-03 with `curl -I` against the Quran Foundation font CDN.

## Q1. QCF fonts: v1 vs v2 vs v4 and tajweed, the per-page glyph model, file counts and sizes, loading strategies, and the single-font "Uthmanic HAFS" alternative

### Takeaway
QCF fonts come in one file per page (604 files per version). Each glyph is one whole word, already shaped and kashida-stretched the way it appears on that printed page. So you get a page-exact result by putting the word glyphs (`code_v1` or `code_v2`) on the right lines with a per-page font. Measured per-page woff2 sizes are about 15–190 KB, and a full version set is in the tens of MB (about 45 MB for V2 woff2 according to one project). The usual approach is to load on demand: the current page plus its neighbours. A single Unicode font (KFGQPC Uthmanic Script HAFS, `text_qpc_hafs`) is far smaller, but it only matches the printed page when you also force line breaks from layout data, and even then letter shapes and widths will not match the print exactly.

### Cited Findings
**Versions**
- QUL lists these Madani layouts: "KFGQPC V1 layout (1405H print)", "KFGQPC V2 layout (1421H print)", "KFGQPC V4 layout (1441H print)", plus "Digital Khatt (KFGQPC V2 1421H print)", "Mushaf Qatar" and others. — [QUL Mushaf Layouts](https://qul.tarteel.ai/resources/mushaf-layout)
- QUL's glyph docs say V1 is a "digitized version of the Mushaf written by Uthman Taha and published in 1405H". They date V2 to "around 1423H". V4 has "tajweed color embedded in the font" and is described as "currently disabled pending proofreading" on that docs page. — [QUL Glyph-based docs](https://qul.tarteel.ai/docs/glyph-based). **Conflict:** the QUL layout listing ([QUL](https://qul.tarteel.ai/resources/mushaf-layout)) and [furqan-app issue #601](https://github.com/furqan-app/web/issues/601) call V2 the 1421H print. "1421H" is the more widely used label.
- V1 and V2 do not share the same pagination. One summary says 36 pages move to the 1421H pagination in V2 relative to V1. (This came from a search-result snippet tied to the furqan-app PRs and is not independently verified.) — [furqan-app PR #711](https://github.com/furqan-app/web/pull/711) / [issue #601](https://github.com/furqan-app/web/issues/601)
- On Quran Foundation (quran.com), mushaf ID 1 is QCF V2 (604 pages) and ID 2 is QCF V1 (604 pages). ID 19 is QCF Tajweed V4, which also uses the `code_v2` field. ID 5 is KFGQPC Hafs (Unicode, `text_qpc_hafs`) and ID 11 is Tajweed. — [QF Page Layout guide](https://api-docs.quran.foundation/docs/tutorials/fonts/page-layout/); [QF Font Rendering guide](https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/)
- Tajweed V4 ships as COLRv1 (`/hafs/v4/colrv1/woff2/p{PAGE}.woff2`) for Chrome, Safari and Edge, and as OT-SVG with light, dark and sepia themes (`/hafs/v4/ot-svg/{theme}/woff2/p{PAGE}.woff2`) for Firefox. Colours are selected with CSS `font-palette`. — [QF Font Rendering guide](https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/)

**How the per-page glyph fonts work**
- "Each glyph is a whole word, drawn exactly as it appears on one specific page, so there is one font file per mushaf page — 604 per version". The glyphs are already shaped and kashida-stretched. — [quranportal.io blog](https://quranportal.io/blog/rendering-the-quran-mushaf-digitally) and the [QF font rendering guide](https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/) (search summary)
- QUL: "custom ligatures where each glyph represents an entire word rather than individual letters". Each glyph font must be paired with its matching script, i.e. the glyph-code text. — [QUL QPC V2 font page](https://qul.tarteel.ai/resources/font/249)
- nuqayah/qpc-fonts notes that "Mushaf fonts use a character to represent each word". The repo has `mushaf-v1.5`, `mushaf-v2`, `mushaf-v4-hafs`, `mushaf-v4-warsh`, `mushaf-woff` and `mushaf-woff2` directories. The V2 files are named `QCF2001…QCF2604.ttf`. — [nuqayah/qpc-fonts](https://github.com/nuqayah/qpc-fonts); [furqan-app #601](https://github.com/furqan-app/web/issues/601)
- QF CDN URL pattern: `https://verses.quran.foundation/fonts/quran/hafs/{v1|v2}/{woff2|woff|ttf}/p{1..604}.{ext}`. The font family is registered per page, e.g. `p${page}-v2`, with `new FontFace(...)` and `document.fonts.add`. — [QF Font Rendering guide](https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/)
- The QF rendering rules are: insert glyph codes with `innerHTML`, not `textContent`. Draw verse-end markers (`char_type_name === 'end'`) with a Unicode font, not QCF. Show `text_qpc_hafs` as fallback text while a QCF page font loads. — [QF Font Rendering guide](https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/)
- QF's sizing guidance for QCF V2: scale 3 (default) is 5.3vw on mobile. From scale 4 and up, the strict mushaf line boundaries are relaxed ("Big Text Layout"). — [QF Font Rendering guide](https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/); [QF Page Layout guide](https://api-docs.quran.foundation/docs/tutorials/fonts/page-layout/)

**Sizes**
- Measured on the QF CDN (Content-Length, pages 1 / 2 / 50 / 300 / 604):
  - V1 woff2: 15.3 / 29.9 / 75.4 / 83.5 / 38.2 KB
  - V1 ttf: 27.2 / 83.4 / 150.9 / 159.0 / 100.2 KB
  - V2 woff2: 41.0 / 43.0 / 122.0 / 189.9 / 53.3 KB
  - V2 ttf: 618.7 / 357.9 / 323.3 / 346.2 / 163.0 KB
  - V4 COLRv1 woff2: p1 27.4 KB, p300 85.1 KB
  - Source: `https://verses.quran.foundation/fonts/quran/hafs/...` (measured; see the [QF Font Rendering guide](https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/) for the URL scheme)
- furqan-app gives the converted V2 set (604 woff2) as "~45 MB, committed to git same as `v1/` and `v4/`". — [furqan-app issue #601](https://github.com/furqan-app/web/issues/601)
- SakinaDevGroup/al_quran_madani (Madani 1405, i.e. V1) bundles 604 woff2 files (`QCF_P001…QCF_P604.woff2`), a surah-header and a bismillah colour font, and layout JSON. The whole package is 46 MB (48,313,358 bytes). — [SakinaDevGroup/al_quran_madani](https://github.com/SakinaDevGroup/al_quran_madani)
- One Expo app's issue estimates "604 families, roughly 200KB each … on the order of 120MB of registered fonts in one process". That is about the size of the TTFs, not the woff2 files. — [J3ff4/quran-corpus #106](https://github.com/J3ff4/quran-corpus/issues/106)

**Loading strategies**
- QF recommends loading only the visible pages, never all 604. Preload critical fonts, use `font-display: swap`, and cache the names of fonts already loaded. — [QF Font Rendering guide](https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/)
- quranportal: preload the current page font and prefetch the adjacent ones, so "only 3 fonts per page (current + next + previous)" are loaded at a time. — [quranportal.io blog](https://quranportal.io/blog/rendering-the-quran-mushaf-digitally)
- furqan-app (offline-first PWA) precaches the default edition (V2) at install time and offers the other editions (V1, Tajweed) as opt-in downloads. — [furqan-app #601](https://github.com/furqan-app/web/issues/601)
- The Flutter package `qcf_quran` bundles all 604 page fonts (`QCF_P001…QCF_P604`, plus `QCF_BSML` for symbols). It warns that "~600 font files increase the package size". — [pub.dev qcf_quran](https://pub.dev/packages/qcf_quran)

**Single Unicode font alternative**
- QF lists QPC Hafs (`UthmanicHafs1Ver18.woff2`/`.ttf`, field `text_qpc_hafs`, mushaf 5) as the "Quick setup" option: one font file for all of the text. — [QF Font Rendering guide](https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/)
- Image-first advocates argue that rendering from text fonts means "lines break in different places on different devices and diacritics shift, and the page never matches the printed mushaf". — [nedaa.dev](https://nedaa.dev/docs/building-a-quran-app/) (search summary)

### Inferences
- For a memorization app whose user reads the 1421H (current KFGQPC) print, V2 (`code_v2`, mushaf 1) is the natural default. Only use V1 if the target users memorized from the 1405H print.
- Per-page woff2 averages roughly 50–100 KB, which puts a full V2 woff2 set at about 40–60 MB. This fits furqan's ~45 MB. Bundling the full set in an APK is feasible, but it is better to ship a first-run download or an Android asset pack, or to bundle only the pages being memorized.
- With the Unicode HAFS font plus QUL or QF line data, you can force the right words onto each line (`first_word_id..last_word_id`). Justification, though, has to come from inter-word spacing or kashida/tatweel insertion by the renderer. The result is "line-exact", not "glyph-exact".

### Gaps
- I could not complete a full sweep of all 604 file sizes per version: the CDN throttled the bulk HEAD requests. The totals above are estimates from 5 sampled pages plus third-party figures.
- I found no authoritative statement on how far the HAFS Unicode font's metrics drift from the print. The "not page-exact" claim rests on practitioner blogs.
- The status of V4 tajweed glyph proofreading ("disabled pending proofreading" on QUL versus live on QF as mushaf 19) is inconsistent across sources.

## Q2. Layout data: quran.com API v4 word fields, QUL layout databases, Tanzil metadata, and offline databases

### Takeaway
There are two ways to get line layout. One is the QF Content API, which returns words with `page_number`, `line_number` and `code_v1`/`code_v2`, and then you group the words by page and line. The other is QUL's downloadable SQLite/JSON layout databases: a `pages` table with one row per line (`line_type`, `is_centered`, `first_word_id`, `last_word_id`, `surah_number`) joined to a words or script database by word ID. QUL is the better source for offline use, since the QF API cannot be bundled (see Q5).

### Cited Findings
- QF word objects carry `page_number`, `line_number` (1–15, or 1–16 for some IndoPak), `position`, `text_uthmani`, `code_v1`, `code_v2` and `text_indopak`. Request them with `words=true&word_fields=code_v2,text_qpc_hafs,page_number,line_number&mushaf=1`. — [QF Page Layout guide](https://api-docs.quran.foundation/docs/tutorials/fonts/page-layout/); [QF Font Rendering guide](https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/)
- Grouping: "a single Mushaf line often contains words from multiple verses". Group by key `page-{page_number}-line-{line_number}` and render RTL. — [QF Page Layout guide](https://api-docs.quran.foundation/docs/tutorials/fonts/page-layout/)
- The QF Page Layout guide does not cover basmalah or centred-line formatting. — [QF Page Layout guide](https://api-docs.quran.foundation/docs/tutorials/fonts/page-layout/)
- QUL layout DB, `pages` table columns:
  - `page_number`, `line_number`, `surah_number`
  - `line_type`: one of `ayah`, `surah_name`, `basmallah`
  - `is_centered`: centred (true) versus "fully justified" (false)
  - `first_word_id`, `last_word_id`: inclusive range of word IDs into the script DB
  - [QUL Mushaf layout docs](https://qul.tarteel.ai/docs/mushaf-layout); [QUL tutorial](https://qul.tarteel.ai/docs/tutorial-mushaf-layout-end-to-end)
- QUL words/script DB columns: `word_index`, `word_key`, `surah`, `ayah`, `text`. You need three parts: the word-by-word script, a compatible font, and the layout, plus surah names from metadata if wanted. — [QUL Mushaf layout docs](https://qul.tarteel.ai/docs/mushaf-layout)
- QUL offers its layouts as SQLite, JSON, DOCX and images. The tutorial points to sign-in (`/users/sign_in`) for downloads. — [QUL Mushaf Layouts](https://qul.tarteel.ai/resources/mushaf-layout); [QUL tutorial](https://qul.tarteel.ai/docs/tutorial-mushaf-layout-end-to-end)
- The Madinah layout's line-mapping table holds about 9,046 page-line records. — [quranportal.io blog](https://quranportal.io/blog/rendering-the-quran-mushaf-digitally)
- SakinaDevGroup ships its layout as `quran_pages.json`: 604 pages, each `{ "l": [ …lines ] }`. Line types are text, surah header, basmala and ayah line. A separate `pages_info.json` is 15 KB. — [SakinaDevGroup/al_quran_madani](https://github.com/SakinaDevGroup/al_quran_madani)
- quran_android and quran.com-images use a glyph-bounds database ("ayahinfo") for highlighting. It records "the bounds of each of the generated glyphs (allowing apps to highlight individual words or verses)". — [quran/quran.com-images](https://github.com/quran/quran.com-images); [nedaa.dev](https://nedaa.dev/docs/building-a-quran-app/)

### Inferences
- A minimal offline bundle would contain:
  - the QUL V2 layout SQLite (one row per line);
  - the QUL QPC V2 glyph script (one glyph code per word, keyed by word ID, also holding `surah:ayah:word`);
  - an optional plain Uthmani/Tanzil text column for search and accessibility;
  - the 604 woff2 files.
- Word ID → `surah:ayah:word` gives a stable key for storing memorization results per word.

### Gaps
- I could not find exact file sizes for the QUL layout SQLite or the glyph-script SQLite: the pages are behind sign-in or not stated.
- I did not check Tanzil's own metadata (`quran-data.xml` page/juz/hizb boundaries) in this round. It has page starts but no line layout, so it is not enough for line-exact rendering.

## Q3. How open-source apps do it, and how to hide a word

### Takeaway
The production apps take one of two approaches.
- **Images plus a glyph-bounds DB:** quran_android/iOS, generated by quran.com-images from the old KFGQPC fonts. Highlights and masks are drawn as rectangles over the image.
- **Per-page QCF fonts plus line layout:** quran.com web, furqan, the al_quran_madani WebView renderer, the qcf_quran Flutter package. Every word is its own span or text run.

Font rendering suits per-word hide/reveal best: each word is a DOM node, and hiding it as transparent or with `visibility:hidden` keeps its advance width, so the justification does not move. With images, you draw a mask rectangle over each word's bounds.

### Cited Findings
- quran.com-images: scripts "generate Quran page images using old madani fonts provided by the King Fahd Quran Complex". The output also includes a database of glyph bounds for highlighting words or verses. The code is GPL, but "the actual fonts and pages … belong to the King Fahd Quran Complex". — [quran/quran.com-images](https://github.com/quran/quran.com-images)
- The quran_android app is GPL-3.0. Its Madani images come from the quran.com-images project. Qaloon and Naskh images are "used with permission" of their publishers. — [quran/quran_android](https://github.com/quran/quran_android)
- The image approach has three layers: page images (one per page, per edition, per theme), a bounds DB (surah, verse, line, x-offset and width per glyph) and a separate text DB for search. Highlighting works by grouping a verse's glyphs by line and reducing each group to a rectangle. A line-by-line mode uses 9,060 files per edition; multi-GB editions need pause/resume. — [nedaa.dev](https://nedaa.dev/docs/building-a-quran-app/)
- SakinaDevGroup/al_quran_madani is a single `index.html` with no external dependencies, meant to run inside a WebView (e.g. Flutter `flutter_inappwebview`). It is driven through `initializeData()` and `loadPage()`. "Every word is a `<span class="word">` carrying `data-surah`, `data-ayah` and `data-page`". — [SakinaDevGroup/al_quran_madani](https://github.com/SakinaDevGroup/al_quran_madani)
- quranportal's technique: `text-align: justify` with `text-align-last: justify` on each line, and `font-size: 0` on the line container (restored on the word spans) to remove whitespace between inline elements, which would otherwise break justification. Words are clickable `<span id="word-N">` elements with highlight states for mistake tracking. — [quranportal.io blog](https://quranportal.io/blog/rendering-the-quran-mushaf-digitally)
- furqan-app (web/PWA) uses per-page font faces with `fontFamily: (p) => "quran-p{p}-v2"` via `page-font-registry.ts`. — [furqan-app #601](https://github.com/furqan-app/web/issues/601)
- qcf_quran (Flutter) bundles all 604 fonts and renders with native Flutter text. It documents no word-level hide or highlight API. — [pub.dev qcf_quran](https://pub.dev/packages/qcf_quran)
- An Expo/React Native app (J3ff4/quran-corpus) registers one QCF family per page through `expo-font` (`useMushafPageFont`) and never evicts them, because "expo-font has no unload". The proposed fixes are to cap the number of registered families or to "migrate page glyph rendering away from `expo-font` entirely". — [J3ff4/quran-corpus #106](https://github.com/J3ff4/quran-corpus/issues/106)
- Tarteel's memorization mode "hides all the words that haven't been recited yet, and unveils them as the user recites". Users can also hide ayah markers. The "Peeking & Hidden Verses Mode" is a Premium feature. — [Tarteel App Store listing](https://apps.apple.com/us/app/tarteel-ai-quran-memorization/id1391009396) (via search summary)
- Other GitHub references:
  - [6km/react-quran](https://github.com/6km/react-quran) (React)
  - [AxeemHaider/hafiz-quran #10](https://github.com/AxeemHaider/hafiz-quran/issues/10): a spec for a line-faithful mushaf reader using Skia
  - [tlawat/remotion-mushaf-line-renderer](https://github.com/tlawat/remotion-mushaf-line-renderer/pull/5)

  I did not inspect these in depth.

### Inferences
**Ways to hide a word without reflowing the line, best first**
1. **Transparent or invisible glyph.** In HTML/CSS, `color: transparent` or `visibility: hidden` on the word span. The glyph keeps its advance width, so justification and line breaks stay the same. You can add a background "pill" or dotted underline so the hidden slot stays visible and tappable. (Standard CSS behaviour; this is the most robust method.)
2. **Mask overlay.** An absolutely positioned rectangle over the word's bounding box (`getBoundingClientRect` in a WebView, or bounds-DB rectangles over images).
3. **Placeholder replacement.** Avoid this. A different glyph or string has a different width, so the line re-justifies and the page no longer matches the print. If you need it, give the placeholder a fixed width equal to the measured word width.

**Reveal and highlight.** Toggle a class on the word span: a colour change for revealed, red/green for graded. On images, tint rectangles from the bounds DB.

**Recommended architecture for Expo/React Native.** Render the mushaf page in a `react-native-webview`, using local HTML in the style of al_quran_madani, with:
- `@font-face`/`FontFace` loading woff2 from app storage (`file://`), with the current page plus neighbours loaded;
- old faces released as you move through the book (the browser can drop them, which avoids the expo-font no-unload ceiling);
- tap events sent to RN with `postMessage({surah, ayah, word})`;
- hide/reveal state pushed into the page with `injectJavaScript`.

### Gaps
- I did not inspect the source of quran.com-frontend-next or the Tarteel app in this round. How exactly they draw hidden words (transparent glyph or mask) is unconfirmed.
- I found no well-maintained React Native (non-WebView) mushaf library with QCF support.

## Q4. React Native `Text` versus WebView/HTML

### Takeaway
Because QCF glyphs are pre-shaped whole words, complex Arabic shaping is not the risk in either approach. The differences are in justification control, font-registration lifecycle and the number of fonts loaded at once. WebView gives CSS justification, `FontFace` loading and unloading, DOM per-word hit-testing and an existing reference renderer. RN `Text` with `expo-font` cannot unload fonts, and you have to compute justification yourself.

### Cited Findings
- `expo-font` `loadAsync()` accepts a `FontSource` (`string | number | Asset | FontResource`), so URIs work. The current docs page does not document any unload API, though an `ERR_UNLOAD` error code appears in its error table. — [Expo Font docs](https://docs.expo.dev/versions/latest/sdk/font/)
- An Expo Quran app's per-page font registrations pile up with no eviction, approaching a "~120MB ceiling" if a user goes through the whole book. A two-page landscape spread doubles the rate. — [J3ff4/quran-corpus #106](https://github.com/J3ff4/quran-corpus/issues/106)
- In the browser, QCF fonts are loaded per page with the `FontFace` API and `document.fonts.add`. QF advises loading only visible pages and showing Unicode fallback text while loading. — [QF Font Rendering guide](https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/)
- A known Firefox issue: V1 word spacing needs `word-spacing: 0.05em` at small scales. This suggests per-engine spacing tweaks are normal. — [QF Font Rendering guide](https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/)
- quranportal reaches full-line justification with `text-align: justify` and `text-align-last: justify`, plus the `font-size: 0` whitespace trick. — [quranportal.io blog](https://quranportal.io/blog/rendering-the-quran-mushaf-digitally)

### Inferences
- React Native `Text` on Android has no `text-align-last: justify`. Getting the last line of each mushaf line justified would mean laying out words in a `flexDirection: 'row-reverse'` view with `justifyContent: 'space-between'`, one `Text` per word, which works because the glyphs are already shaped. That is feasible, but each page needs about 150–200 `Text` nodes and a registered font family.
- Android WebView (Chromium) supports woff2 and COLRv1. COLRv1 needs Chromium 98+ (an assumption based on Chrome's support, not verified for WebView). That makes tajweed V4 workable in WebView. RN `Text` would need the TTF, and COLR support depends on Android's version.
- For the existing Zakkir codebase, which already generates a renderer for mobile from desktop HTML (`mobile/renderer.generated.ts`), the WebView approach probably reuses the most code.

### Gaps
- I found no documented hard limit on the number of custom font families Android or React Native can register. Memory is the practical limit, per J3ff4 #106.
- I did not confirm whether a recent expo-font SDK release adds `unloadAsync`. The current docs page does not list it.

## Q5. Licensing and terms: King Fahd Complex, Tanzil, the Quran Foundation API, and QUL

### Takeaway
- **KFGQPC fonts** may be used, copied and distributed free of charge, including in websites and software, but **may not be modified, sold, or reverse-engineered**. Do not subset, convert or otherwise alter them without care. Converting TTF to woff2 is technically a modification and is a **grey area**, although projects do it widely and the Complex's CDN partners serve woff2.
- **Tanzil text** is CC BY 3.0 in name, but it adds "verbatim only, no changes" plus attribution and a link to tanzil.net.
- **Quran Foundation:** you cannot ship a bundled database of QF API content. Fonts and mushaf images may be bundled if you keep an active Developer Console account and credit QF. A mobile app must not embed a client secret.
- **QUL:** the code is MIT, but the data license is **unclear**.

Offline redistribution in a free Play Store app looks allowed if you ship the KFGQPC fonts unmodified (taken directly from KFGQPC or QUL), credit KFGQPC, take Tanzil text verbatim with its notice, and do not repackage QF API data.

### Cited Findings
**King Fahd Complex (KFGQPC)**
- Official copyright page (Wayback snapshot 2019-08-19; the live site refused connections on 2026-10-03). It quotes the Minister's approval that the Complex presents "a complete free digital copy of Mus'haf al-Madinah … in the following formats: Adobe Illustrator files, PDF files, High quality images, True Type Font". These "can be used for free in all personal, individual businesses, in works of governmental departments & agencies, in the publications of both private and national institutions, also allows Qur'an printing*, digital publishing, & for media use, can be used also in websites, software, and other similar intermediates". The footnote limits *printing* of the Qur'an inside the Kingdom and *importing* it for commercial sale under Royal Decrees 136/8 (1406H) and 9/B/46356 (1424H). — [KFGQPC copyright page (archived)](http://web.archive.org/web/20190819034348/https://dm.qurancomplex.gov.sa/copyright-2/) (original URL: https://dm.qurancomplex.gov.sa/copyright-2/)
- KFGQPC font EULA as embedded in the fonts and reproduced by aggregators: "Permission is hereby granted, free of cost, to any person obtaining a copy of the font … the rights to use, copy, and distribute". The font cannot be "sold, modified, altered, translated, reverse engineered, decompiled, disassembled, reproduced". It "does not grant you any intellectual property rights in the font" and is provided "as is". — [Open Hub KFGQPC license](https://openhub.net/licenses/KFGQPC) (via search summary; direct fetch returned 403); [AUR ttf-qurancomplex-fonts](https://aur.archlinux.org/packages/ttf-qurancomplex-fonts?O=10) (search summary)
- The ScanCode LicenseDB entry for the Uthmanic HAFS font (category "Proprietary Free") reads: "This Font is the property of King Fahd Glorious Quran Printing Complex, and may not be reproduced, modified without the express written approval of King Fahd Glorious Quran Printing Complex." — [ScanCode LicenseDB](https://scancode-licensedb.aboutcode.org/kfgqpc-uthmanic-script-hafs.html). **Conflict:** "may not be reproduced" contradicts the EULA's "use, copy, and distribute" and the copyright page's "websites, software" grant. Different font releases appear to carry different notices.
- The qcf_quran Flutter package states: "This package and its bundled fonts are NOT for commercial use". That is the package author's restriction or interpretation; it is not in the KFGQPC terms above. — [pub.dev qcf_quran](https://pub.dev/packages/qcf_quran)
- Open-source projects that ship KFGQPC fonts point to the KFGQPC copyright page as the authority: nuqayah/qpc-fonts, furqan-app ("same terms as the V1 set"), and SakinaDevGroup ("used under their terms of use"). — [nuqayah/qpc-fonts](https://github.com/nuqayah/qpc-fonts); [furqan-app #601](https://github.com/furqan-app/web/issues/601); [SakinaDevGroup](https://github.com/SakinaDevGroup/al_quran_madani)
- quran.com-images: "the actual fonts and pages … belong to the King Fahd Quran Complex". The repository code is GPL. — [quran/quran.com-images](https://github.com/quran/quran.com-images)

**Tanzil**
- "Tanzil Quran Text Copyright (C) 2007-2021 Tanzil Project License: Creative Commons Attribution 3.0". The notice continues:
  - "Permission is granted to copy and distribute verbatim copies of this text, but CHANGING IT IS NOT ALLOWED."
  - It "can be used in any website or application, provided that its source (Tanzil Project) is clearly indicated, and a link is made to tanzil.net to enable users to keep track of changes."
  - The copyright notice must be included in verbatim copies "and shall be reproduced appropriately in all files derived from or containing substantial portion of this text".
  - Check tanzil.net/updates for changes.
  - — [Tanzil Text License](https://tanzil.net/docs/Text_License)

**Quran Foundation (quran.com API), terms last updated 2026-09-26**
- QF content may be cached for at most 1 week. The exception is the Content Sync APIs, which require a sync every 7 days. "The Content Sync storage exception does not itself authorize distributing a prepackaged database or build-time bundle of QF Content." — [QF Developer Terms: Mushaf Fonts and Images](https://api-docs.quran.foundation/legal/mushaf-fonts-and-images/)
- Font files and mushaf images may be cached and bundled if you keep an active Developer Console account, credit QF in an accessible place ("Quran fonts provided by Quran Foundation"), and distribute the files only as integrated parts of the application. — [QF legal page](https://api-docs.quran.foundation/legal/mushaf-fonts-and-images/); [QF Font Rendering guide](https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/)
- Selling or redistributing QF content or raw API data requires "a separate written commercial license". Paid apps, ads and freemium models are allowed as long as QF content is not sold separately. These terms do not mention KFGQPC licensing. — [QF legal page](https://api-docs.quran.foundation/legal/mushaf-fonts-and-images/)
- API access works like this:
  - Developer Console (`dev-console.quran.foundation`): apps start "pre-live", where the dataset is limited to Surahs 1–2, and need approval for production.
  - OAuth2 `client_credentials` with `scope=content`; tokens last 1 hour and there are no refresh tokens.
  - Every request needs the `x-auth-token` and `x-client-id` headers.
  - "A browser or mobile app must not embed a Content API `client_secret`. If it needs Content API data, call your own backend."
  - — [QF Quickstart](https://api-docs.quran.foundation/docs/quickstart/)

**QUL (Tarteel)**
- The QUL repository is MIT-licensed. Its footer points to Tarteel's general Terms (https://www.tarteel.ai/terms), which did not render through the fetcher. Downloads require sign-in. — [TarteelAI/quranic-universal-library](https://github.com/TarteelAI/quranic-universal-library); [QUL home](https://qul.tarteel.ai/); [QUL tutorial](https://qul.tarteel.ai/docs/tutorial-mushaf-layout-end-to-end)

### Inferences
- **KFGQPC font redistribution.** Shipping the per-page QCF fonts inside a free (or paid) Play Store app falls within KFGQPC's stated grant ("websites, software"). The conditions are: keep the font files unmodified, do not sell them separately, and credit KFGQPC. To reduce the "no modification" risk:
  - Use woff2 or ttf files exactly as QUL or QF distribute them, rather than subsetting them yourself.
  - Or use the original TTFs inside a WebView (Android WebView loads TTF fine; bigger, but unmodified).
- **Attribution text to include on an About/Credits screen:**
  - "Mushaf fonts © King Fahd Glorious Qur'an Printing Complex (qurancomplex.gov.sa)."
  - "Qur'an text: Tanzil Project (tanzil.net), CC BY 3.0, unmodified", plus the verbatim Tanzil notice if Tanzil text is used.
  - "Layout data: Quranic Universal Library (qul.tarteel.ai)".
  - "Quran fonts provided by Quran Foundation", only if the fonts were taken from QF's CDN.
- **Do not bundle QF API JSON** (`code_v2` word lists). Build the offline DB from QUL downloads instead, or call the QF API from your own backend and cache for no more than 7 days. The QF route is incompatible with a fully offline app.

### Gaps / unclear licensing (flag explicitly)
- **KFGQPC:** the live copyright page and fonts.qurancomplex.gov.sa could not be reached on 2026-10-03 (connection refused). The quoted terms come from a 2019 archive and may have changed. The conflict between the EULA ("use, copy, distribute") and the ScanCode notice ("may not be reproduced") is **unresolved**. It is **unclear** whether a woff2 conversion counts as a forbidden "modification".
- **QUL data license:** **unclear**. The MIT license covers the code. Tarteel's terms page could not be read, and the per-resource license or attribution requirements for layout DBs and glyph scripts were not found. Ask the QUL maintainers or check each resource's page.
- **Tanzil versus glyph codes:** QCF glyph code strings are not Tanzil text. Whether storing Tanzil text with tashkeel stripped for search (a "change") breaks "verbatim only" is **unclear**. The usual practice is to keep the original text and build a separate derived search index.
