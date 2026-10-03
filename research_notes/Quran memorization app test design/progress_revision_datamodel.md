# Quran Memorization: Progress Tracking, Revision Scheduling, and Mistake Data Models

Research date: 2026-10-03. Scope: design input for a non-AI self-test feature (user reveals text manually, self-grades right/wrong, per-ayah history kept) in an Android app.

## 1. Traditional hifz methodology: tiers, daily loads, grading, thresholds

### Takeaway
Both South Asian (sabaq / sabqi / manzil) and Arab (جديد / مراجعة قريبة / مراجعة بعيدة) traditions use the same three tiers every day: new material, a sliding window of recent material (about 7 days, 20 pages, or 20 to 30 days depending on school), and a rotating long-term cycle (often 1 juz/day, so about 30 days for a full khatma). Formal exams grade by counting events (تنبيه = prompted and self-corrected, فتح/تلقين = examiner supplies the text, تجويد/لحن errors, تردد = hesitation) and subtracting fixed points. The usual pass band is about 70% or higher. For daily sabaq the teacher's standard is "error-free before it counts".

### Cited Findings
**Three-tier structure (South Asian)**
- Sabaq is the new portion memorized each day and brought to the teacher. Sabqi is revision of recently memorized material. Manzil is older material revised on a rotating schedule. Every day the student does all three tiers. — [Islamic Tuition: Sabaq, Sabqi and Manzil](https://islamictuition.us/blog/sabaq-sabqi-manzil-hifz-revision-system/); [Suffah Quran](https://suffahquran.com/sabaq-sabqi-manzil-hifz-review-system/)
- The sabqi window is "typically the last 7 to 15 days of Sabaq". Its purpose is to move material from short-term to medium-term retention. — [Islamic Tuition](https://islamictuition.us/blog/sabaq-sabqi-manzil-hifz-revision-system/)
- Another source gives the sabqi window as "roughly the last 20 to 30 days of lessons" and says "the exact window varies by school". This conflicts with the 7–15 day figure above, so the window should be configurable. — [The Hifz Project](https://thehifzproject.com/articles/sabaq-sabqi-manzil)
- Daily sabaq is "a few lines and a full page" depending on capacity, "perhaps one page of new material and many pages of old". For advanced students, manzil is "around one juz per day, so the entire Quran comes around roughly every month". — [The Hifz Project](https://thehifzproject.com/articles/sabaq-sabqi-manzil)
- Sabaq "must be error-free before it counts". "A lesson accepted with mistakes becomes a mistake memorized". A weak sabaq "may be sent back for more preparation". If sabqi falls behind, "most teachers pause new lessons entirely until the backlog is stable again". No numeric mistake threshold is given. — [The Hifz Project](https://thehifzproject.com/articles/sabaq-sabqi-manzil)
- Indonesian pesantren research describes sabaq / sabqi / manzil as three complementary stages (new, repetition of new, muraja'ah of old). — [Jurnal Pendas (Unpas)](https://journal.unpas.ac.id/index.php/pendas/article/view/41462); [Al-Qiyam (STAI Al-Furqan)](https://ojs.staialfurqan.ac.id/alqiyam/article/view/788)

**Arab tahfeez circles**
- Comprehensive plans have three parts. الحفظ الجديد is the new portion. المراجعة القريبة revises the last 7 days of memorization. المراجعة البعيدة revises old ajza' weekly or lightly every day. An example time split is 10 min new, 10 min consolidating the previous new portion, 10 min old, with a fixed minimum of 90 minutes a day across memorization and revision. — Search-result summary of Arabic plan pages: [Shaykhi 3-month plan](https://shaykhi.com/ar/blog/schedule-memorizing-quran-in-3-months/); [Dar Al-Tebyan 6-month plan](https://www.daraltebyan.com/blog/%D8%AE%D8%B7%D8%A9-%D9%84%D8%AD%D9%81%D8%B8-%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86-%D8%A7%D9%84%D9%83%D8%B1%D9%8A%D9%85-%D9%81%D9%8A-6-%D8%A3%D8%B4%D9%87%D8%B1-%D9%85%D8%B9-%D8%AC%D8%AF%D9%88%D9%84-%D8%B9%D9%85%D9%84%D9%8A-%D9%84%D9%84%D9%85%D8%B1%D8%A7%D8%AC%D8%B9%D8%A9-%D9%88%D8%AA%D8%AB%D8%A8%D9%8A%D8%AA-%D8%A7%D9%84%D8%AD%D9%81%D8%B8-%D8%A8%D8%AF%D9%88%D9%86-%D8%AA%D8%B4%D8%AA%D8%AA) (snippet level; I did not fetch the full pages)
- Dr. Saeed Abu al-Ala Hamza's "Five Fortresses" (الحصون الخمسة) method has five parts: (1) continuous reading القراءة المستمرة, (2) preparation التحضير, (3) far revision مراجعة البعيد, (4) near revision مراجعة القريب, which covers "the 20 pages adjacent to the memorization page", and (5) new memorization. — [Islamweb fatwa 157229](https://www.islamweb.net/ar/fatwa/157229/%D8%A7%D9%84%D8%AD%D8%B5%D9%88%D9%86-%D8%A7%D9%84%D8%AE%D9%85%D8%B3%D8%A9); [Alukah forum](https://majles.alukah.net/t101302/) (from search snippets; the full Alukah page failed to load because of a TLS error)

**Error classes (Arabic terminology)**
- اللحن الجلي (clear error) affects the wording and breaks the meaning or the i'rab. اللحن الخفي (hidden error) breaks tajweed rules or perfect pronunciation without changing the meaning, and only trained reciters notice it. — [Nabulsi](https://nabulsi.com/web/article/11280); [SurahQuran: Lahn](https://surahquran.com/Tajweed/lahn-telawah.html); [Shafe3 Academy](https://shafe3academy.com/%D8%A7%D9%84%D9%84%D8%AD%D9%86-%D8%A7%D9%84%D8%AC%D9%84%D9%8A-%D9%88%D8%A7%D9%84%D9%84%D8%AD%D9%86-%D8%A7%D9%84%D8%AE%D9%81%D9%8A/)
- The Ahl al-Quran (ehlquran) test platform uses three deduction categories. تلقيني is when the committee supplies the verse (فتح). تنبيهي is when the committee alerts the student and the student self-corrects. تجويدي is a tajweed rule not applied. Admins enter total counts per category, not per word. Grade bands: retake يعيد الامتحان 0–70, جيد 70–80, جيد جدا 80–90, ممتاز 90–100. — [Ahl al-Quran help: اختبارات القرآن](https://help.ehlquran.com/ar/articles/8570962-%D8%A7%D8%AE%D8%AA%D8%A8%D8%A7%D8%B1%D8%A7%D8%AA-%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86)
- Al-Azhar's international competition gives memorization 80 marks (4 questions × 20), performance 10 and tajweed 10. Within performance, 3 marks are for fluency and absence of hesitation (الانطلاق وعدم التردد) and 3 for stopping and starting (الوقف والابتداء). The student is not given فتح at the first error: "ينبه عليه أولًا مرتين ثم يتم الفتح بخصم درجة", meaning two alerts first, then a فتح that costs 1 mark. — [Al-Azhar portal](https://azhar.eg/details/ArtMID/821/ArticleID/41603/%D9%85%D8%B9%D8%A7%D9%8A%D9%8A%D8%B1-%D8%A7%D9%84%D8%AA%D9%82%D9%8A%D9%8A%D9%85-%D9%81%D9%8A-%D9%85%D8%B3%D8%A7%D8%A8%D9%82%D8%A9-%D8%A7%D9%84%D8%A3%D8%B2%D9%87%D8%B1-%D8%A7%D9%84%D8%B9%D8%A7%D9%84%D9%85%D9%8A%D8%A9-%D9%84%D9%84%D9%82%D8%B1%D8%A2%D9%86-%D8%A7%D9%84%D9%83%D8%B1%D9%8A%D9%85)
- In another competition (Oman / Gulf), a memorization error is signalled by a bell and each تنبيه costs half a mark. The contestant is alerted only after going three words past the error. فتح gives only as much text as removes the confusion. — Search-result summary drawing on [Oman Daily](https://www.omandaily.om/%D8%A5%D8%B4%D8%B1%D8%A7%D9%82%D8%A7%D8%AA/na/%D8%B1%D8%A7%D8%B4%D8%AF-%D8%A7%D9%84%D8%AF%D8%BA%D9%8A%D8%B4%D9%8A-%D8%AA%D9%82%D9%8A%D9%8A%D9%85-%D8%A7%D9%84%D9%85%D8%AA%D8%B3%D8%A7%D8%A8%D9%82%D9%8A%D9%86-%D9%8A%D8%AA%D9%85-%D9%88%D9%81%D9%82-%D9%85%D8%B9%D9%8A%D8%A7%D8%B1%D9%8A%D9%86-%D9%87%D9%85%D8%A7-%D8%A7%D9%84%D8%AD%D9%81%D8%B8-%D9%88%D8%A7%D9%84%D8%A3%D8%AF%D8%A7%D8%A1) and [Qatar Jassim competition guide](https://islam.gov.qa/jassim/pdf/dallel-all.pdf) (snippet only; the PDF was too large to fetch, so I could not tell which competition each rule comes from)
- A UAE competition used 70 marks for memorization and 25 for tajweed/recitation. — [Al Etihad](https://www.aletihad.ae/article/61614/2015/70-%D8%AF%D8%B1%D8%AC%D8%A9-%D9%84%D9%84%D8%AD%D9%81%D8%B8-%D9%8825-%D9%84%D9%84%D8%AA%D8%AC%D9%88%D9%8A%D8%AF-%D9%88%D8%A7%D9%84%D8%AA%D9%84%D8%A7%D9%88%D8%A9-%D9%85%D8%AD%D9%88%D8%B1-%D8%A7%D9%84%D8%AA%D9%86%D8%A7%D9%81%D8%B3) (headline only)

### Inferences
- A self-test app maps cleanly onto three tiers: `new` (sabaq), `recent` (sabqi, with a configurable window of 7 days, 20 pages, or 20–30 days), and `old` (manzil rotation, defaulting to 1 juz/day). These should be the first-class "session types".
- For self-grading, a small set of mistake severities that mirrors exam practice is defensible:
  - `prompt_needed` (تلقين/فتح), the heaviest
  - `self_corrected` (تنبيه)
  - `hesitation` (تردد)
  - `tajweed`/`harakah` (لحن خفي vs جلي)

  Default point weights could follow the exams: 1.0 for a فتح, 0.5 for a تنبيه. A page or ayah passes at 90% or above ("ممتاز") in strict mode and 70% or above in lenient mode.
- The rule "do not accept sabaq with mistakes" suggests that, by default, an ayah in the `new` tier only graduates to `recent` after a clean attempt.

### Gaps
- I found no standardized per-page mistake limit across tahfeez organizations. Thresholds vary by circle and competition, and the main sources give policies, not universal norms.
- I could not fetch the full Qatar Jassim PDF (too large) or the Five Fortresses source text (TLS error). Exact daily far-revision amounts for that method are unverified.

## 2. How apps implement plans, goals, streaks, and spaced repetition

### Takeaway
Mainstream apps (Quran.com, Tarteel) offer daily or duration goals measured in minutes, pages, or verse ranges, plus streaks and heatmaps. Hifz-specific trackers (AHD, Rasekh, Hifz Hero, Hifdh Revision Tracker, Awladuna) layer adaptive scheduling on top: Leitner boxes or SM-2 variants, a per-page strength score that decays over time, "weakest first" manzil, and end-date plans. Pure flashcard SRS (Anki/Quranki) works when the unit is a page or a passage prompted by the preceding text. Practitioners say it "requires a number of tweaks" for continuous text.

### Cited Findings
**Goals and streaks**
- Quran.com "Growth Journey" goal types:
  - time: "total number of minutes … daily or within a certain duration"
  - pages
  - custom verse range ("can be used to read a certain page/Surah/Juz")

  Daily goals reset in the local timezone. Duration goals spread progress evenly across the period and "auto-adjust" to the daily pace. Reading "at least a verse daily" keeps the streak alive. — [Quran.com product update](https://quran.com/product-updates/quran-reading-streaks)
- Tarteel (App Store listing) offers:
  - "Smart Goals: Set custom targets for memorization, revision, or reading", for example "Surah Al-Kahf every Friday" or "Review Juz 30"
  - "Advanced Analytics: Visualize your progress with streaks and heatmaps"
  - "Historical Mistakes: Review a log of your past recitation errors"
  - "Peeking & Hidden Verses Mode" (Premium)
  - a "Test Mode" for random placement challenges

  — [Tarteel App Store](https://apps.apple.com/us/app/tarteel-ai-quran-memorization/id1391009396)
- Rasekh (iOS hifz tracker):
  - one-tap grading from "repeat soon" to "flawless", which schedules the next review
  - marking of specific words for tajweed issues, hesitation, or forgotten verses
  - "A shaky surah returns within days, a solid one waits longer"
  - day-by-day weekly plans that respect rest days, exportable to PDF for teachers
  - streaks with weekly freezes

  — [Rasekh App Store](https://apps.apple.com/us/app/rasekh-quran-hifz-tracker/id6766639262)
- Hifdh Revision Tracker (Android, Tazkiya Tech) sets revision targets for surahs, juz, and hizbs by day, week, or month, lets you tick them off, and shows how often each unit is revised. — [Google Play](https://play.google.com/store/apps/details?id=com.tazkiyatech.hifdhtracker&hl=en_US)
- Awladuna hifz-tracker orders wird pieces by score so the weakest ones are scheduled more often (search snippet; I could not load the README). — [GitHub Awladuna/hifz-tracker](https://github.com/Awladuna/hifz-tracker)

**Plans by end-date and three-track scheduling (AHD / عهد open-source)**
- AHD has three daily tracks:
  - Sabaq: about 8 lines/day in a 3-year plan
  - Sabqi: the last 7 days of sabaq, recited daily
  - Manzil: either adaptive (weakest first) or classic 1 juz/day

  "All three must show green completion for the day to count." — [GitHub Bahtiyorjon05/Quran-learning-plan- (AHD)](https://github.com/Bahtiyorjon05/Quran-learning-plan-)
- AHD's per-page strength score runs 0–100. It rises with clean recitations, falls with mistakes, and decays when untouched: pages not reviewed for about 40 days lose their gains. The scheduler is an SM-2 variant in which lapses penalize harder and "double-lapsed pages re-enter the sabqi track". — [AHD README](https://github.com/Bahtiyorjon05/Quran-learning-plan-)
- AHD's plan tables are `users → plans` (with an immutable `plan_amendments` log) `→ memorization_units` (pages or ayahs with strength, ease, lapses) `→ review_logs` (timestamped, with mistake tagging). A database invariant enforces `plans.current_end_date <= plans.original_end_date`: the deadline can only move closer. — [AHD README](https://github.com/Bahtiyorjon05/Quran-learning-plan-)
- Hifz Hero (Flutter):
  - ayah-range memorization tracking
  - a Leitner-box scheduler
  - "ranks your weakest ayahs and shows a heatmap of the days you reviewed"
  - quizzes (complete the ayah, which surah, missing word, which juz) that count as review events
  - a 30-juz path showing percent memorized
  - streaks and XP
  - storage in `shared_preferences`

  — [GitHub HibaChamkhi/hifdh_hero](https://github.com/HibaChamkhi/hifdh_hero)
- personal-quran-revision-roadmap (Angular) tracks daily sabaq, sabqi, and weekly manzil loops in localStorage. — [GitHub Zamy97](https://github.com/Zamy97/personal-quran-revision-roadmap)

**Spaced repetition for Quran (Anki, SM-2, FSRS)**
- Quranki (AnkiWeb shared deck) makes each card a screenshot of a mushaf page with a portion of the verse. It supports 1-year (39 cards/day) through 10-year (4 cards/day) timeframes. — [AnkiWeb Quranki](https://ankiweb.net/shared/info/1523216508) (from the search snippet; the page body did not render on fetch)
- One Anki setup puts the preceding page on the card front and the memorized page on the back ("recall what follows"). The user said "I was able to review a page within 3 to 5 minutes and a complete Juz within one to one and a half hours", compared with 15–20 minutes per page before. The author cautions that "to use it for the Qur'ān requires a number of tweaks". — [HowToMemoriseTheQuran: flashcards](https://howtomemorisethequran.com/using-flashcards-for-hifz-quran-memorisation/)
- A "cardflow" variant: record yourself reciting, make a flashcard for every mistake, and review those cards alongside daily recitation of a weekly section (Juz 30 split into 7). — [HowToMemoriseTheQuran](https://howtomemorisethequran.com/using-flashcards-for-hifz-quran-memorisation/)
- Tarteel's blog recommends expanding intervals for new verses of 1, 3, 7, 14 days "and so on", with a unit of one ayah, a few verses, or a page. — [Tarteel blog: spaced repetition](https://tarteel.ai/blog/unlocking-quran-memorization-with-spaced-repetition-a-powerful-tool-for-lasting-retention/)
- Anki 23.10+ ships FSRS natively. Its default parameters come from about 727M reviews from 10k users, and it needs fewer reviews than SM-2 for the same retention. — [fsrs4anki GitHub](https://github.com/open-spaced-repetition/fsrs4anki) (per search summary)
- One guide says newly memorized verses should ideally be revised daily for at least 30 days, then weekly. — [Jom Al-Quran revision guide](https://jomalquran.my/guide/memorization/revision/) (snippet)

### Inferences
- For continuous text, the effective SRS unit is a page or passage (prompted by the previous page or ayah), not an isolated ayah. Per-ayah results should be aggregated to a page (or a user-chosen unit) for scheduling, while per-ayah and per-word detail is kept for diagnosis. AHD (page units, ayah-level detail) and Quranki (page cards) both follow this pattern.
- A hybrid works better than pure SRS: a fixed classical manzil rotation as the floor, with SRS/strength used to pull weak pages forward. Rasekh and AHD's adaptive manzil both do this, and it respects the tradition that all memorized material is cycled regardless of score.
- Right/wrong self-grading maps naturally to Leitner or FSRS "Again/Good". An optional 4-level grade (Again/Hard/Good/Easy, or Rasekh-style "repeat soon … flawless") gives FSRS more signal. FSRS is open-source and has Kotlin/Java ports, so it is feasible on Android. I did not verify the specific port libraries.
- End-date plans should store the original and current deadline plus an amendment log (the AHD pattern). This allows a "behind schedule" message and recalculation of the daily load.

### Gaps
- I found no published evaluation (academic or app telemetry) comparing FSRS or SM-2 with traditional manzil rotation for Quran retention. Evidence is anecdotal.
- I did not find Reddit threads with substantive discussion. Search did not surface r/Quran or r/islam threads on SRS effectiveness.
- I could not confirm whether Tarteel's "Smart Goals" schedule uses SRS internally.

## 3. Mistake categorization schemes (apps and teachers)

### Takeaway
AI apps detect word-level errors: missed, incorrect, and extra words, with Tarteel adding tashkeel checking and skipped-word flags. Teachers and exams classify by intervention (تنبيه / فتح-تلقين), hesitation (تردد), and severity (لحن جلي / خفي, tajweed). Mutashabihat confusion is a distinct, well-known category, and open datasets list confusable ayah pairs.

### Cited Findings
- Tarteel mistake detection covers word level: "Missed words, Incorrect words, Extra word". Letter-level detection (fatha/damma/kasra, pronunciation, tajweed) was not supported at launch in 2022. — [Tarteel blog: Introducing Mistake Detection](https://tarteel.ai/blog/introducing-mistake-detection/)
- The current Tarteel listing adds "word-level error identification and tashkeel (diacritical mark) accuracy checking" and a follow-along that "flags skipped words". Tapping a mistake shows "what you recited versus the correct Ayah". — [Tarteel App Store](https://apps.apple.com/us/app/tarteel-ai-quran-memorization/id1391009396)
- Rasekh lets the user mark specific words with tajweed issues, hesitation, or forgotten verses. — [Rasekh App Store](https://apps.apple.com/us/app/rasekh-quran-hifz-tracker/id6766639262)
- Exam categories are تلقيني (examiner supplied the text), تنبيهي (alerted, then self-corrected), and تجويدي. — [Ahl al-Quran help](https://help.ehlquran.com/ar/articles/8570962-%D8%A7%D8%AE%D8%AA%D8%A8%D8%A7%D8%B1%D8%A7%D8%AA-%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86)
- Hesitation (التردد) is scored explicitly: "٣ درجات للانطلاق وعدم التردد". — [Al-Azhar](https://azhar.eg/details/ArtMID/821/ArticleID/41603/%D9%85%D8%B9%D8%A7%D9%8A%D9%8A%D8%B1-%D8%A7%D9%84%D8%AA%D9%82%D9%8A%D9%8A%D9%85-%D9%81%D9%8A-%D9%85%D8%B3%D8%A7%D8%A8%D9%82%D8%A9-%D8%A7%D9%84%D8%A3%D8%B2%D9%87%D8%B1-%D8%A7%D9%84%D8%B9%D8%A7%D9%84%D9%85%D9%8A%D8%A9-%D9%84%D9%84%D9%82%D8%B1%D8%A2%D9%86-%D8%A7%D9%84%D9%83%D8%B1%D9%8A%D9%85)
- لحن جلي changes the word or its meaning or i'rab (including harakah errors that change i'rab). لحن خفي is tajweed or articulation without a change in meaning. — [Nabulsi](https://nabulsi.com/web/article/11280); [SurahQuran](https://surahquran.com/Tajweed/lahn-telawah.html)
- Hifz Companion's mutashabihat match types are EXACT_FULL_AYAH, EXACT_PHRASE, NEAR_EXACT_PHRASE, SIMILAR_BEGINNING, SIMILAR_ENDING, SIMILAR_MIDDLE_PHRASE, SIMILAR_STRUCTURE, and CONTEXTUAL. — [GitHub Hifz-companion](https://github.com/shahudtaha08-source/Hifz-companion)
- Waqar144/Quran_Mutashabihat_Data is JSON: objects with `src` (absolute ayah number, or an array of them) and `muts` (a list of matching absolute ayah numbers). It is curated for "the most common mutashabihas that confuse" huffaz and is not exhaustive. QUL also publishes mutashabihat data. — [GitHub Waqar144/Quran_Mutashabihat_Data](https://github.com/Waqar144/Quran_Mutashabihat_Data); [QUL](https://qul.tarteel.ai/)
- Quran Memorization Helper (Android/desktop, Waqar144) lets users "create a list of ayahs for each para/juz" that they find difficult, take quizzes, and view mutashabihat per para. It supports 16-, 15-, and 13-line mushafs. — [GitHub Waqar144/quran_memorization_helper](https://github.com/Waqar144/quran_memorization_helper)

### Inferences
Proposed enum for self-grading, unifying app and teacher schemes. Word-level types attach to a word location. Ayah-level types attach to the ayah.

| code | label (ar) | level | source analogue |
|---|---|---|---|
| `MISSED_WORD` | سقط / حذف كلمة | word | Tarteel "missed" |
| `WRONG_WORD` | إبدال كلمة | word | Tarteel "incorrect" |
| `ADDED_WORD` | زيادة كلمة | word (insert after position) | Tarteel "extra" |
| `HARAKAH` | خطأ في الحركة / الضبط (لحن جلي if it changes the meaning) | word | Tarteel tashkeel |
| `TAJWEED` | خطأ تجويدي (لحن خفي) | word | تجويدي |
| `HESITATION` | تردد | word or ayah | Al-Azhar |
| `SELF_CORRECTED` | تنبيه | word | تنبيهي |
| `PROMPT_NEEDED` | فتح / تلقين | word or ayah | تلقيني |
| `SKIPPED_AYAH` | سقط آية | ayah | Tarteel "skipped" |
| `MUTASHABIH` | خلط بمتشابه (stores `confused_with` ayah) | ayah or word | Hifz Companion / Waqar144 |
| `ORDER` | تقديم وتأخير | ayah | inferred, no specific source |

- For a non-AI flow, the minimal input is right/wrong per ayah. Word marking can be optional and done by tapping words in the revealed text. That is how Rasekh exposes word marking.

### Gaps
- I found no published standard taxonomy shared across tahfeez organizations. The list above is a synthesis.
- I found no source on the reliability of self-grading compared with teacher grading.

## 4. Data model: sessions, per-ayah results, per-word marks, aggregates; word-indexing conventions

### Takeaway
Existing open-source schemas (Hifz Companion, AHD) use the pattern Session → Entry (per ayah or page) → Mistake, plus a per-unit status/strength row and a streak row. Word addressing in the Quran.com/QUL ecosystem uses `location = "surah:ayah:word"` (1-based position within the ayah) plus page and line numbers per mushaf layout. That makes `(surah, ayah, word_position)` a stable, layout-independent key, and page/line can be derived through a layout table.

### Cited Findings
- Hifz Companion Prisma models (verbatim fields):
  - `AyahStatus {userId, ayahId, status default "NOT_STARTED", updatedAt; @@unique([userId, ayahId])}`
  - `RevisionSession {userId, startedAt, endedAt?}`
  - `RevisionEntry {sessionId, userId, ayahId, revisedAt, recallQuality, mistakeCount default 0, confidence default 3, recalledWithoutLooking Boolean; @@index([userId, ayahId, revisedAt])}`
  - `Mistake {userId, ayahId, type, note?, createdAt; @@index([userId, ayahId]); @@index([userId, type])}`
  - `RevisionStreak {userId unique, currentStreak, longestStreak, lastActiveDay}`

  Reference data (6,236 `Ayah`, 114 `Surah`) is kept separate from user data. — [schema.prisma](https://raw.githubusercontent.com/shahudtaha08-source/Hifz-companion/main/prisma/schema.prisma); [README](https://github.com/shahudtaha08-source/Hifz-companion)
- AHD tables: `plans`, `plan_amendments` (immutable), `memorization_units` (strength, ease, lapses), and `review_logs` (with mistake tagging). Integrity is enforced with Postgres CHECK constraints and triggers. — [AHD README](https://github.com/Bahtiyorjon05/Quran-learning-plan-)
- Quran.com / Quran Foundation API word objects carry `id`, `position` (order within the verse), `char_type_name` (e.g. "word"), `page_number`, `line_number`, `audio_url` (e.g. `wbw/001_001_001.mp3`), `code_v1`, translation, and transliteration. The `location` field is formatted chapter:verse:word, e.g. "1:1:1". The first word of 1:1 is on page 1, line 2. — [Quran Foundation API: verse by key](https://api-docs.quran.foundation/docs/content_apis_versioned/verses-by-verse-key/); [By Chapter](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/verses-by-chapter-number/); [Verses SDK (wordFields incl. location)](https://api-docs.quran.foundation/docs/sdk/verses/)
- Mushaf lines often hold words from several verses. The layout guide groups words by `page-{page_number}-line-{line_number}`, not by verse. — [Quran Foundation: Page Layout guide](https://api-docs.quran.foundation/docs/tutorials/fonts/page-layout/)
- QUL word locations are surah:ayah:word, counted from 1 within the ayah. The corpus is about 77,430 words. — search-result summary referencing [QUL](https://qul.tarteel.ai/) and [QuranWBW](https://github.com/marwan/quranwbw) (I could not verify the figure on a primary page)
- Mutashabihat data keys on absolute ayah numbers (1–6236). — [Waqar144/Quran_Mutashabihat_Data](https://github.com/Waqar144/Quran_Mutashabihat_Data)

### Inferences
Proposed SQLite (Room) schema for the Android self-test feature. It is synthesized from the sources above; keep reference data and user data in separate databases or files.

```sql
-- Reference (shipped, read-only)
ayah(ayah_id INTEGER PK /*1..6236*/, surah INT, ayah INT, juz INT, hizb_quarter INT,
     page INT /*per chosen mushaf*/, word_count INT, UNIQUE(surah, ayah))
word(surah INT, ayah INT, pos INT /*1-based, excludes ayah-end marker*/, text TEXT,
     page INT, line INT, PRIMARY KEY(surah, ayah, pos))     -- location "s:a:w"
mutashabih(ayah_id INT, other_ayah_id INT, kind TEXT)       -- from Waqar144/QUL

-- User: plan & schedule
plan(id PK, name, start_date, original_end_date, current_end_date
     CHECK(current_end_date <= original_end_date) /*optional AHD rule*/,
     new_unit TEXT /*ayah|line|page*/, new_per_day REAL, recent_window_days INT DEFAULT 7,
     manzil_mode TEXT /*classic_juz_per_day|adaptive*/, manzil_per_day REAL, rest_days TEXT)
plan_amendment(id PK, plan_id, at, field, old_value, new_value)   -- immutable log
ayah_state(ayah_id PK, tier TEXT /*not_started|new|recent|old*/, memorized_at,
           -- scheduler state (FSRS or Leitner)
           stability REAL, difficulty REAL, box INT, due_at, last_reviewed_at,
           reps INT, lapses INT, strength REAL /*0..100 derived*/)

-- User: attempts
session(id PK, started_at, ended_at, tier TEXT /*new|recent|old|free*/,
        scope_type TEXT /*ayah_range|page|surah|juz*/, scope_from_ayah_id, scope_to_ayah_id,
        mode TEXT /*reveal_word|reveal_ayah|first_word_prompt*/)
attempt(id PK, session_id, ayah_id, at, result TEXT /*correct|wrong*/,
        grade INT NULL /*optional 1..4 Again/Hard/Good/Easy*/, reveals INT, hints_used INT,
        duration_ms INT, INDEX(ayah_id, at))
mistake(id PK, attempt_id, ayah_id, surah, ayah, word_pos NULL /*null = ayah-level*/,
        type TEXT /*enum in §3*/, confused_with_ayah_id NULL, note NULL,
        INDEX(surah, ayah, word_pos), INDEX(type))

-- Aggregates (materialized or computed views)
ayah_stats(ayah_id PK, attempts INT, wrong INT, last_wrong_at, error_rate REAL, weak_score REAL)
word_stats(surah, ayah, word_pos, mistakes INT, last_at, PRIMARY KEY(surah, ayah, word_pos))
daily_activity(date PK, ayat_tested INT, ayat_correct INT, minutes INT, tiers_done TEXT) -- streaks & heatmap
```

Notes on the schema:
- Store word marks by `(surah, ayah, word_pos)`, the "s:a:w" location, rather than by Quran.com's numeric word `id`. The location is layout-independent and human-readable. Page and line come from the shipped `word` table, so a mushaf change (15-line vs 16-line) needs no migration of user data. This matches the Quran Foundation guidance that layout is a per-mushaf grouping.
- Decide whether `pos` counts ayah-end markers. The Quran.com word list includes a `char_type_name` distinguishing "word" from other types. My unverified understanding is that the "end" type is the ayah marker, so filter to `char_type_name = 'word'`.
- `weak_score` can follow AHD: a 0–100 strength that rises on clean attempts, falls on mistakes, and decays with days since the last review. Mistake types can be weighted (PROMPT_NEEDED 1.0, SELF_CORRECTED 0.5, mirroring the exam deductions in §1).
- Streak rule options are Quran.com's "at least one verse per day" or AHD's "all three tiers green". Make this configurable, and offer Rasekh-style freezes.

### Gaps
- I could not confirm from a primary page whether the Quran.com numeric word `id` is globally unique and stable across API versions (the examples only show `id: 1`), nor the exact `char_type_name` enum values ("word", "end", …).
- I could not verify the "about 77,430 words" figure on a primary page. Counts differ by source and depend on whether ayah markers are included.
- I could not read Tarteel's internal mistake-history schema. It is proprietary and undocumented.

## 5. Visualizations used for progress

### Takeaway
Common patterns:
- a 30-juz grid or path colored by status or strength
- a 604-page mosaic grouped by juz with surah boundaries
- surah blocks sized by length and colored by firmness
- a calendar heatmap of review days plus streaks
- the mushaf page with mistake words highlighted, tappable to show what went wrong

### Cited Findings
- AHD "Mushaf Mosaic": all 604 pages as tiles grouped by juz, with surah boundaries drawn. States are not started, learning, memorized (weak), and memorized (strong). Tapping a tile shows the page's strength curve, recitation history, logged mistakes, and a revise action. — [AHD README](https://github.com/Bahtiyorjon05/Quran-learning-plan-)
- Rasekh: "The whole mushaf at a glance, every surah sized by its real length and colored by how firm it is". A search snippet also describes a colour-coded grid of all 30 juz with states strong / weakening / needing attention / not yet tested. — [Rasekh App Store](https://apps.apple.com/us/app/rasekh-quran-hifz-tracker/id6766639262)
- Hifz Hero: a weakest-ayahs ranking, a heatmap of review days, and a 30-juz progression path with percent memorized. — [GitHub hifdh_hero](https://github.com/HibaChamkhi/hifdh_hero)
- Tarteel: "streaks and heatmaps"; highlighted mistake words in the text, tappable to compare what was recited with the correct ayah; and a historical mistakes log. — [Tarteel App Store](https://apps.apple.com/us/app/tarteel-ai-quran-memorization/id1391009396); [Tarteel blog](https://tarteel.ai/blog/introducing-mistake-detection/)
- Quran.com: streaks, milestones, and goal progress. — [Quran.com product update](https://quran.com/product-updates/quran-reading-streaks)
- Hifdh Revision Tracker shows how often each surah, juz, or hizb is revised. — [Google Play](https://play.google.com/store/apps/details?id=com.tazkiyatech.hifdhtracker&hl=en_US)
- Itqān (open-source) is a mushaf reader with mutashabihat highlighting and recall practice. — [GitHub nasirhemed/quran-v2](https://github.com/nasirhemed/quran-v2)

### Inferences
- A useful minimal set for the Android feature:
  1. A juz grid (30 cells), drill-down to a page grid (about 20 per juz), drill-down to the ayah list. Color by `weak_score` with a separate "not memorized" state.
  2. A calendar heatmap from `daily_activity`.
  3. A mushaf or ayah view that tints words by `word_stats.mistakes`, with intensity by count and hue by dominant type.
  4. A "weakest ayat" list sorted by `weak_score`, each item linking to a targeted test session.
- Use per-mushaf page numbers (604-page Madani by default), drawn from the reference `ayah.page`.

### Gaps
- I found no usability studies comparing these visualizations. The choices are based on how widely existing apps use each pattern.
