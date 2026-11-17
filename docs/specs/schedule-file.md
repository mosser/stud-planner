# Schedule file

The schedule as a file: JSON, UTF-8, one object. The browser keeps the same
content (ADR 0006).

## The schedule

| Field | Value |
|---|---|
| `format` | `"stud-planner/schedule"`. |
| `version` | `1`. A file of another version is refused. |
| `referenceWeek` | The Monday of the reference week, `YYYY-MM-DD`. |
| `meetings` | The meetings, an array, possibly empty. |

## A meeting

| Field | Value |
|---|---|
| `title` | Its title. |
| `cadence` | `"weekly"`, `"bi-weekly"` or `"monthly"`. |
| `parity` | `"odd"` or `"even"`; for a bi-weekly meeting only. |
| `ordinal` | `"first"`, `"second"`, `"third"`, `"fourth"` or `"last"`; for a monthly meeting only. |
| `weekday` | `"monday"` to `"friday"`. |
| `start` | `HH:MM`, a quarter of the day. |
| `duration` | In minutes, a whole number of quarters. |
| `note` | Its note; absent when it has none. |

## Refusal

A file is refused, with the first reason found, when it is not JSON, has a
field missing, a field the table does not list, or a value the table or the
domain model does not allow. Nothing of a refused file is taken.
