# Self-test / memorization features of Quran hifz apps other than Tarteel and Quran.com (as of Oct 2026)

Method note: about 25 tool calls covering Play Store and App Store listings, official sites, review/aggregator blogs, and GitHub. For one open-source app (Waqar144/quran_memorization_helper) I read the source code directly; that is the strongest evidence in these notes. Many store pages could not be fetched in full (Play Store pages and the AnkiWeb page came back empty or truncated). Claims taken only from search-result snippets or third-party roundups are marked **[snippet]** or **[secondary]**. Nothing here is from hands-on testing of the apps.

## Q1. Exact test modes per app (comparison table material)

### Takeaway
Few apps outside Tarteel offer a real **non-AI, self-graded** test. The common patterns are:
- (a) hide whole ayahs or pages and reveal them, sometimes progressively by swiping;
- (b) flash-card style "recite the next ayah" or "finish the ayah" prompts with a Show Answer button and a Yes/No self-grade;
- (c) progressive-fade hints (full text, then first letters, then word shapes, then blank);
- (d) page-number and mutashabihat (similar-verse) drills, mainly in Thabbit, Mualim and the Waqar144 helper;
- (e) multiple-choice quizzes, as in "Quran Memorization Test".

The Arabic-market "تسميع" (tasmee') apps and Mualim's "Corrector" rely on speech recognition (AI), not manual reveal.

### Cited Findings

**Comparison-table rows** (app | what is hidden | what a tap reveals | hints | grading/mistakes | granularity | unique drills)

- **Quran Companion: Memorize Quran** (Quran Academy) | Hidden: the ayah (in ayah view) or page lines (in page view) | Reveal: a **"Swipe to Reveal" game** that "reveals the hidden ayah as your finger slides across it", so the ayah is revealed in parts as you swipe right-to-left over the white space or blank lines, and swiping left-to-right hides it again | Hints: none documented besides the partial swipe | Grading: no in-app grading documented. Self-assessment works by recording your own recitation and comparing it with the text. Ayahs can be looped 1–10 times or infinitely | Granularity: ayah view vs page view (single page or endless scroll) | Unique: swipe-proportional reveal; "Hasanah calculator"; guided lesson plans and an analytics dashboard are listed as upcoming — [App Store](https://apps.apple.com/us/app/quran-companion-memorize-quran/id1111843462); swipe-direction detail from [Quran Companion FAQ](https://quranacademy.io/blog/quran-companion-faq/) **[snippet; the FAQ page returned HTTP 503 when fetched]**
- **Ayat / آيات** (King Saud University e-Mushaf) | Hidden: the full page. Its feature list includes a "memorizing test (blank pages)" | Reveal, hints, grading: not documented in sources I could reach | Granularity: page (Madinah mushaf) plus ayah repetition with set intervals | Unique: ayah-repeat with a gap between repeats; synced highlighting — [Play listing](https://play.google.com/store/apps/details?id=sa.edu.ksu.Ayat) **[snippet]**; the KSU service page only says the system has "a testing module to support review and retention" — [KSU Daleel](https://daleel.ksu.edu.sa/en/node/2895). **Uncertain**: how the blank-page test works (tap-to-reveal per ayah? per line?) is unverified.
- **Quran Revision Companion / quran_memorization_helper** (open source, Flutter, by Waqar144; last commit 22 Jun 2026) | Three quiz modes in code: `enum QuizMode { nextAyah, endAyah, mix }`. Prompts are "Recite the next ayah" (shows a random ayah from the paras you selected) and "Finish the ayah" (shows the start of the ayah followed by "...", hiding the last `min(ceil(words/2), 6)` words). "mix" alternates between the two | Reveal: one **"Show Answer"** button shows the target ayah | Grading: binary **"Were you right?" No (red) / Yes (green)**. The final screen says "Your score is X/Y" and lists the wrong ayahs. Swiping a wrong ayah, or "Add All Ayahs to Respective Paras", saves it to the revision list | Mistake marking on the mushaf: **tapping a word toggles it as a mistake**. Marked words are shown in red text on a light-red background, and ayahs with marked words get their own "marked ayahs" page. Long-press, or a setting that swaps tap and long-press, opens a sheet with translation and other actions | Granularity: para (juz) selection for quizzes. Mushaf layouts: 16/15/13-line IndoPak and 15-line Uthmani | Unique: per-juz mutashabihat list — [GitHub README](https://github.com/Waqar144/quran_memorization_helper); source files `lib/pages/quiz_page.dart`, `lib/models/quiz.dart`, `lib/widgets/read_quran.dart`, `lib/utils/colors.dart` in [the repo](https://github.com/Waqar144/quran_memorization_helper) (read directly)
- **Thabbit / ثبّت** (thabbit.app, formerly thabitapp.io; iOS) | Prompts: you "instantly recite a page when prompted with the page number" and "instantly recall the page number when prompted with any page or verse". It tests "all the possible mutashabihat". Pages are the unit tested by spaced repetition | Reveal, buttons, grading: not described publicly. Its FAQ lists "How can I highlight a mistake I made during my review?", which implies some per-mistake highlighting, but the answer is not public | Unique: page-number ↔ content drills; tests scheduled "right as they approach memory decay", with weak portions tested more often; quizzes "to test out of Surahs you know"; described as inspired by medical-education spaced repetition and active recall — [thabbit.app/about](http://thabbit.app/about); [App Store](https://apps.apple.com/us/app/thabit-%D8%AB%D8%A8-%D8%AA/id6743057803) **[snippet]**
- **Al Quran Memoriser** (Greentech Apps Foundation; **no longer maintained**, users are pointed to Greentech's main "Quran app") | Tests: **"Ayah matcher"**, **"Word matcher"**, **"Ayah finder"**; ayahs can be hidden; "Annotate & Mark issues with a particular Ayah or Word"; memorisation status can be set per Ayah or Surah | Grading details not documented — [GTAF page](https://gtaf.org/apps/quran-memoriser/); "Quick show/hide ayahs" per [howtomemorisethequran.com](https://howtomemorisethequran.com/top-quran-memorization-apps/) **[secondary]**. **Uncertain**: whether the successor app, Al Quran (Tafsir & by Word), kept these tests. I found no confirmation.
- **Mualim** (mualim-app.com) | Quiz Tool with a timed "Test Mode" and a self-paced "Training Mode", answered in "written or vocal responses" | Grading: verses rated **Easy / Good / Hard / Forgotten**. The "Diamond" revision program brings the weakest surahs forward from cycle 2. The "Crystal" program keeps a fixed order (starting from the last juz) and highlights weak surahs | Corrector: AI speech matching that "highlights word mismatches in real time" (not tajweed) | Unique: **"Binder"** shows "commonly confused verses side by side" — a mutashabihat comparison view — [Mualim site](https://mualim-app.com/en)
- **Quran Memorization Test** (SmartDataSoft; Android and iOS) | Mainly **multiple-choice**: Text Quiz and Audio Quiz by surah, para or page; an "Exam Mode" over a surah, para or page range; recording; "Hifz Mode"; tracking of surahs memorized; "similar āyāt listing" — [Play](https://play.google.com/store/apps/details?id=smartdatasoft.quranmemorizationtest) and [App Store](https://apps.apple.com/eg/app/quran-memorization-test/id6526495796) **[snippet; the Play page fetch was truncated]**; similar-ayat listing per [howtomemorisethequran.com](https://howtomemorisethequran.com/top-quran-memorization-apps/) **[secondary]**
- **Memorize Quran** (com.quran.easyquranmemorizer) | "IntelliJ Mode" builds successive verse sets automatically with a **"moving window"** that links new verses to earlier ones; also a "Revision mode" | No self-test reveal mechanics documented — [Play](https://play.google.com/store/apps/details?id=com.quran.easyquranmemorizer&hl=en_US) **[snippet]**; [howtomemorisethequran.com](https://howtomemorisethequran.com/top-quran-memorization-apps/) **[secondary]**
- **Al Muhaffiz** | "Self-testing", "hide āyahs" — [howtomemorisethequran.com](https://howtomemorisethequran.com/top-quran-memorization-apps/) **[secondary; details unverified]**
- **BeHafizh** | "Memorization test" with **color indicators**, plus "hide āyahs" — [howtomemorisethequran.com](https://howtomemorisethequran.com/top-quran-memorization-apps/) **[secondary]**
- **With The Qur'an** | "Hifz tests, hifz tracking" — same source **[secondary]**
- **Arabic market: تسميع (Tasmee')** by إقرأ للتقنية (Eqra Tech) | Speech-recognition tasmee': it "listens to your recitation, helps you when you forget the next word, and corrects you when you make a mistake". It shows "helping words" on screen, lists phonetically similar words, and can hide ayahs while repeating a chosen sheikh's recitation | AI, not manual — [thewriteress review](https://thewriteress.com/review-about-tasmee-app/); [mobizil](https://mobizil.com/tasmee-download/) **[snippet]**
- **Arabic market: تمكين (Tamkeen)** | Microphone recording of your own tasmee' plus a feature to **hide ayahs and reveal the hidden ones** to test your memorization — [safaaemam.com](https://www.safaaemam.com/2022/12/quran-tamkeen-app.html) **[snippet]**
- **Quranic** (Quranic: Learn Quran and Arabic) | A language-learning app, **not a hifz tester**. It uses spaced repetition and gamification over high-frequency Quranic vocabulary ("300 words ≈ 70% of the Quran"). The relevant mechanic is SRS scheduling of small units — [Play](https://play.google.com/store/apps/details?id=com.pnw.quranic.quranicandroid&hl=en_US) **[snippet]**
- **Anki – Quranki deck** (Nasr-905) | Front: all earlier **segments** of the current ayah plus up to 5 earlier ayahs, enough to make the prompt unique, with juz, surah, ayah and segment numbers and word-by-word translation | Back: only the tested segment plus its audio (Alafasy) | Segmentation splits ayahs at **waqf marks** (م, لا, ج, قلی, صلی), giving about **10,521 cards instead of 6,236**, with an average answer of **7.3 words instead of 12.5**. Grading is standard Anki (Again/Hard/Good/Easy) — [GitHub](https://github.com/Nasr-905/Quranki); [AnkiWeb](https://ankiweb.net/shared/info/1523216508)
- **Anki – other structures** | The **LPCG (Lyrics/Poetry Cloze Generator)** add-on shows the previous two verses and asks you to recall the next one — [howtomemorisethequran.com flashcards](https://howtomemorisethequran.com/using-flashcards-for-hifz-quran-memorisation/) **[snippet]**. A "position-based" scheme shows the page's first line as the question and asks you to recall the whole page — [Medium, fazbdillah](https://fazbdillah.medium.com/position-based-quran-memorization-with-anki-4eacd31114ca) **[snippet]**
- **hifz** (CandanUmut, open source, runs in the browser, ships Al-Fātiḥa and Juz ʿAmma) | Hint system is a **five-level "ink fade": "from full ink through first-letters and word-shaped ghost rules to blank measured space"** | Reveal: **tap any faded word to peek for 1.8 s**; every peek is recorded and **caps that item's grade** | Grading: 4 levels, **No idea / Barely / Yes / Easily**, scheduled with FSRS | It keeps "intent" (learning/maintaining/paused) separate from "evidence" (untested/weak/fair/strong/cold_verified) — [GitHub](https://github.com/CandanUmut/hifz)
- **Tasmiq** (xebec51/quran-memorization-app, open source web app, Indonesian MHQ style) | Random questions, one per Madani page per cycle, in packages of 10, 20 or 30 juz | **Three-tier progressive hints: (1) the juz, (2) the surah name, (3) a progressively longer fragment of the answer** | Grading: self-counted **"bel"** (mistakes corrected) and **"tuntun"** (prompts needed). Zero of both = "Lancar" (fluent); otherwise "Belum Lancar". Expandable per-question history (prompt plus full revealed answer) and analytics — [GitHub](https://github.com/xebec51/quran-memorization-app)
- **hifz_app** (RafatAiub, Expo/React Native) | Flow: "listen, repeat, hidden recall, record, self-review and rating" — [GitHub](https://github.com/RafatAiub/hifz_app) **[snippet]**
- **quranm** (ibrahimokdadov, based on Tilawa) | "After two matched readings, the upcoming text is hidden" (on-device speech recognition) — [GitHub](https://github.com/ibrahimokdadov/quranm) **[snippet]**

**Apps with no hifz self-test found**
- **Ayah – Quran App**: the sources describe it as free, with many reciters, a Mushaf view and precise ayah-looping/repetition, but they mention no test mode — [dralirajabi roundup](https://dralirajabi.com/best-quran-apps-2026/) **[snippet/secondary]**
- **Al Quran (Tafsir & by Word)** by Greentech: no test mode found in what I could fetch. Its predecessor, Al Quran Memoriser (above), had the tests.
- **Muslim Pro, iQuran, Quran Majeed**: I found no source describing self-test or hide/reveal hifz features. Treat this as "not found", not as confirmed absence.
- Itqan- and Hafiz-branded apps: no reliable primary source found.

### Inferences
- The simplest, proven non-AI pattern is in the Waqar144 helper: prompt, then **Show Answer**, then a binary **Yes/No**, then a review list of wrong answers that can be added to revision, with **per-word mistake toggling on the mushaf**. It maps directly onto a self-reveal and self-grade design.
- Richer patterns for a later version: graded hint ladders (CandanUmut's first-letter → shape → blank fade; Tasmiq's juz → surah → fragment), peeks that cap the grade, and mistake/prompt counters ("bel/tuntun").
- Segmenting at waqf marks (Quranki) is a good way to make the reveal unit smaller than an ayah but bigger than a word.
- Page-number ↔ content drills (Thabbit) and side-by-side mutashabihat (Mualim Binder, Waqar144 lists) set these apps apart, and neither needs AI.

### Gaps
- Exact behavior of the Ayat "blank pages" test, Thabbit's reveal/grade UI, and the BeHafizh, Al Muhaffiz and With The Qur'an test screens. Only listing text was available; no screenshots or videos were reviewed.
- Whether Greentech's current Quran app kept the ayah/word matcher tests.
- Saudi tahfeez-society apps (e.g., "مصحف التحفيظ", "المصحف المعلم", "رتل") were not covered in any source I could fetch.

## Q2. Controls/buttons and grading schemes

### Takeaway
Grading falls into four types:
1. **Binary** — Waqar144 Yes/No.
2. **4-level SRS** — Anki Again/Hard/Good/Easy; CandanUmut No idea/Barely/Yes/Easily; Mualim Easy/Good/Hard/Forgotten.
3. **Counts** — Tasmiq's bel/tuntun mistake and prompt counts, which collapse to fluent / not fluent.
4. **Score totals** — "Your score is X/Y" (Waqar144); MCQ exams (Quran Memorization Test).

Reveal controls are a single "Show Answer" button, swipe-to-reveal (Quran Companion), timed tap-to-peek per word (CandanUmut), or staged hint buttons (Tasmiq).

### Cited Findings
- "Show Answer" button, then "Were you right?" with **No / Yes** buttons that add 0 or 1 to the score; wrong answers are collected — [quiz_page.dart](https://github.com/Waqar144/quran_memorization_helper)
- Swipe right-to-left to reveal progressively; swipe left-to-right to re-hide — [Quran Companion FAQ](https://quranacademy.io/blog/quran-companion-faq/) **[snippet]**
- Tap a faded word for a 1.8 s peek; each peek caps the grade; 4-button rating — [CandanUmut/hifz](https://github.com/CandanUmut/hifz)
- Three-stage hints (juz → surah → growing answer fragment); counts of bel and tuntun; Lancar / Belum Lancar — [Tasmiq](https://github.com/xebec51/quran-memorization-app)
- Ratings of Easy / Good / Hard / Forgotten drive reordering of weak surahs — [Mualim](https://mualim-app.com/en)
- Timed Test Mode vs untimed Training Mode — [Mualim](https://mualim-app.com/en)

### Inferences
- A non-AI Android feature could combine: a Reveal (next word / next ayah) button; peek counting that lowers the grade; and an end-of-item self-grade of either Right/Wrong or 3–4 levels. Hint and peek counts would be stored as evidence, as Tasmiq and CandanUmut do.

### Gaps
- No public documentation of undo controls in any app reviewed.
- Quran Companion has no documented in-app grading.

## Q3. How mistakes are recorded and displayed

### Takeaway
Only Waqar144 (open source) and Greentech's Al Quran Memoriser are documented as recording mistakes **per word**. Waqar144 shows them on the mushaf in red text on a red-tinted background and also lists them per juz. Other apps record at ayah, surah or page level (ratings, weak-surah highlighting, a wrong-answers list), or rely on AI word highlighting (Mualim Corrector, Tasmee').

### Cited Findings
- Waqar144: tapping a word toggles it in `markedWords` for that ayah. It renders red (`Colors.red`) on `Colors.red.shade100` (light theme) or red at alpha 80 (dark theme). There is a "Marked ayahs" page, and quiz misses can be added to the respective para's revision list — [repo source](https://github.com/Waqar144/quran_memorization_helper)
- Greentech Al Quran Memoriser: "Annotate & Mark issues with a particular Ayah or Word"; status can be set per Ayah or Surah — [GTAF](https://gtaf.org/apps/quran-memoriser/)
- Mualim Crystal program: "Weak surahs are highlighted"; Corrector "highlights word mismatches in real time" (AI) — [Mualim](https://mualim-app.com/en)
- BeHafizh: test results with color indicators — [howtomemorisethequran.com](https://howtomemorisethequran.com/top-quran-memorization-apps/) **[secondary]**
- Tasmiq: per-question history storing the prompt and the full revealed answer, plus analytics — [GitHub](https://github.com/xebec51/quran-memorization-app)
- Thabbit: FAQ entry "How can I highlight a mistake I made during my review?" suggests in-review mistake highlighting; the mechanism is undisclosed — [thabbit.app/about](http://thabbit.app/about)

### Inferences
- The proven pattern for a manual self-test is per-word mistake marks overlaid on the mushaf (tap a word to toggle), plus a per-session wrong-items list. Ayah-level marks follow automatically: an ayah is marked if any of its words is marked.

### Gaps
- No source showed mistake history over time (trend charts per word or ayah) for any of these apps except Tasmiq's per-question history.
