# Patient language support

English is the default. `PatientLanguageProvider` creates a separate i18next instance for patient routes and guest/patient authentication screens. The `dentiq-patient-language` localStorage preference survives refreshes. Doctor onboarding and signed-in Doctor/Super Admin experiences use the English fallback context and have no language switcher.

`en.json` and `hi.json` use readable source phrases as centralized keys, plus stable `chat.greeting`, `guidance.general`, and `guidance.emergency` message keys. Add matching entries to both catalogs when adding patient UI. Shared components use `usePatientTranslation`; outside the patient provider it returns English unchanged. User-entered messages, names, IDs, clinic records, reviews and arbitrary database prose remain as supplied; known service and specialization labels are translated for display.

Chat messages retain the exact user input and a separate accumulated concern. Assistant messages keep a translation key, so switching languages updates predefined replies without losing conversation state. `usePatientAssistant` forwards `en` or `hi` through the existing frontend services. The API validates the optional language (default `en`) and normalizes supported Hindi/Hinglish symptom aliases into existing English rule tokens. Recommendation rules, doctor filters, ownership checks and database schemas are retained. This remains a rule-based assistant with no translation model or paid translation service.

Booking keeps date keys, UTC offsets, slot IDs, doctor IDs and fees unchanged. Display formatting uses `en-IN`/`hi-IN` and the availability timezone. Doctor directory responses include optional derived `nextAvailableAt` and `timezone` fields alongside the original `nextAvailable` label.

Run from the repository root:

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd --prefix api run test:patient-language
node app/node_modules/playwright/cli.js install chromium
# With npm.cmd run dev already running:
npm.cmd --prefix app run test:patient-language
```

Backend tests cover bilingual/Hinglish matching, emergency routing, language validation, canonical doctor filters, and original message preservation. Browser checks cover both guest patient journeys through booking confirmation, assistant retranslation, symptom and selected-time preservation, refresh persistence, login validation, registration, phone/tablet/desktop overflow, signed-in patient records/profile, and English Doctor/Super Admin isolation. Browser APIs are mocked: tests create no MongoDB records. Screenshots are saved in ignored `artifacts/patient-language/` when run from the repository root.
