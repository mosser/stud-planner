# ADR 0008: Template weeks, odd and even by strict alternation

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Sébastien Mosser

## Context

The Organizer wants to see how odd weeks, even weeks and monthly meetings
fill up, and to place meetings on that view directly. Recurring meetings have
no date; what matters is the pattern they make.

Options considered for the view:

- **Dated weeks**: the real calendar, week after week, each showing the
  meetings that fall in it. Monthly meetings land on their day, but the
  pattern is spread over many screens, and moving an occurrence asks whether
  the move is for that week or for all.
- **Template weeks**: an odd week, an even week and a monthly week, without
  dates. The whole pattern on one screen, and a move is always a move of the
  meeting.

Options considered for odd and even:

- **The parity of the ISO week number.** As on most calendars, but a year
  with a week 53 gives two odd weeks in a row, and a bi-weekly meeting then
  waits seven or twenty-one days.
- **Strict alternation from a reference week.** Fourteen days between two
  meetings, always; odd and even may differ from the ISO week number.

## Decision

- The schedule is shown on **three template weeks**: odd, even and monthly
  (`docs/specs/plan-the-meetings.md`). There is no dated view and no
  occurrence of a meeting: a meeting is changed as a whole.
- **Weeks alternate strictly** from the reference week, which is odd. The
  reference week is the only date of a schedule; it says whether this week is
  odd or even, and the Organizer changes it by saying so.
- A monthly meeting falls on the nth weekday of a month, first to fourth or
  last. Whether it falls in an odd or an even week changes from month to
  month, so its clashes with a bi-weekly meeting are said to happen "some
  months".

## Consequences

**Positive**

- The whole schedule fits on one screen, and every gesture changes a meeting
  everywhere it recurs.
- A bi-weekly meeting keeps its rhythm across the turn of a year.

**Negative / accepted trade-offs**

- No single date can be cancelled or moved: the system plans patterns, the
  Organizer's calendar holds exceptions.
- The odd week of the system may be the even week of a calendar that counts
  ISO weeks; the screen states this week's parity to avoid the confusion.

## Compliance

A change is compliant with this ADR when the parity of a week is computed only
from the reference week, and no meeting or schedule holds a date other than
it.
