# ADR 0009: A slot is booked once

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Sébastien Mosser

## Context

The schedule is what the Organizer commits to. Two bookings in the same slot
of the same week mean one of them will not take place as planned.

Options considered:

- **Allow overlaps, and flag them.** The Organizer may sketch, but a schedule
  with a flag is a schedule that does not hold.
- **Refuse an overlap**, whatever would make it.

## Decision

- **No two bookings of a schedule overlap**: no two meetings, no meeting in a
  time block, no two time blocks take the same slot in the same week
  (`docs/specs/domain-model.md`). It is an invariant of
  `Schedule`, whose constructor throws on a broken one, so that no screen,
  store or file can hold an overlap.
- Every way of changing a schedule asks first: adding, moving, resizing,
  changing a cadence or a parity, and loading a file. A drag shows a refused
  place as refused and, dropped, changes nothing; the screen and the dialog
  name the booking overlapped; a file is refused whole.
- One booking ending as another starts is not an overlap.

## Consequences

**Positive**

- The schedule always holds; there is nothing to resolve later.

**Negative / accepted trade-offs**

- Swapping two bookings takes three gestures, through a free slot.
- Two time blocks cannot overlap either, though both only say the Organizer
  is not available: one rule, for every booking, keeps the overview readable.

## Compliance

A change is compliant with this ADR when `Schedule` cannot be built with two
bookings that overlap, which a test shows for each cadence and parity and for
meetings and time blocks, and
every change of the schedule goes through it.
