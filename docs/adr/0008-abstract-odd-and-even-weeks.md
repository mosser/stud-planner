# ADR 0008: Two abstract weeks, odd and even, without dates

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Sébastien Mosser

## Context

The Organizer plans a pattern of recurring meetings, and wants to see how the
odd weeks and the even weeks fill up, and to place meetings on that view
directly. Which week of the calendar is odd is theirs to know; what they ask
of the system is the pattern.

Options considered:

- **Dated weeks**: the real calendar, week after week, each showing the
  meetings that fall in it. The pattern is spread over many screens, a move
  asks whether it is for one week or for all, and odd and even must be tied
  to the calendar, by the ISO week number (two odd weeks in a row after a
  week 53) or from a reference week.
- **Two abstract weeks**, odd and even, and a monthly cadence placed on one
  of them, or on a cycle of four weeks. A monthly meeting holds its slot in
  every odd (or even) week of the template while it meets in one of them, and
  a cycle of four weeks doubles the grids for a few meetings.
- **Two abstract weeks, odd and even, weekly and bi-weekly meetings only**,
  shown one at a time or merged in an overview.

## Decision

- The schedule is planned on **two abstract weeks, the odd and the even**.
  It holds no date, and the system never reads today's date.
- A meeting is **weekly** (held in both weeks) or **bi-weekly** (held in its
  parity's week). There is no monthly cadence.
- The screen shows **three tabs**, one at a time: the **overview**, which
  merges the two weeks and is the tab shown first, then the odd week and the
  even week (`docs/specs/plan-the-meetings.md`).
  Only the time an odd and an even meeting share is cut, along the diagonal
  of that time, in an odd half and an even half; the rest of each meeting is
  whole, so that the overview shows at once what alternates and what does
  not.
  The time shared is cut as one, not quarter by quarter: a quarter is a row
  too flat for its halves to be read.
- A booking added from a week's tab is held in that week: weekly, or
  bi-weekly in it. A booking added from the overview is held in both weeks:
  it is weekly.
- There is no occurrence of a meeting: a meeting is changed as a whole, in
  every week it is held.

## Consequences

**Positive**

- The whole pattern is on three grids, and every gesture changes a meeting
  everywhere it recurs.
- Nothing in the system can be wrong about the calendar, since it does not
  know it.

**Negative / accepted trade-offs**

- A meeting held once a month cannot be planned: the Organizer books it as
  bi-weekly, or keeps it elsewhere.
- No single date can be cancelled or moved: the system plans patterns, the
  Organizer's calendar holds exceptions.

## Compliance

A change is compliant with this ADR when no meeting or schedule holds a date,
`src/` never reads today's date, and a cadence is weekly or bi-weekly.
