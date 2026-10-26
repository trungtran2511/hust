# QA report, 2.0.0-beta.1

Date of run: 2026-10-26. Browser: Chromium via Playwright (headless). Everything below was actually run unless it is listed under "Not tested".

## Automated results
| Suite | Result |
|---|---|
| Engine tests (`tests/tkb.test.js`) | 42 / 42 passed |
| i18n tests (`tests/i18n.test.js`) | 6 / 6 passed (all used keys exist, Vietnamese complete, placeholders match) |
| Browser checks (Playwright, 390 px) | 34 / 34 passed |
| Console errors during all runs | 0 |
| Horizontal overflow scan: every tab and sub-tab at 320, 375, 390, 430, 768, 1024, 1440 px | none found |

Browser checks covered: XSS strings in profile name, reminder title and note (not executed); planner search; clash detection; PNG, PDF (structure and xref offsets checked), ICS and JSON export; ICS refused without start date; JSON import and a bad JSON file; map building sheet and route; room decoding (D8-1006 gives floor 10) and an unknown code; flashcard and quiz; SOS content, own contact, no automatic GPS; global search; reminder creation; data backup round trip and wipe; bad `.xlsx`; system dark mode and forced light; v1 data containing a password (not kept); offline reload with the service worker; GPS denied; no Vietnamese voice.

Data checks on the real file: 11,011 classes load in about 280 ms; 100 searches under 2.5 s (engine tests).

## Findings fixed during QA
* ICS export wrote `[object Object]` (engine returns `{text, events, skipped}`). Fixed and covered by a test.
* Missing icon (minus) on the map zoom button.
* Planner search box showed the global-search placeholder.
* Checklist titles rendered as bordered buttons.
* Four import error messages were missing translations.

## Not tested (be honest)
* Real phones and tablets (iOS Safari, Android Chrome, Samsung Internet). Only desktop Chromium with phone-sized viewports.
* Screen readers (VoiceOver, TalkBack, NVDA). The markup uses labels, roles, focus rings and 44 px targets, but WCAG 2.2 AA is **not certified**. A contrast check was not run with a tool.
* Lighthouse or other performance audits.
* Real Vietnamese text-to-speech quality (the test device had no Vietnamese voice).
* GPS accuracy (never claimed).
* Large `.xlsx` files from the real portal other than the one provided.
* PWA install prompt on real devices.
* Chinese, Korean and Japanese wording reviewed by native speakers.

## Known limits
* Map is a diagram. Gate and building positions are approximate. C1 room numbers conflict between sources (106 to 108 versus C1-201): both are shown, neither is asserted.
* The International Education / Exchange office naming (DPE versus ERO) differs between sources and is flagged on the office card.
* Reminders only fire while the app is open.
* The semester week-1 date for term 20261 is not confirmed by an official source, so the app asks the user.
* The GPA scale is a guess and is labelled unverified.
* ZH, KO, JA are about 49% translated.
