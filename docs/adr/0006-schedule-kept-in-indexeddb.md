# ADR 0006: The schedule is kept in the browser's IndexedDB, best effort

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Sébastien Mosser

## Context

A schedule is built over several sittings and consulted for months. Closing
the page must not lose it. The system has no server (ADR 0001), so whatever
keeps the schedule is in the browser, where storage may be refused or
cleared, and where the origin of a file opened from disk differs between
browsers.

Options considered:

- **`localStorage`.** Synchronous and small, but enough for a schedule.
  Kept out so that one storage API, guarded in one place, serves the system.
- **No storage, the schedule file only.** Nothing hidden in the browser, but
  forgetting to save loses the work.
- **IndexedDB.** Asynchronous, generous, and the store the sibling projects
  use.

## Decision

- **The schedule is kept in IndexedDB**, in a database named `stud-planner`,
  as the content of its schedule file (`docs/specs/schedule-file.md`): one
  mapping serves the store and the file.
- **Every change is kept at once.** There is no action to keep.
- **At opening**, the kept schedule comes back; without one, a new schedule
  starts with no meeting and the first ISO week of the current year as its
  reference week.
- **Best effort.** Every access is guarded: when IndexedDB is unavailable,
  refused or fails, the system works without it and the screen says that
  closing the page will lose the schedule. A kept schedule the system cannot
  read is set aside, not deleted, and the screen says so.
- `src/io/schedule-store.ts` is the only module that touches IndexedDB.
  Nothing else is stored in the browser: no `localStorage`, `sessionStorage`,
  cookie or Cache API.

## Consequences

**Positive**

- Closing the page loses nothing in the usual case, and titles and notes stay
  on the Organizer's computer.

**Negative / accepted trade-offs**

- The schedule lives in one browser on one computer; the schedule file
  (ADR 0007) is how it moves.
- Clearing the browser's site data deletes it.

## Compliance

A change is compliant with this ADR when only `src/io/schedule-store.ts`
touches IndexedDB, nothing uses another browser storage, and the system
works with IndexedDB unavailable, which a test shows.
