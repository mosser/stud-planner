# Schedule file

The schedule as a file: JSON, UTF-8, one object. The browser keeps the same
content (ADR 0006), and the shared schedules of `schedules/` are such files
(ADR 0012). The system writes version 2, and reads versions 1 and 2.

## The schedule

| Field | Value |
|---|---|
| `format` | `"stud-planner/schedule"`. |
| `version` | `2`; `1` is read as the section Version 1 says. A file of another version is refused. |
| `meetings` | The meetings, an array, possibly empty, in no particular order. |
| `timeBlocks` | The time blocks, an array, possibly empty, in no particular order. A file without it holds no time block. |

## A meeting

| Field | Value |
|---|---|
| `title` | Its title. |
| `cadence` | `"weekly"` or `"bi-weekly"`. |
| `week` | `"A"` or `"B"`; for a bi-weekly meeting only. |
| `weekday` | `"monday"` to `"friday"`. |
| `start` | `HH:MM`, a quarter of the day. |
| `duration` | In minutes, a whole number of quarters. |
| `note` | Its note; absent when it has none. |

## A time block

| Field | Value |
|---|---|
| `title` | Its title; absent when it has none. |
| `cadence`, `week`, `weekday`, `start`, `duration` | As for a meeting. |

## Version 1

A file of version 1 is read as one of version 2, but for the week of a
bi-weekly booking, written `parity`: `"odd"` for week A, `"even"` for week B.
It has no `week`. Saved again, it is written as version 2.

## Refusal

A file is refused, with the first reason found, when it is not JSON, has a
field missing, a field the tables do not list for its version, a value the
tables or the domain model do not allow, or two bookings that overlap: two
meetings, a meeting in a time block, or two time blocks. Nothing of a refused
file is taken.
