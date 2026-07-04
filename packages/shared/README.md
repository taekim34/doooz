# @dooooz/shared

Framework-agnostic logic shared by `apps/web` (Next.js) and `apps/mobile` (Expo).
Zero React / DOM / Node-only deps — safe for React Native.

Modules: `schemas/*`, `level`, `datetime/*`, `streak`, `invariants`, `i18n`, `characters/emoji-map`.

**Single source of truth.** `level.ts` still must stay in sync with the SQL
`calculate_level()` function (see repo CLAUDE.md "Level sync"). There is now ONE
TypeScript copy (here), not one per app.

Old `src/lib/*` and `src/schemas/*` paths are thin re-export shims for the web app.
New code (esp. mobile) should import `@dooooz/shared/<module>` directly.

## Note for mobile (Expo)

`i18n/index.ts` reads `process.env.NEXT_PUBLIC_DEFAULT_LOCALE` — a Next.js-injected
env var. The web keeps working as-is; the mobile app must supply the default locale
via its own mechanism (e.g. `EXPO_PUBLIC_DEFAULT_LOCALE`) when it consumes this module.
Only web-agnostic modules moved here; React/Next-only i18n helpers (`useT`, `context`,
`auth-locale`) intentionally stayed in `apps/web`.
