# ADR 0012: Schedules are never published with the page

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Sébastien Mosser

## Context

The Organizer makes a schedule they like and wants others to see it. A
schedule names people: its titles, notes and participants are personal data,
students' among them. The repository is public, and so is the page GitHub
Pages serves from it (ADR 0002).

Options considered:

- **Schedule files of the repository built into the page**, listed in a
  menu. Nothing to hand over, but every schedule shared is published with
  the page, to anyone, for as long as a release holds it: a breach of the
  privacy of the people it names.
- **Files fetched from the Pages site.** Published as well, and the page then
  needs the network (ADR 0001).
- **The schedule file, handed over by the Organizer**, downloaded and sent as
  any document, then uploaded by its reader (ADR 0007). The Organizer decides
  who receives it.

## Decision

- No schedule is published with the page: the build takes no schedule file,
  and the repository versions none.
- A schedule is shared by its file: the Organizer downloads it and hands it
  over; its reader uploads it, and may lock it against changes made by
  accident.
- `.gitignore` ignores the schedule files the page downloads
  (`stud-planner-schedule*.json`) and the folder `schedules/`, so that one
  is not committed by mistake.

## Consequences

**Positive**

- The people a schedule names are known only to those the Organizer hands it
  to.

**Negative / accepted trade-offs**

- Sharing a schedule takes a file sent and uploaded, not a choice in a menu.

## Compliance

A change is compliant with this ADR when the build reads no schedule file,
`src/` uses no `import.meta.glob`, and git tracks no JSON file but the
project's own (`package.json`, `package-lock.json`, `biome.json`, the
`tsconfig` files and `config/`), which `scripts/check-adr.sh` checks.
