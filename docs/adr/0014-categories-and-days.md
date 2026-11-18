# ADR 0014: Categories are configured, and each day of each week says where the Organizer is

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Sébastien Mosser

## Context

The Organizer supervises Master's and PhD students, projects, and a lab, and
wants to see what each meeting is about, and one kind of meeting at a
glance. They are on campus some days and remote others, and not always the
same days in week A and in week B; meetings depend on it.

Options considered for categories:

- **Free text on each meeting.** Nothing to configure, but a category typed
  two ways is two categories, and none can be singled out.
- **Categories of the schedule**, managed like participants. Flexible, but a
  list to keep for four words that change little.
- **Categories configured** in `config/categories.json`, the same for every
  schedule, changed with a release.

Options considered for where the Organizer is:

- **Per weekday, for both weeks.** Simpler, but a day on campus in week A and
  remote in week B cannot be said.
- **Per day of each week**, or nothing said.

## Decision

- The categories are those of `config/categories.json`, each with its kind,
  checked when the page is built (`checkCategories()`); `Category` reads them.
  A **one-to-one** category (Master, PhD) is a meeting with a student, a
  participant, named after them, and maybe co-supervisors; a **titled** one
  (Project, Lab) has a title of its own and participants. The dialog asks the
  category first, then what it needs. A meeting refers to its category by
  reference; one read from a file of version 3 or earlier has none until it
  is changed.
- `Schedule` says, for each day of week A and of week B, on campus, remote, or
  nothing (`presences`), each day once. The day headers toggle it.
- The schedule file is version 4: `category` on a meeting, `days` in the
  schedule (`docs/specs/schedule-file.md`); earlier versions are read.

## Consequences

**Positive**

- One word per category, singled out like a participant.
- Week A and week B may differ, as the Organizer's weeks do.

**Negative / accepted trade-offs**

- A new category is a change of `config/categories.json` and a release.
- A meeting read from an earlier file has no category until changed.

## Compliance

A change is compliant with this ADR when categories are read only from
`config/categories.json`, the build refuses a file that does not list them,
and a day's presence is said per week and weekday, once.
