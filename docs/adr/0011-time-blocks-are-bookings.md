# ADR 0011: Time blocks are bookings, like meetings

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Sébastien Mosser

## Context

The Organizer is not available for meetings with students at every time of
the week: they teach, sit on committees, keep time for research. These times
recur like meetings, weekly or in one week, and no meeting may be booked in
them. They are planned on the same grids, with the same gestures, and must
keep every rule a meeting keeps: within the day, on a quarter, never in a
slot already taken.

Options considered:

- **A meeting with a flag** saying it is not one. One class, but a time block
  would carry a note and a title it does not need, every rule about meetings
  would test the flag, and the glossary would call two things a meeting.
- **A separate class with its own rules.** The two kinds stay apart, but the
  day, the cadence, the moves and the overlap are written twice, and an
  overlap between a meeting and a time block belongs to neither.
- **Two kinds of one booking.** What both have, the timing and the overlap,
  is written once; what differs, the title and the note, is each kind's.

## Decision

- A **booking** (`src/domain/booking.ts`, abstract) has a cadence, a weekday,
  a start and a duration, fits within the day, and decides when two bookings
  overlap. `Meeting` and `TimeBlock` extend it: a meeting has a title and
  may have a note; a time block may have a title, and has no note.
- `Schedule` holds its meetings and its time blocks apart, and refuses an
  overlap between any two of its bookings (ADR 0009). The interface, the
  dialog and the gestures work on bookings; a meeting never takes the place
  of a time block, nor the reverse.
- The schedule file holds the time blocks in a list of their own,
  `timeBlocks`, which a file may leave out (`docs/specs/schedule-file.md`).
- On a week's tab, a switch says whether a press adds a meeting or a time
  block; on the overview, a press adds a time block held in both weeks
  (`docs/specs/plan-the-meetings.md`).

## Consequences

**Positive**

- Every rule a meeting keeps, a time block keeps, from the same code and the
  same tests.
- A meeting can never be booked in time the Organizer has blocked.

**Negative / accepted trade-offs**

- A time block is not a place for meetings: time set aside *for* students,
  such as office hours, cannot be planned with it.
- Two time blocks cannot overlap, though both only say the Organizer is not
  available.

## Compliance

A change is compliant with this ADR when the timing and the overlap of a
booking are written only in `Booking`, the schedule refuses an overlap
between a meeting and a time block, which a test shows, and a schedule file
without `timeBlocks` is read.
