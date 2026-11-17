# ADR 0013: Participants are people of the schedule, named once

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Sébastien Mosser

## Context

The Organizer meets students and co-supervisors, and wants to see who each
meeting is with, and one person's meetings at a glance. The same person takes
part in several meetings, and may be renamed. Their names are personal data,
kept on the Organizer's computer and in the files they hand over
(ADR 0001, ADR 0012).

Options considered:

- **Names typed on each meeting.** Nothing to manage, but the same person
  typed twice, or misspelt once, is two people: one person's meetings cannot
  be singled out, nor a name changed everywhere.
- **Participants of the schedule**, each named once, that meetings refer to.
  A list to keep, and one place to rename a person.

## Decision

- `Participant` is a class of `src/domain/`, by a name unique in the schedule
  whatever its case. `Schedule` holds them, and a `Meeting` refers to some of
  them by reference, each once; the schedule refuses a meeting naming
  someone who is not one of its participants.
- Renaming or removing a participant is a change of the schedule
  (`afterRenaming`, `afterRemovingParticipant`) that carries into every
  meeting they take part in. A time block has no participant.
- No two meetings overlap (ADR 0009), so no participant is ever in two
  meetings at once: nothing else is checked.
- The schedule file, version 3, lists the participants by name, and each
  meeting its participants by name (`docs/specs/schedule-file.md`).
- The grid writes a meeting's participants, and singles out one
  participant's meetings on request; a meeting of half an hour or less is
  drawn compact, so that it stays readable.

## Consequences

**Positive**

- One person, one name: renamed once, and singled out across the weeks.

**Negative / accepted trade-offs**

- A person must be added to the participants before a meeting can name them.
- More personal data in every file downloaded: the Organizer hands it over
  only to whom they choose.

## Compliance

A change is compliant with this ADR when a meeting can only refer to a
participant of its schedule, renaming and removing carry into every meeting,
and a file of every version written is read back by a test.
