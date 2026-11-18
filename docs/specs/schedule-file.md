# Schedule file

The schedule as a file: JSON, UTF-8, one object. The browser keeps the same
content (ADR 0006). The system writes version 6, and reads versions 1 to 6.

## The schedule

| Field | Value |
|---|---|
| `format` | `"stud-planner/schedule"`. |
| `version` | `6`; `1` to `5` are read as their sections say. A file of another version is refused. |
| `meetings` | The meetings, an array, possibly empty, in no particular order. |
| `timeBlocks` | The time blocks, an array, possibly empty, in no particular order. A file without it holds no time block. |
| `participants` | The participants, by name, an array of texts, possibly empty, no two names alike whatever their case. A file without it holds no participant. |
| `days` | The days of the weeks that say where the Organizer is, an array, possibly empty: see *A day*. A file without it says nothing of any day. |

## A meeting

| Field | Value |
|---|---|
| `title` | Its title; absent for a one-to-one meeting. |
| `student` | The name of its student, a participant of the schedule; for a one-to-one meeting only. |
| `cadence` | `"weekly"` or `"bi-weekly"`. |
| `week` | `"A"` or `"B"`; for a bi-weekly meeting only. |
| `weekday` | `"monday"` to `"friday"`. |
| `start` | `HH:MM`, a quarter of the day. |
| `duration` | In minutes, a whole number of quarters. |
| `note` | Its note; absent when it has none. |
| `participants` | Its participants, by name, each a participant of the schedule, once; absent when it has none. |
| `category` | The name of its category, one of `config/categories.json`; absent when it has none. |
| `tentative` | `true` for a tentative meeting; absent, or `false`, for a confirmed one. |

## A time block

| Field | Value |
|---|---|
| `title` | Its title; absent when it has none. |
| `cadence`, `week`, `weekday`, `start`, `duration` | As for a meeting. |

## A day

| Field | Value |
|---|---|
| `week` | `"A"` or `"B"`. |
| `weekday` | `"monday"` to `"friday"`. |
| `presence` | `"on-campus"` or `"remote"`. |

No two days have the same week and weekday.

## Version 5

A file of version 5 has no `tentative`: its meetings are confirmed.

## Version 4

A file of version 4 is read as one of version 5, but has no `student`. A
meeting of it of a one-to-one category has a title instead: it is read with
the participant of that name as its student, made a participant of the
schedule when none has the name, and out of its other participants.

## Version 3

A file of version 3 is read as one of version 4 without categories and days:
it has no `category` and no `days`.

## Version 2

A file of version 2 is read as one of version 3 without participants: it has
no `participants`, neither in the schedule nor in a meeting.

## Version 1

A file of version 1 is read as one of version 2, but for the week of a
bi-weekly booking, written `parity`: `"odd"` for week A, `"even"` for week B.
It has no `week`.

Downloaded again, a file of an earlier version is written as version 6.

## Refusal

A file is refused, with the first reason found, when it is not JSON, has a
field missing, a field the tables do not list for its version, a value the
tables or the domain model do not allow, a meeting naming someone who is
not a participant, or two bookings that overlap: two
meetings, a meeting in a time block, or two time blocks. Nothing of a refused
file is taken.
