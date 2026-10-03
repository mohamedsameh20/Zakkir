# Tarteel and Quran.com: how memorization (hifz) self-testing works, and what can be copied without speech recognition

Research date: 2026-10-03. Sources are mainly Tarteel's help center (support.tarteel.ai, Intercom articles, several updated Aug 2026), Tarteel blog/App Store, and Quran.com's open-source frontend plus the quran/quran_android GitHub repo (Quran.com's own team). Note: Tarteel's help-center pages were read through a summarizing fetch tool. Quoted UI labels come from that output and were not checked against screenshots.

---

## Q1. Tarteel: what is hidden, what reveals it, what hints exist, and what works for free or with the mic off?

### Takeaway
Tarteel has two hide-based surfaces. (a) **Hide Ayahs in Recite mode**: an eye-slash toggle blanks every verse on the mushaf page and leaves ayah markers visible. Words reappear only as the AI hears them. There are "peek" hints: the next word, or the next whole ayah. (b) **Testing Mode**, added Aug 2026: random-position "question cards" with hint words. You reveal manually with one arrow (one word), two arrows (rest of the ayah) or a double-tap, and **every manual reveal counts as a mistake**. Both surfaces depend on speech recognition. I found no documented mic-off or self-grading mode in Tarteel.

### Cited Findings
**Hide Ayahs (Recite mode)**
- You must be in **Recite** mode first. Then you tap "an icon in the bottom left-hand corner of your screen that has an eye with a line going through it". This "blanks out ALL the verses on the page and leaves the Ayah markers alone." When you recite correctly the verses reappear. When you don't, the AI gives feedback. — [Tarteel Help: Hide ayahs](https://support.tarteel.ai/en/articles/12414416-hide-ayahs)
- Extra difficulty: **Settings > Recite tab > "Hide Ayah Markers"** also hides the verse-number markers. — [Tarteel Help: Hide ayahs](https://support.tarteel.ai/en/articles/12414416-hide-ayahs)
- The store listing says: "Hide the verses and recite; Tarteel uses industry-leading recognition accuracy to track your voice and reveal the words on the screen as you recite them." So word-by-word reveal is driven by the AI. — [App Store listing](https://apps.apple.com/us/app/tarteel-ai-quran-memorization/id1391009396)
- Hidden verses let you pick the Madani or Indo-Pak script and hide ayah markers. — [Google Play listing (via search snippet)](https://play.google.com/store/apps/details?id=com.mmmoussa.iqra&hl=en_US)
- Granularity: the whole page is hidden at once, word by word. Nothing documented lets you hide only some ayat. — [Tarteel Help: Hide ayahs](https://support.tarteel.ai/en/articles/12414416-hide-ayahs)

**Peeking (hint) in hidden mode**
- In Memorization Mode, while ayat are hidden and the AI follows along, a button "at the bottom of your screen" lets you see "just the first word of the next verse". If you're "really stuck, you can even view the entire next verse… that's all that will show up." (blog updated Mar 15, 2023) — [Tarteel blog: Can You At Least Tell Me The First Word?](https://tarteel.ai/blog/can-you-at-least-tell-me-the-first-word/)
- The current Premium description reads: "Verse Peeking: reveal the next word or the next ayah when you are stuck while reciting with hidden ayahs." — [Tarteel Help: What's Tarteel Premium?](https://support.tarteel.ai/en/articles/12414387-what-s-tarteel-premium)
- A peeked word is coloured **brown**. — [Tarteel Help: What do the different text colours mean?](https://support.tarteel.ai/en/articles/12414414-what-do-the-different-text-colours-mean)
- Peeks are logged as mistakes. The mistake-history heatmap counts "peeking mistakes, diacritic errors, etc." — [Tarteel Help: Understanding mistake highlight colors](https://support.tarteel.ai/en/articles/12414495-understanding-mistake-highlight-colors)

**Testing Mode (manual reveal controls)**
- How to start: hold the green mode button in the Quran reader and choose **"Test"**. Tap play, a short countdown runs, then the first **question card** appears. — [Tarteel Help: Getting started with Testing](https://support.tarteel.ai/en/articles/16557456-getting-started-with-testing)
- Each card shows: **hint words** as a starting prompt, the **hidden lines** still to recite, the **surah name and verse number**, an **eye icon** that toggles verse visibility, and a **"Next"** button to skip. — [Getting started with Testing](https://support.tarteel.ai/en/articles/16557456-getting-started-with-testing)
- The app reveals correctly recited words as you go. "A question often continues past the first ayah, so don't stop when you reach the end of an ayah." — [Getting started with Testing](https://support.tarteel.ai/en/articles/16557456-getting-started-with-testing)
- Manual reveal when stuck: **single arrow = one word**, **double arrow = "the rest of the ayah"**, or **double-tap the card**. "Each reveal counts as a mistake for that question." — [Getting started with Testing](https://support.tarteel.ai/en/articles/16557456-getting-started-with-testing); [How does test scoring work?](https://support.tarteel.ai/en/articles/16565162-how-does-test-scoring-work)
- When a question ends you hear a sound, and the card turns **green** (recited correctly) or **red** (there was a mistake). Then the next question appears. — [Getting started with Testing](https://support.tarteel.ai/en/articles/16557456-getting-started-with-testing)
- The test auto-pauses if it "hears no recitation for 30 seconds". — [How do I pause, resume, or end a test?](https://support.tarteel.ai/en/articles/16565039-how-do-i-pause-resume-or-end-a-test)
- Testing "needs an internet connection, because your recitation is recognized live on our servers". — [Testing FAQs](https://support.tarteel.ai/en/articles/16557351-testing-faqs)
- Release: App Store "What's New" says "Test Mode is now available!… places you in random locations within your memorization, challenging your brain to recall without relying on previous cues" (listed as 5.81.1, Aug 22; current version 5.81.6, Sep 18). — [App Store listing](https://apps.apple.com/us/app/tarteel-ai-quran-memorization/id1391009396). A search snippet attributes it to 5.81.2 instead. Minor version conflict.

**Free vs Premium**
- Free: unlimited recitation follow-along, AI Voice Search, **Testing Mode with a limited number of rounds per day**, **Hide Ayahs**, 152 translations, 45 tafsirs, 16 recitations, tajweed colours, layouts, similar-phrase lists, streaks, badges, bookmarks, **one goal**, and sync. Mistake Detection is Premium-only. Tajweed mistake detection is not offered on either tier. — [Tarteel Help: Can I use Tarteel for free?](https://support.tarteel.ai/en/articles/12267535-can-i-use-tarteel-for-free)
- Premium adds Mistake Detection ("alerts you in real time when you miss, add or change a word"), Unlimited Testing Mode ("settings for test duration and question length"), Verse Peeking, Mistake History & Playback, Advanced Analytics, unlimited goals, full session history, and word-by-word highlighting while listening. — [What's Tarteel Premium?](https://support.tarteel.ai/en/articles/12414387-what-s-tarteel-premium)
- **Conflict:** the App Store listing names "Peeking & Hidden Verses Mode" as a Premium unlock. — [App Store](https://apps.apple.com/us/app/tarteel-ai-quran-memorization/id1391009396). The help center lists "Hide Ayahs" as free. — [Can I use Tarteel for free?](https://support.tarteel.ai/en/articles/12267535-can-i-use-tarteel-for-free). The likely reading is that hiding is free and the AI mistake feedback inside hidden mode is paid. That is unconfirmed.
- Testing FAQ: "We may sometimes run promotions where free users… are granted a certain number of questions to try out per day." No fixed number is given. — [Testing FAQs](https://support.tarteel.ai/en/articles/16557351-testing-faqs)
- New installs get a 7-day Premium trial (which covers peeking). — [Tarteel blog (peeking)](https://tarteel.ai/blog/can-you-at-least-tell-me-the-first-word/)

### Inferences
- Tarteel's design treats the AI as the reveal mechanism, with manual reveal only as a penalised fallback. In a non-AI clone you turn this around: manual reveal is the main action, and the user grades each revealed unit as right or wrong. Tarteel's existing controls map onto this directly: one-word reveal, rest-of-ayah reveal, next-ayah peek, and the eye toggle to see the passage.
- Tarteel's rule that "each reveal = a mistake" works as a scoring model for a self-graded app, but it can't tell "I knew it and just checked" from "I forgot it". A self-graded app needs separate verdict buttons.

### Gaps
- I found no documentation of a mic-off or manual-only mode in Tarteel's Recite or hidden mode. It is also undocumented whether tapping a hidden word in Recite mode reveals it (the Testing double-tap is the only documented tap-to-reveal).
- I found no exact on-screen label or icon for the peek button. The blog only says "bottom of your screen". Peek may also have moved into the Test card arrows.
- I found no Reddit threads with first-hand descriptions of free versus mic-off use. Searches returned only store pages and mod-APK sites.

---

## Q2. Tarteel: how mistakes are recorded, categorized, and shown afterwards; goals, streaks, sessions and progress

### Takeaway
Live mistakes are shown with word colours: red = wrong, missing or extra word, yellow = tashkeel, brown = peeked, green = correct. Wrong words also get a dotted underline that disappears once corrected. Mistakes are saved per session. Afterwards they appear as (a) a **frequency heatmap on the mushaf** (red, orange, yellow, green, none), (b) a per-session **Mistakes** list with audio playback, and (c) per-surah "Historical Mistakes". Users can delete or restore false flags anywhere. Goals are Memorize, Review or Recite. Memorize and Review only count sessions where the ayahs were hidden.

### Cited Findings
**Live feedback and categories**
- Real-time colours: **Red** = "an error in your recitation", **Green** = "your current recitation is correct", **Yellow** = "a tashkeel (diacritics) mistake", **Brown** = "a word you have peeked at". — [What do the different text colours mean?](https://support.tarteel.ai/en/articles/12414414-what-do-the-different-text-colours-mean)
- Detected error types: "wrong words, skipped words or incorrect order" (blog updated Apr 6, 2023). — [Tarteel blog: So You've Made a Mistake. Now What?](https://tarteel.ai/blog/so-youve-made-a-mistake-now-what/). The Premium page words it as "miss, add or change a word". — [What's Tarteel Premium?](https://support.tarteel.ai/en/articles/12414387-what-s-tarteel-premium)
- So the categories are: missed or skipped word, extra or added word, changed or wrong word, tashkeel/diacritic (optional), and peek. **Tajweed mistakes are not detected.** — [Can I use Tarteel for free?](https://support.tarteel.ai/en/articles/12267535-can-i-use-tarteel-for-free)
- How to enable: **Settings > Recitation > "Detect Mistakes"** (Premium). Optional **"Detect Tashkeel (diacritics)"** sits in the same menu. "Mistaken words are highlighted with red coloring and marked with a dotted underline." Once corrected, the underline goes away but the red stays. — [How to activate Mistake Detection](https://support.tarteel.ai/en/articles/12414419-how-to-activate-mistake-detection)
- "Live Correction: Tap on any highlighted mistake to see exactly what you recited" versus the correct ayah. — [App Store](https://apps.apple.com/us/app/tarteel-ai-quran-memorization/id1391009396)

**Mistake history on the mushaf (heatmap)**
- Toggle: **Settings > Marking > "Highlight Mistake History"**, or an icon on the recitation screen. Premium only. — [Understanding mistake highlight colors](https://support.tarteel.ai/en/articles/12414495-understanding-mistake-highlight-colors)
- Frequency scale: **Red** = highest error frequency, **Orange** = moderate, **Yellow** = lower, **Green** = infrequent, **No highlight** = recited correctly with nothing detected. It counts all error types together, including peeks and diacritics. You can "work your way back from red down to green, and eventually to no highlight, if you consistently start reciting that ayah correctly again". In other words, correct recitations lower the level. This is separate from the live feedback colours. — [Understanding mistake highlight colors](https://support.tarteel.ai/en/articles/12414495-understanding-mistake-highlight-colors)
- "Historical Mistakes feature" gives an analysis by surah: "see your progress at a glance and get an idea of which parts of the surah could use a little more work". Mistakes show "on the Dashboard near your recent activity". — [Tarteel blog: So You've Made a Mistake](https://tarteel.ai/blog/so-youve-made-a-mistake-now-what/)
- "Advanced Analytics showing strong and weak Surahs". There are also "Streaks and heatmap visualizations". — [App Store](https://apps.apple.com/us/app/tarteel-ai-quran-memorization/id1391009396)

**Session history, review, delete or restore**
- Path: **Activity tab > Session History**. Recitation-mode sessions can be played back with **Play**. In the **Mistakes** tab you pick a session and "tap the mistake count", then play each mistake's audio. A reciter button plays "the correct recitation" for comparison. Premium only, and recording must be enabled under Settings > Data Usage. — [How to listen to your recitation recordings and mistakes](https://support.tarteel.ai/en/articles/14423894-how-to-listen-to-your-recitation-recordings-and-mistakes)
- False flags: "Tap the highlighted word, then tap the remove icon." You can do this during the session, from the session's mistakes list, or later from Activity history. Restoring works the same way. Removed mistakes are not counted "in your Mistake History, highlights, or test scores". — [A mistake was flagged that I didn't make](https://support.tarteel.ai/en/articles/16559266-a-mistake-was-flagged-that-i-didn-t-make)
- Test results screen: **"Removed Mistakes"** has a **+** to restore each one. — [How does test scoring work?](https://support.tarteel.ai/en/articles/16565162-how-does-test-scoring-work)
- **Temporary Session** toggle (hourglass icon at the top of the Test screen): nothing is saved or recorded. — [Testing FAQs](https://support.tarteel.ai/en/articles/16557351-testing-faqs); [test length article](https://support.tarteel.ai/en/articles/16557780-how-do-i-change-the-length-of-my-test-and-how-many-questions-it-asks)
- Test mistakes are saved to Mistake History, and test sessions count toward streaks and goals. — [Testing FAQs](https://support.tarteel.ai/en/articles/16557351-testing-faqs)

**Goals, streaks, tracker**
- Goal action types: **Memorize** (counts only sessions with hidden ayahs), **Review** (also hidden only), **Recite** (any session). You define a **Range** (e.g. Juz 29–30), a **Portion** per session (e.g. one page or one juz) and a **Schedule** (daily, weekly, specific days, or "No Schedule"). Goals are either "flexible" (they auto-adjust if you fall behind) or "portion-based". Multiple ranges and reverse order are supported. Session bars are coloured green = completed, yellow = in-progress, red = missed. — [How do I use the Goals feature?](https://support.tarteel.ai/en/articles/12782033-how-do-i-use-the-goals-feature)
- Free tier gets one goal; Premium gets unlimited goals. — [Can I use Tarteel for free?](https://support.tarteel.ai/en/articles/12267535-can-i-use-tarteel-for-free); [What's Tarteel Premium?](https://support.tarteel.ai/en/articles/12414387-what-s-tarteel-premium)
- Memorization tracker: tracks progress "on the Surahs… they are memorizing" and can "drill down all the way to the individual word level". — [Memorization tracker](https://support.tarteel.ai/en/articles/12414407-memorization-tracker)
- Off-platform sessions (Premium): Activity tab > **"Add Session"** logs practice done outside the app and can restore a broken streak. — [How to add an off-platform session?](https://support.tarteel.ai/en/articles/12414408-how-to-add-an-off-platform-session)
- In-test streak: "the streak flame lights up once you answer 3 questions correctly in a row." — [How does test scoring work?](https://support.tarteel.ai/en/articles/16565162-how-does-test-scoring-work)

### Inferences
- These parts of Tarteel's model need no AI and can be copied as-is: per-word mistake records with a type; a per-ayah mistake count that goes **down** after correct recitations and drives a 4-level heatmap; a session log; remove/restore for mistakes; a "temporary session" that saves nothing; and goals that only count *hidden* sessions as memorization or review.
- With self-grading, the user picks the mistake type. Tarteel's categories become a small chooser: Forgot/missed, Wrong word, Added word, Tashkeel, plus an automatic "Peeked/Revealed" type.

### Gaps
- I couldn't find the exact decay formula for the heatmap: how many correct recitations move an ayah down one level.
- The memorization-tracker and delete-mistake articles are mainly videos. I couldn't get the UI for marking an ayah or surah as memorized, or the session-detail layout, as text.

---

## Q3. Quran.com (web and apps): memorization, hide-words, reading progress, goals and streaks, Reflect, word-by-word

### Takeaway
As of Oct 2026, **Quran.com web has no hide-words or self-test mode**. Its memorization support is audio repeat settings, notes, reading goals and streaks, and a "random ayah for revision" request that is still open. Quran.com's own **Quran for Android** app has an open feature request (Jul 2026) and an **open, unmerged PR (Sep 2026)** for a Hifz mode. That design is the closest public non-AI blueprint: an eye toggle hides all verses and keeps the markers, plus `<` `<<` `>` `>>` re-hide and reveal controls for words and verses.

### Cited Findings
**Quran.com web (quran/quran.com-frontend-next)**
- A search of the frontend repo for "memoriz" (via the GitHub code search API, run 2026-10-03) only matched marketing copy: the Notes page "Enhanced Memorization & Revision", Ramadan challenge pages, and app-portal descriptions. No reader hide or test component. — [repo](https://github.com/quran/quran.com-frontend-next); [take-notes locale](https://github.com/quran/quran.com-frontend-next/blob/production/locales/en/take-notes.json)
- The Notes feature is pitched for memorization: "Write explanations or reminders next to verses to aid memorization… Note difficult words… Use notes to mark progress in memorization schedules." — [take-notes.json](https://github.com/quran/quran.com-frontend-next/blob/production/locales/en/take-notes.json)
- Memorization aid via audio repeat: "Repeat Settings", "Repeat each verse", "Delay between verse", "Repeat Verse". The repeat settings now live in the audio player. — [common.json locale](https://github.com/quran/quran.com-frontend-next/blob/production/locales/en/common.json). Issue #1022 (open since Dec 2021) describes repeat-with-pause memorization and asks for partial-ayah or word-range repeat. It notes "We used to have a partial ayah repeat feature but disabled it." — [Issue #1022](https://github.com/quran/quran.com-frontend-next/issues/1022)
- A user who memorizes with Quran.com asked for keyboard-fillable replay ranges, values that persist, and an "infinite repeat" switch, because they "start with 1 verse, and gradually add more verses". Closed in 2025 with PR #2407. — [Issue #2406](https://github.com/quran/quran.com-frontend-next/issues/2406)
- "Randomly choose a surah or ayah for revision" (open since Aug 2023) proposes "Any ayah / Previously read ayah" pickers and per-surah confidence weights ("memorized, some memorization needed, needs work"). — [Issue #2014](https://github.com/quran/quran.com-frontend-next/issues/2014)
- **Quran Growth Journey (goals and streaks)**, launched May 15, 2023. Goals are either a "Daily goal" or a "Duration-based goal", with units **Time** (minutes), **Page** or **Range** (custom verses). "Reading at least a verse daily will keep the streaks going." Progress resets daily in the local timezone. A duration goal splits the target equally across the days. — [Quran.com product update](https://quran.com/product-updates/quran-reading-streaks)
- Goal UI strings: presets "Read 10 minutes a day", "Read the Quran in 30 days" (Khatm, 1 Juz a day), "Read the Quran in a year", and "Custom". There are "Day streak", "Daily Progress", "Completed! 🎉", a "Reading History" per date, and "Manually add readings". Reading time is auto-filled from the site's average reading speed but can be overridden. — [reading-goal.json](https://github.com/quran/quran.com-frontend-next/blob/production/locales/en/reading-goal.json); [reading-progress.json](https://github.com/quran/quran.com-frontend-next/blob/production/locales/en/reading-progress.json)
- The reading bookmark ("Set as my Reading Bookmark") syncs across devices. — [quran-reader.json](https://github.com/quran/quran.com-frontend-next/blob/production/locales/en/quran-reader.json)
- **Word-by-word**: translation or transliteration can be shown "In-line" ("directly under the word") or in a "Tooltip" ("when hovering or clicking the word"). There are separate "Word Click" and "Show tooltip when playing audio" settings, and a word-details view with "Next word" / "Previous word" and "Play from Word". These are study aids. None of them hides the Arabic. — [common.json](https://github.com/quran/quran.com-frontend-next/blob/production/locales/en/common.json); [quran-reader.json](https://github.com/quran/quran.com-frontend-next/blob/production/locales/en/quran-reader.json)
- Quran.com's app portal sends memorization users to third-party apps, e.g. "Muhaffidh: Memorize and review Quran efficiently". It describes its own iOS and Android apps as for reading "on the go, memorize, and listen". — [apps.json / app-portal.json locales](https://github.com/quran/quran.com-frontend-next/tree/production/locales/en)
- Independent 2026 reviews also say Quran.com "isn't specifically designed as a memorization app". — [howtomemorisethequran.com](https://howtomemorisethequran.com/top-quran-memorization-apps/) (secondary source)

**Quran for Android (by Quran.com): proposed Hifz mode**
- Issue #3749 (opened 2026-07-29, still open) proposes: an **eye icon** at the bottom near the page number toggles Hifz Mode. Hidden text is "replaced with blank space and a horizontal line", and **verse number markers stay visible**. Four buttons: **`>` Reveal Word** (next hidden word), **`>>` Reveal Verse**, **`<` Re-hide Word** (last revealed word), **`<<` Re-hide Verse**. **Tapping a hidden verse area reveals that whole verse.** The mode persists across pages until toggled off. **Audio is disabled** in Hifz mode "to prevent the user from hearing the answer". Reveal state is kept per page when you navigate away and back. In two-page landscape view, reveal starts on the right page (RTL). — [Issue #3749](https://github.com/quran/quran_android/issues/3749)
- PR #3824 (opened 2026-09-10, open and not merged) implements this for the image (Madani) renderer. A pure `HifzModeState` machine has `enable`, `revealNextWord`, `revealNextVerse`, `rehideLastWord` and `rehideLastVerse`. A **reveal stack** (an `ArrayDeque` of Word or Ayah units) gives undo. `rehideLastVerse` pops every unit of the most recently touched ayah. Ayahs without per-word glyph data fall back to whole-ayah hide and reveal. It emits granular diffs (`HideWord`, `RevealWord`, `HideAyah`, `RevealAyah`). Hiding reuses the existing `HighlightType.Mode.HIDE` canvas clip, and ayah markers are drawn after the clip so they survive. Hifz state resets on rotation, and the line-by-line renderer is out of scope. — [PR #3824](https://github.com/quran/quran_android/pull/3824)
- Earlier requests: #227 (2012, open) is "ayah N shown, everything after hidden; click next to show the next verse and check yourself", with silent playback waits sized to verse length. #702 (2016, closed 2020) asked for **incrementing per-ayah mistake markers** that darken with each mistake and go down when recited correctly, a summary view sorted by count, word-level units, and categories (Tajweed, Tashkeel, wrong word). The maintainer closed it because ayah tagging already exists. — [Issue #227](https://github.com/quran/quran_android/issues/227); [Issue #702](https://github.com/quran/quran_android/issues/702)

**Quran Reflect**
- No memorization feature found. The Quran.com locales tie reflections and notes to sharing and study only. — [take-notes.json](https://github.com/quran/quran.com-frontend-next/blob/production/locales/en/take-notes.json)

### Inferences
- Quran.com gives a goals and streaks model (daily or duration; time, pages or range; "≥1 verse keeps the streak"; manual add) and audio-repeat ideas. The quran_android PR gives an Android-native, already-reviewed-style hide and reveal state machine. Together they nearly cover a non-AI design. What's missing is self-grading, which neither has.

### Gaps
- I couldn't confirm whether the newer Quran.com iOS or Android apps (as opposed to the open-source quran_android repo) have shipped any hifz or hide feature by Oct 2026. PR #3824 was unmerged when checked.
- The Ramadan 2026 "Surah Al-Mulk: Meaningful Memorization Challenge" exists in profile strings (`daily-ramadan-challenge`). I didn't confirm its mechanics, which may be content and daily tasks rather than a test UI.

---

## Q4. Exact UI controls (reveal next word or ayah, undo, mark mistake, hint) and switching between word and ayah level mid-session

### Takeaway
Both reference designs offer word and ayah granularity **at the same time, side by side**, not as a mode switch. Tarteel Test: one arrow, two arrows, double-tap the card, eye, Next. Tarteel hidden recite: peek next word or next ayah. Quran-Android Hifz: `<` `<<` eye `>` `>>` plus tap-a-verse. Undo exists only in the Quran-Android design (re-hide). "Mark mistake" is automatic in Tarteel. Its manual counterpart is **remove/restore** of a flagged mistake.

### Cited Findings
- Tarteel Test card controls: single arrow (one word), double arrow (rest of ayah), double-tap card (reveal), eye icon (toggle visibility), "Next" (skip question), pause → play/stop, Temporary Session (hourglass), sliders icon (settings). — [Getting started](https://support.tarteel.ai/en/articles/16557456-getting-started-with-testing); [Pause/resume/end](https://support.tarteel.ai/en/articles/16565039-how-do-i-pause-resume-or-end-a-test); [Test length](https://support.tarteel.ai/en/articles/16557780-how-do-i-change-the-length-of-my-test-and-how-many-questions-it-asks)
- Tarteel Recite or hidden controls: eye-slash toggle (bottom-left), peek the next word's first word, then the whole next ayah, tap a highlighted mistake to compare, tap a word → remove icon. — [Hide ayahs](https://support.tarteel.ai/en/articles/12414416-hide-ayahs); [Peeking blog](https://tarteel.ai/blog/can-you-at-least-tell-me-the-first-word/); [False-flag article](https://support.tarteel.ai/en/articles/16559266-a-mistake-was-flagged-that-i-didn-t-make)
- Quran-Android Hifz bar (left to right in the layout XML): `hifz_rehide_verse` (<<), `hifz_rehide_word` (<), `hifz_toggle` (eye), `hifz_reveal_word` (>), `hifz_reveal_verse` (>>). Each is a 48dp borderless button with content descriptions, in a floating bar 16dp above the bottom. — [PR #3824 files](https://github.com/quran/quran_android/pull/3824/files)
- Undo semantics in PR #3824: "Re-hides the last revealed unit (undoes one reveal step)". "Re-hides every revealed unit of the most recently touched verse." — [PR #3824](https://github.com/quran/quran_android/pull/3824/files)
- Furqan (a third-party web reader, not Quran.com) memorization mode: words blurred in place with no reflow, CSS classes `fq-word-revealed` and `fq-word-error`, and peek/hint styling. Shown here for contrast with the search snippet that wrongly attributes it to Quran.com. — [furqan-app/web #648](https://github.com/furqan-app/web/issues/648)

### Inferences
- Recommended for a self-graded clone, combining the two: always show both word and ayah reveal buttons, an undo (re-hide) button, tap-a-word to reveal it, and long-press or tap on a revealed word to flag it with a mistake type. Then grade per question or ayah with ✓/✗ buttons, which replace the AI's green or red card verdict. Keep markers visible while hiding, and offer Tarteel's "Hide Ayah Markers" option for an extra challenge.

### Gaps
- Neither app documents a "first letter" hint. Tarteel's hints are next word or next ayah, and Test hint words are shown at the start of each card.

---

## Q5. Session structure: picking a range, question settings, summary screen, scores

### Takeaway
Tarteel Testing is a complete model you can adapt. Scope can be any mix of surah, juz, hizb, rub or page, or "Your Memorization". You choose a session length (number of questions, time, or unlimited) and a question length in lines. Questions start at random points and get hint words. A question counts as correct only with zero mistakes (and reveals count as mistakes). Score = correct ÷ total. The results screen lists mistakes, and removed mistakes can be restored. "Suggested for you" cards include Warm Up and Weakest Link.

### Cited Findings
- Scope: open **"Create Custom Range"** for a range wheel by **Surah, Juz, Hizb, Rub, Page**. You can tap any number of sections in any order, or hold and drag to multi-select. Ranges can be saved with a name and emoji, and edited, deleted or reordered. There's a "Clear" button. The default scope is the automatic **"Your Memorization"** range: parts you marked memorized or recited from memory before. — [How do I choose what I get tested on?](https://support.tarteel.ai/en/articles/16558028-how-do-i-choose-what-i-get-tested-on)
- Session length: **Questions** (default **10**, presets 10/15/20, custom 1–99), **Time** (presets 5/10/15 min, custom 1–60), or **Unlimited**. Question length: **Short = 2 lines, Medium = 5, Long = 12**, or a slider. **"Extend Question to Ayah's End"** is on by default. — [Test length article](https://support.tarteel.ai/en/articles/16557780-how-do-i-change-the-length-of-my-test-and-how-many-questions-it-asks)
- Questions don't repeat within a session. — [Testing FAQs](https://support.tarteel.ai/en/articles/16557351-testing-faqs)
- Scoring: "the number of correct questions divided by the total questions so far". A question is correct only with "zero mistakes". Single- and double-arrow reveals each count as a mistake. The mistakes counter is a running session total. — [How does test scoring work?](https://support.tarteel.ai/en/articles/16565162-how-does-test-scoring-work)
- **Results screen**: score %, "Correct 8/10", a Total Mistakes list, and Removed Mistakes (restore with +). If you ended early the buttons are **"Keep Reciting" / "End"**. If the test completed they are **"Replay" / "Done"**. — [How does test scoring work?](https://support.tarteel.ai/en/articles/16565162-how-does-test-scoring-work); [Pause/resume/end](https://support.tarteel.ai/en/articles/16565039-how-do-i-pause-resume-or-end-a-test)
- Pause keeps score, streak, mistakes and position. To end, pause and then tap the red stop. Switching to Recite or Listen also ends the test. — [Pause/resume/end](https://support.tarteel.ai/en/articles/16565039-how-do-i-pause-resume-or-end-a-test)
- "Suggested for you": cards are built only from passages marked memorized, plus review history ("your mistakes, scores, and how recently you reviewed each passage"). There are two fixed cards, **Warm Up** (the passages you know most confidently) and **Weakest Link** (the passage "where you make the most mistakes"), and two rotating cards. — [What are the "Suggested for you" tests?](https://support.tarteel.ai/en/articles/16558156-what-are-the-suggested-for-you-tests)
- Quran.com's session-like structure is limited to reading goals (range or pages or time, daily or duration) and the reading history per date. — [reading-goal.json](https://github.com/quran/quran.com-frontend-next/blob/production/locales/en/reading-goal.json); [Quran.com Growth Journey](https://quran.com/product-updates/quran-reading-streaks)

### Inferences
- Non-AI version of Tarteel Test: pick a random start inside the scope → show N hint words → hide the next L lines (extended to the end of the ayah) → the user reveals by word or ayah → the user taps ✓ (no mistakes) or ✗, optionally tagging the words they got wrong → score = ✓ ÷ total. Weakest Link = the passage with the highest decayed mistake count. Warm Up = the lowest. Questions are measured in mushaf **lines**, so the app needs per-line word mapping (e.g. QPC/Madani page-line data).

### Gaps
- No documentation says whether Test results can be viewed per question afterwards (beyond the mistakes list), or how "Your Memorization" is edited at ayah versus surah granularity.
