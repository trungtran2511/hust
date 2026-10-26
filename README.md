# HUST International Survival Guide 2.0 (Beta)

An **unofficial** student-made guide for international students at Hanoi University of Science and Technology (HUST). It is not published, endorsed or approved by HUST. Always confirm decisions with the university.

## What it is
A static web app (no server, no account, no analytics) that also installs as a PWA and works offline.

| Tab | Contents |
|---|---|
| Home | Next class with room and Navigate, today's classes, reminders, hand-copied notices, quick tools, phrase of the day, tip, First 30 days progress, Emergency button |
| Study | Course planner (11,011 classes from TKB 20261), timetable (grid/list, week picker), reminders/exams/assignments/notes, credits and GPA tracker, portal guide |
| Campus | Schematic map with search, legend, zoom, rough route, Maps links; room-code decoder; library guide; places |
| Life | Daily-life guide (7 topics), Vietnamese phrasebook (50 phrases, audio, flashcards, quiz), forms of address, official channels |
| Support | Who can help (problem to office), FAQ, First 30 days checklist, Handbook (15 topics), conduct, self-check |
| Profile | Language, theme, role, saved items, data export/import/delete, About, feedback |
| Everywhere | Search (header) and Emergency/SOS (header) |

## Run it
Serve the folder over http (the data files are fetched, so `file://` will not work):

    cd hust-guide && python3 -m http.server 8000     # then open http://localhost:8000

`dist/hust-guide-single.html` is the same app in one file (data inlined). It opens by double-click and is what the preview artifact uses. Installing as a PWA and offline mode need the multi-file version served over https or localhost.

## Honesty rules the app follows
* **No login.** No SIS password, no student-ID parsing. Guest and a local profile only. The v1 "verify SIS account" screen and the status guessed from the last digit of the student ID are gone.
* Every content item carries a trust label: *Official*, *Reference*, *Sample*, *Unverified* or *Your data*, plus a source and the date it was checked.
* The campus map is a **diagram**, labelled "Schematic". Routes are rough paths between buildings, not measured.
* Week 1 of the semester is **never guessed**. The user enters it. Without it there is no week highlight and no calendar export.
* Emergency numbers are only the national 113 / 114 / 115. No campus emergency number is shown because none was verified. Location is read only when the user presses the button, and is never sent anywhere.
* The planner says it is not official registration.

## Data
`data/*.json` is all editable content. `data/tkb20261.json` was converted from `TKB20261-FULL.xlsx` (11,011 classes). Users can import a newer `.xlsx` in the planner; it is validated (required columns, bad times, unknown weeks) and stored in IndexedDB.

Four sessions in the source file have an end time at or before the start time (classes 768983 and 772634). They are shown, flagged, and ignored for clashes, the grid and calendar export.

## Storage
`localStorage` key `hsg2`, schema version 2, with migration from the 1.x `hisg_*` keys. The 1.x email, student ID and password fields are **not** carried over. The imported timetable lives in IndexedDB.

## Languages
English and Vietnamese are complete (548 keys). Chinese, Korean and Japanese cover about 49% (navigation, onboarding, Home, SOS, map, rooms, common buttons); the remaining strings fall back to English. The phrasebook, checklist, assessment and guide JSON carry 5-language text where noted. Official procedures are not machine-translated.

## Build and test
    node tests/tkb.test.js                      # 42 engine tests
    node --test tests/i18n.test.js              # key coverage, placeholders
    python3 tools/build.py                      # writes dist/hust-guide-single.html

## Files
`index.html`, `css/app.css`, `js/*.js` (core, i18n-*, tkb engine, data, ui, onboarding, home, tasks, academic, campus, life, support, me, search, exports, app), `data/*.json`, `sw.js`, `manifest.webmanifest`, `icons/`, `tests/`, `tools/`, `docs/`.

## Third party
SheetJS Community Edition 0.18.5 (Apache-2.0), loaded only when importing .xlsx. See `docs/LICENSE-xlsx.txt`.
