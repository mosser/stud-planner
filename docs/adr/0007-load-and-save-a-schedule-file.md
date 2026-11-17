# ADR 0007: A schedule file is loaded and saved, never uploaded or downloaded

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Sébastien Mosser

## Context

The kept schedule stays in one browser (ADR 0006). The Organizer needs to move
it to another computer, keep a copy, or hand it to someone. Nothing the system
does crosses a network (ADR 0001), and the words the interface uses must not
say otherwise.

Options considered:

- **An iCalendar file.** Imported by calendar applications, but it cannot
  carry abstract weeks without dates, and reading one back is a large format
  to support.
- **A versioned JSON file** of the schedule, specified in
  `docs/specs/schedule-file.md`. Small, read back exactly, and the same content
  the browser keeps.

## Decision

- The schedule is **saved** as `stud-planner-schedule.json` and **loaded**
  from a file the Organizer chooses, in the format of
  `docs/specs/schedule-file.md`, `version` 1. A change of format is a new
  version, and the system reads every version it has written.
- A file is checked completely before anything is taken, overlaps included
  (ADR 0009); a refused file
  leaves the schedule as it was, and the reason is shown.
- Loading replaces the schedule, once confirmed when it holds a meeting.
- Only `src/io/schedule-file.ts` maps a schedule to and from the file;
  `src/io/save.ts` hands it to the browser.
- "Upload" and "download" never appear under `src/` (except the `download`
  attribute set in `src/io/save.ts` and checked by its test) nor in
  `docs/specs/`. They are kept for
  a real transfer over a network: obtaining a release from GitHub.

## Consequences

**Positive**

- The file is the backup and the way to move a schedule, readable by a person.
- The interface says what happens: nothing leaves the computer.

**Negative / accepted trade-offs**

- No calendar application imports the file.

## Compliance

A change is compliant with this ADR when the schedule file is written and
read only by `src/io/schedule-file.ts`, a file of every version written is
read back by a test, and `scripts/check-adr.sh` finds no "upload" or
"download" where this ADR forbids them.
