# ADR 0007: A schedule file is downloaded and loaded, never uploaded

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Sébastien Mosser

## Context

The kept schedule stays in one browser (ADR 0006). The Organizer needs to move
it to another computer, keep a copy, or hand it to someone. Nothing the system
does crosses a network (ADR 0001), and the words the interface uses must not
say otherwise; but they must also say what the browser shows the Organizer.

Options considered for the file:

- **An iCalendar file.** Imported by calendar applications, but it cannot
  carry abstract weeks without dates, and reading one back is a large format
  to support.
- **A versioned JSON file** of the schedule, specified in
  `docs/specs/schedule-file.md`. Small, read back exactly, and the same content
  the browser keeps.

Options considered for the words:

- **Save and load**, as the sibling applications say. Nothing suggests a
  network, but the browser presents the file written as a download, in its
  list of downloads and its Downloads folder: *Save* does not say where the
  file went.
- **Download and load.** *Download* is what the browser shows, and the page
  is itself downloaded from GitHub Pages. *Upload* would say the schedule
  leaves the computer, which it never does: a file loaded is read in the
  browser.

## Decision

- The schedule is **downloaded** as `stud-planner-schedule.json` and
  **loaded** from a file the Organizer chooses, in the format of
  `docs/specs/schedule-file.md`, `version` 2. A change of format is a new
  version, and the system reads every version it has written: version 1,
  which writes the week of a bi-weekly booking as a parity, odd or even, is
  read as version 2.
- A file is checked completely before anything is taken, overlaps included
  (ADR 0009); a refused file leaves the schedule as it was, and the reason is
  shown.
- Loading replaces the schedule, once confirmed when it holds a booking.
- Only `src/io/schedule-file.ts` maps a schedule to and from the file;
  `src/io/download.ts` hands it to the browser.
- "Upload" never appears under `src/` nor in `docs/specs/`.

## Consequences

**Positive**

- The file is the backup and the way to move a schedule, readable by a person.
- The button says what the browser then shows: a download.

**Negative / accepted trade-offs**

- No calendar application imports the file.
- The words differ from the sibling applications', which save.

## Compliance

A change is compliant with this ADR when the schedule file is written and
read only by `src/io/schedule-file.ts`, a file of every version written is
read back by a test, and `scripts/check-adr.sh` finds no "upload" under
`src/` or in `docs/specs/`.
