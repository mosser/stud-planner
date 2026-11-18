# ADR 0007: A schedule file is downloaded and uploaded, and never leaves the computer

- **Status:** Accepted
- **Date:** 2026-11-18
- **Deciders:** Sébastien Mosser

## Context

The kept schedule stays in one browser (ADR 0006). The Organizer needs to move
it to another computer, keep a copy, or hand it to someone. Nothing the system
does crosses a network (ADR 0001). The words of the interface must say what
the browser shows the Organizer, who knows a file going to a page as an upload
and one coming from it as a download.

Options considered for the file:

- **An iCalendar file.** Imported by calendar applications, but it cannot
  carry abstract weeks without dates, and reading one back is a large format
  to support.
- **A versioned JSON file** of the schedule, specified in
  `docs/specs/schedule-file.md`. Small, read back exactly, and the same content
  the browser keeps.

Options considered for the words:

- **Save and load**, as the sibling applications say. Nothing suggests a
  network, but the browser presents the file written as a download, and
  *Save* and *Load* do not say which way the file goes.
- **Download and upload.** The words the Organizer knows for a file leaving a
  page and one given to it. A file uploaded is read in the browser, and sent
  nowhere: the interface does not say otherwise, the page being served from
  GitHub Pages or opened from disk alike.

## Decision

- The schedule is **downloaded** as `stud-planner-schedule.json` and
  **uploaded** from a file the Organizer chooses, in the format of
  `docs/specs/schedule-file.md`, `version` 6. A change of format is a new
  version, and the system reads every version it has written: version 5,
  its meetings all confirmed; version 4,
  its one-to-one meetings named after their student; version 3, as one
  without categories and days; version 2, as one without participants;
  version 1, which writes the week of a bi-weekly booking as a parity, odd or
  even, as version 2.
- A file uploaded is read in the browser, with `File.text()`; nothing is sent
  over a network.
- A file is checked completely before anything is taken, overlaps included
  (ADR 0009); a refused file leaves the schedule as it was, and the reason is
  shown.
- Uploading replaces the schedule, once confirmed when it holds a booking.
- Only `src/io/schedule-file.ts` maps a schedule to and from the file;
  `src/io/download.ts` hands it to the browser.

## Consequences

**Positive**

- The file is the backup and the way to move a schedule, readable by a person.
- The buttons say which way the file goes, in the Organizer's words.

**Negative / accepted trade-offs**

- No calendar application imports the file.
- *Upload* may suggest a server; the privacy of the schedule rests on
  ADR 0001, not on the word.
- The words differ from the sibling applications', which save and load.

## Compliance

A change is compliant with this ADR when the schedule file is written and
read only by `src/io/schedule-file.ts`, a file of every version written is
read back by a test, and nothing under `src/` sends a file anywhere (ADR 0001).
