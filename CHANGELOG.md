# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-05-09

### Added

- **Penalty points** — Parents can deduct points from children with a reason, symmetric to the "beg" flow. Available on child detail page (`/children/[id]`). Push notification sent to child.
- **Yesterday's missed tasks** — Overdue tasks from yesterday are shown once as "Missed Yesterday" in both kid and parent task views, using family timezone. Older overdue tasks no longer clutter the list.
- **Complete future tasks early** — Upcoming tasks (future due date) can now be checked off before their due date.

### Changed

- `.gitignore` — Added `.idea/`, `.superpowers/`, `.ww-w-ai/`, `backups/`, `images/`.

## [1.0.0] - 2026-04-14

### Added

- Initial release — family task gamification with points, levels, badges, characters, beg flow, rewards, i18n (ko/en/ja).
