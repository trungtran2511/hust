# Changelog

## 2.0.0-beta.1

### Feature table
| Area | v1.x | 2.0 | Status |
|---|---|---|---|
| Sign-in | Email, student ID, password, fake "verifying SIS" | Removed. Guest or local profile | Done |
| Student status | Guessed from last digit of the ID | Removed. User picks a role | Done |
| Onboarding | Login flow | Language, 4 value points, role, optional details, Guest, Skip all | Done |
| Home | Mock personal data | Next class + Navigate, today, reminders, notices (hand-copied, labelled), quick tools, phrase, tip, SOS | Done |
| Map | Map with routing, looked precise | Same routing kept, labelled schematic, search, legend, zoom, building sheet, Maps links | Beta |
| Rooms | None | Decoder (D3-201, D8-1006, C10-305), saved rooms, rooms from timetable | Done |
| Planner | Course search and clash check | Rebuilt engine: weeks, groups (lecture + tutorial), status, seats, clash by day/time/week | Done |
| Timetable | Basic grid | Grid + list, week picker, start-date entry, today highlight, PNG/PDF/ICS/JSON, JSON import | Done |
| Excel import | Not available | Validated .xlsx import with diff against saved classes | Beta |
| Reminders | None | Reminders, exams, assignments, study sessions, notes (in-app) | Done |
| Credits / GPA | None | Credit overview, GPA tracker with editable scale, flagged as unverified | Beta |
| Library | None | Verified facts only, questions to ask, office card | Beta |
| Phrasebook | Small list | 50 phrases, 12 situations, audio, favourites, flashcards, quiz, progress | Done |
| Address forms | None | 4 layers, 6 situations | Beta |
| Daily life | None | 7 topics, no prices or routes | Beta |
| Support | Static pages | Problem-to-office, FAQ, checklist (23 tasks), handbook (15 topics), conduct, self-check | Beta |
| Emergency | None | 113/114/115, emergency phrases, own contacts, optional location display | Done |
| Search | None | Global search over courses, places, offices, handbook, phrases, help, reminders | Done |
| Profile and data | Local keys | Language, theme (light/dark/system), saved items, export/import/delete | Done |
| i18n | English | EN, VI full; ZH, KO, JA about 49% | Beta |
| PWA | Basic | Manifest, service worker, offline | Done |
| Security | Mixed | Escaped templating everywhere, http/https-only links, import size/type checks, no secrets | Done |

### Removed
* Fake SIS login and sync animation.
* Status inference from student ID digits.
* All sample personal data on Home.

### Known limits
See `docs/QA-REPORT.md`.
