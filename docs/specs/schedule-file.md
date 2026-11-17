# Schedule file

The schedule as a file: JSON, UTF-8, one object. The browser keeps the same
content (ADR 0006).

## The schedule

| Field | Value |
|---|---|
| `format` | `"stud-planner/schedule"`. |
| `version` | `1`. A file of another version is refused. |
| `meetings` | The meetings, an array, possibly empty, in no particular order. |
| `timeBlocks` | The time blocks, an array, possibly empty, in no particular order. A file without it holds no time block. |

## A meeting

| Field | Value |
|---|---|
| `title` | Its title. |
| `cadence` | `"weekly"` or `"bi-weekly"`. |
| `parity` | `"odd"` or `"even"`; for a bi-weekly meeting only. |
| `weekday` | `"monday"` to `"friday"`. |
| `start` | `HH:MM`, a quarter of the day. |
| `duration` | In minutes, a whole number of quarters. |
| `note` | Its note; absent when it has none. |

## A time block

| Field | Value |
|---|---|
| `title` | Its title; absent when it has none. |
| `cadence`, `parity`, `weekday`, `start`, `duration` | As for a meeting. |

## Refusal

A file is refused, with the first reason found, when it is not JSON, has a
field missing, a field the tables do not list, a value the tables or the
domain model do not allow, or two bookings that overlap: two meetings, a
meeting in a time block, or two time blocks. Nothing of a
refused file is taken.
