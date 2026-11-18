# ADR 0015: A meeting may be tentative, and still takes its slots

- **Status:** Accepted
- **Date:** 2026-11-18
- **Deciders:** Sébastien Mosser

## Context

Some meetings are planned before they are entirely confirmed: a student not
yet enrolled, a co-supervisor who has not answered. The Organizer wants to
place them, and to tell them at a glance from the meetings that are settled.

Options considered:

- **A category for them.** A category says what a meeting is about
  (ADR 0014); a tentative PhD meeting is still a PhD meeting, and would lose
  its category.
- **A tentative meeting that other bookings may overlap.** Two candidates
  could share a slot until one is chosen, but a slot is booked once
  (ADR 0009), and an overlap would be drawn and checked everywhere as a new
  case.
- **A mark on the meeting**, whatever its category, the meeting taking its
  slots as any other.

## Decision

- `Meeting.isTentative` says whether the Organizer has marked the meeting
  tentative; a meeting is confirmed otherwise, and when added. A time block
  is neither.
- A tentative meeting takes its slots as a confirmed one: the overlap rules
  of ADR 0009 hold unchanged.
- The dialog of a meeting holds a *Tentative* box. The grid hatches a
  tentative meeting with the surface and dashes its border, with tokens of
  the palette (ADR 0010); its description says *tentative*.
- The schedule file is version 6: `tentative` on a meeting, absent when it is
  confirmed (`docs/specs/schedule-file.md`); a file of version 5 or earlier
  is read with every meeting confirmed.

## Consequences

**Positive**

- A meeting not yet settled is placed where it will go, and reads as such.
- Nothing about overlaps, participants or categories changes.

**Negative / accepted trade-offs**

- Two candidate meetings cannot hold the same slot: one is placed, the other
  noted elsewhere.
- A file downloaded now is refused by an earlier release of the system.

## Compliance

A change is compliant with this ADR when a tentative meeting is refused an
overlap as any meeting is, the mark survives a move, a resize, a rename of a
participant, and a download read back, and a time block cannot be tentative.
