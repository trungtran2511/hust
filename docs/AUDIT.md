# Audit of v1.5 (before the rewrite)

| Function / area | Finding | Action |
|---|---|---|
| renderWelcome, renderLogin | Asked for email, student ID and password | Replaced by onboarding with Guest mode |
| renderSync | Animated "Verifying SIS account", "Loading student record" with no real check | Removed. It implied a connection that did not exist |
| detectStatus(id) | Chose "agreement / non-agreement / exchange" from the last digit of the ID | Removed. It produced invented personal facts |
| renderHome | Showed status-based notices as if personal | Rebuilt as a dashboard with labelled data |
| renderPlanner | Search and clash check worked | Logic kept and rewritten into a DOM-free tested engine |
| Week parsing | Worked | Kept, tested |
| route / map | Worked as routing on a drawing, looked like real directions | Kept, labelled schematic, rough path only |
| useGps | Implied precision | GPS is only read on tap in SOS; accuracy shown as reported by device |
| Speech | Spoke with whatever voice existed | Detects missing Vietnamese voice and says so |
| Semester start date | Assumed | Never assumed. User enters it |
| pwa | Basic cache | Versioned cache, offline tested |
| Storage | `hisg_*` keys, included login fields | Versioned `hsg2` with migration that drops credentials |
