# ADR 0005: The schedule is an object model

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Sébastien Mosser

## Context

The rules of a schedule (a start and a duration within the day, a week only
for a bi-weekly meeting, no two bookings in the same slot of the same week) are what the system is for. They must hold whatever screen, drag or
file changes a meeting, and be read against `docs/specs/` by someone who
knows the rules and not TypeScript.

Options considered:

- **Plain records** passed between the screen, the store and the file, checked
  where they are changed. Little code, but every rule is checked in several
  places, or in none.
- **Immutable classes** that refuse a broken invariant when built. A meeting
  that exists is a valid meeting.

## Decision

- `Schedule`, its bookings (`Meeting`, `TimeBlock`, ADR 0011) and their
  values (`Cadence`, `Week`, `Weekday`, `TimeOfDay`, `Duration`) are
  immutable classes in `src/domain/` whose constructor throws on a broken
  invariant. A change returns an `after…` copy:
  `meeting.afterMovingTo(weekday, start)`, `schedule.afterAdding(booking)`.
- The schedule refers to its bookings by reference, never by an identifier
  map. Whether two bookings overlap is derived from them, never stored
  (ADR 0009).
- Names are the glossary's (`docs/specs/domain-model.md`): a new concept is a
  glossary line first. One word, one meaning. No abbreviation, no
  single-letter name. Booleans are questions. Every `export` has a doc comment
  stating its rule in the specification's words.
- Sentences shown to the Organizer (overlaps, refusals) are worded only in
  `src/domain/findings.ts`, pinned by exact-string tests.
- `src/domain/` imports nothing from `src/io/` or `src/ui/`, and uses no
  browser API, and no date (ADR 0008).

## Consequences

**Positive**

- A rule is written once, next to the concept it belongs to, with its test.
- The screen and the file cannot build a meeting, or a schedule, the
  specification forbids.

**Negative / accepted trade-offs**

- Mapping to and from the schedule file is code to write and test (ADR 0007).

## Compliance

A change is compliant with this ADR when `src/domain/` imports nothing from
`src/io/` or `src/ui/` and uses no browser API, every new concept is in the
glossary, and every invariant has a test.
