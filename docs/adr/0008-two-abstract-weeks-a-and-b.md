# ADR 0008: Two abstract weeks, A and B, without dates

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Sébastien Mosser

## Context

The Organizer plans a pattern of recurring meetings, and wants to see how the
two weeks that alternate fill up, and to place meetings on that view
directly. Which week of the calendar is which is theirs to know; what they
ask of the system is the pattern.

Options considered:

- **Dated weeks**: the real calendar, week after week, each showing the
  meetings that fall in it. The pattern is spread over many screens, a move
  asks whether it is for one week or for all, and the two weeks must be tied
  to the calendar, by the parity of the ISO week number (two odd weeks in a
  row after a week 53) or from a reference week.
- **Two abstract weeks** and a monthly cadence placed on one of them, or on a
  cycle of four weeks. A monthly meeting holds its slot in every such week of
  the template while it meets in one of them, and a cycle of four weeks
  doubles the grids for a few meetings.
- **Two abstract weeks, weekly and bi-weekly bookings only**, shown one at a
  time or merged in an overview.

For their names, **odd and even** read as the parity of a calendar week,
which the system does not know, and which a week 53 breaks. **Week A and
week B** name two weeks that alternate, and nothing more.

## Decision

- The schedule is planned on **two abstract weeks, week A and week B**,
  which alternate. It holds no date, and the system never reads today's
  date.
- A booking is **weekly** (held in both weeks) or **bi-weekly** (held in
  week A or in week B). There is no monthly cadence.
- The screen shows **three tabs**, one at a time: the **overview**, which
  merges the two weeks and is the tab shown first, then week A and week B
  (`docs/specs/plan-the-meetings.md`). Only the time a booking of week A and
  one of week B share is cut, along the diagonal of that time, week A upper
  left, week B lower right; the rest of each booking is whole, so that the
  overview shows at once what alternates and what does not. The time shared
  is cut as one, not quarter by quarter: a quarter is a row too flat for its
  halves to be read.
- A booking added from a week's tab is held in that week: weekly, or
  bi-weekly in it. A booking added from the overview is held in both weeks:
  it is weekly.
- There is no occurrence of a booking: it is changed as a whole, in every
  week it is held.

## Consequences

**Positive**

- The whole pattern is on three grids, and every gesture changes a booking
  everywhere it recurs.
- Nothing in the system can be wrong about the calendar, since it does not
  know it.

**Negative / accepted trade-offs**

- A meeting held once a month cannot be planned: the Organizer books it as
  bi-weekly, or keeps it elsewhere.
- No single date can be cancelled or moved: the system plans patterns, the
  Organizer's calendar holds exceptions.

## Compliance

A change is compliant with this ADR when no booking or schedule holds a date,
`src/` never reads today's date, and a cadence is weekly, or bi-weekly in
week A or in week B.
