# ADR 0012: Shared schedules are built into the page

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Sébastien Mosser

## Context

The Organizer makes a schedule they like and wants to share it: the people
they plan with open the page and see that schedule, without being handed a
file. The page is one file with no server and no network (ADR 0001), served
from GitHub Pages and opened from disk alike (ADR 0002). Those who open a
shared schedule must not change it by accident.

Options considered:

- **Files fetched from the Pages site** when the page opens. A schedule is
  shared as soon as Pages is deployed, but the page then needs the network,
  no longer works opened from disk, and ADR 0001 gives way.
- **A link that carries the schedule** in its address. Nothing to deploy, but
  long links, and nothing to list.
- **Files of the repository built into the page.** Every shared schedule is in
  the one file, read like any schedule file; a new one reaches its readers
  with the next release.

## Decision

- A shared schedule is a schedule file (`docs/specs/schedule-file.md`) of the
  folder `schedules/`, named after its file. `src/io/shared-schedules.ts`, and
  only it, takes them, with `import.meta.glob(..., { eager: true })`, so that
  the build inlines them: nothing is fetched.
- The build refuses a file of `schedules/` the system does not read
  (`checkSharedSchedules()` in `vite.config.ts`, through
  `src/io/shared-schedule.ts`), rather than writing a page that would fail as
  it opens.
- The masthead lists them; choosing one replaces the schedule, once confirmed,
  and locks it (`docs/specs/plan-the-meetings.md`). The lock is kept with the
  schedule (ADR 0006).

## Consequences

**Positive**

- Sharing a schedule is a commit and a release; reading one needs nothing but
  the page, online or from disk.
- A shared schedule is read and checked like any schedule file.

**Negative / accepted trade-offs**

- A schedule shared is public with the page, as everything in the repository:
  titles and notes must be fit to publish.
- Every shared schedule weighs on the page, and a new one waits for a release.

## Compliance

A change is compliant with this ADR when only `src/io/shared-schedules.ts`
uses `import.meta.glob`, on `schedules/*.json` and eager, `vite.config.ts`
keeps `checkSharedSchedules()`, and nothing is fetched.
