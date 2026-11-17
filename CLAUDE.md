# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

`stud-planner` is a meeting scheduler for recurring meetings. The Organizer
places weekly and bi-weekly meetings on two abstract weeks, odd and even, by
pressing and dragging on them, and sees them one tab at a time or in the
merged view, where only the time an odd and an even meeting share is cut along
its diagonal, odd upper left, even lower right. A slot is never booked twice. The schedule is kept in the browser
and saved to, or loaded from, a schedule file.

It is a client-side web application in TypeScript, front-end only,
delivered as **one self-contained `dist/stud-planner-vX.Y.Z.html`** that opens
from `file://` and is served by GitHub Pages at
`https://mosser.github.io/stud-planner/`. Nothing crosses a network. See
[ADR 0001](docs/adr/0001-typescript-frontend-only-single-file-pinned-build.md).

It follows the conventions of its siblings `macreport` and `streaming-hat`.

**Current state:** the specification (`docs/specs/`) and ADRs 0001 to 0009
are implemented: the three tabs, adding, moving, resizing and removing by
dragging, the meeting dialog, overlaps refused, the schedule kept in
IndexedDB, and saved to or loaded from its file. Not released yet.

## Where things live

- `docs/specs/`: the functional specification, the source of truth for
  behaviour. `stakeholders.md`, `domain-model.md` (the glossary),
  `plan-the-meetings.md` (the tabs, their gestures, overlaps refused),
  `schedule-file.md` (the file saved and loaded, and what the browser keeps). Read the relevant spec before implementing a feature; if a
  spec is missing or ambiguous, say so rather than guessing. Spec files are
  short, self-contained, and never cite or link to documents outside the
  repository: a heading, then tables or short paragraphs, no preamble.
- `docs/adr/`: Architecture Decision Records, `NNNN-short-title.md`. Sections:
  Status, Date, Deciders, Context (with "Options considered"), Decision,
  Consequences (Positive, Negative / accepted trade-offs), Compliance. ADRs are
  living documents: when a decision changes, amend the ADR in place and update
  its Date line; do not write a superseding ADR. A new ADR is for a new
  decision. An ADR never narrates how the project got here ("until now", "no
  longer", "the first version"); it states the forces that hold today, and a
  rejected approach goes under "Options considered", in the present tense.

Layout of the code:

```
src/domain/   Schedule (no overlap), Meeting, Cadence and Parity, Weekday,
              TimeOfDay, Duration, Day (config/calendar.json), findings.ts
              (every sentence shown); *.fixture.ts are test helpers
src/io/       schedule-file.ts (the JSON file), schedule-store.ts (IndexedDB),
              save.ts (hands a file to the browser)
src/ui/       application.ts (state, toolbar, tabs, drags), gestures.ts (what a
              press or a drag makes, pure), grid.ts (a tab's grid, slotAt),
              meeting-dialog.ts, confirmation.ts, dialog.ts, html.ts
src/main.ts   entry point, mounted from index.html
src/style.css palette tokens and all styling
config/       calendar.json: the hours of the day; inlined at build time and
              checked by the build
scripts/      check-adr.sh: the scriptable ADR checks; release.sh and
              release-notes.sh: cutting a release (ADR 0002)
```

## Ground rules

These are constraints, not suggestions. A change that breaks one amends its ADR
first.

### ADR 0001: single file, no network, pinned build

- TypeScript only in `src/`, `strict`. No server-side code, proxy or
  serverless function.
- The build is one file (`vite-plugin-singlefile`, `base: './'`): no dynamic
  `import()`, no `fetch()`, no network API at all; assets are imported from
  `src/` so they are inlined.
- Every dependency is an exact version (`.npmrc`: `save-exact`,
  `engine-strict`). `package-lock.json` committed; `npm ci`, never
  `npm install` on a fresh checkout. A dependency bump is its own commit
  touching `package.json` and `package-lock.json` only.
- Node 26 (LTS), pinned in `.nvmrc` and `engines`. TypeScript on the 6.0 line.
  On this machine Node 26 is `/opt/homebrew/opt/node@26/bin`; put it first in
  `PATH` when the default `node` is older.

### ADR 0002: releases

- A release is a `vX.Y.Z` tag equal to the `version` of `package.json`, cut
  only by `scripts/release.sh vX.Y.Z` from a clean, up-to-date `main`. The
  workflow attaches `stud-planner-vX.Y.Z.html`, takes the release notes from
  the `## [X.Y.Z]` section of `CHANGELOG.md`, and deploys the same file as
  `index.html` to GitHub Pages. Never cut a release unless asked. Actions are
  pinned to a full commit SHA with the version in a comment.

### ADR 0003: quality

- `npm run verify` (typecheck, lint, test, build, ADR checks) is the
  definition of green. Run it before reporting work as done.
- Every new behaviour has a test next to it (`*.test.ts`); every rule of the
  specification has at least one. Coverage floor 80 % on every metric.
- Business code and tests are separate compiler projects
  (`tsconfig.app.json`, `tsconfig.test.json`); business code never imports a
  test file, `vitest` or a `node:` module. Node types in the test project only.
- Biome formats and lints: run `npm run format`. No nested ternaries. No
  `biome-ignore` or `@ts-expect-error` without a reason comment. No `TODO`.
  Throw the specific error class (`TypeError`, `RangeError`).
- No SonarQube analysis for now.

### ADR 0004: no framework

- Views are rendered with the escaping `html` template of `src/ui/html.ts`;
  `raw()` never wraps text the user typed or a file name. Clicks change the
  state and re-render; typed edits update the DOM in place, so focus is kept.
- Drags (add, move, resize) are written on Pointer Events: no drag-and-drop
  library, no HTML drag-and-drop API, no `draggable`. A drag previews, then
  changes the schedule once, when it ends; Escape cancels it. Everything a
  drag does can also be done with the keyboard in the meeting dialog.
- Colours: see ADR 0010.

### ADR 0010: McMaster palette

- Colour literals are the `--mac-*` tokens of the palette block of
  `src/style.css`, and nothing else; the interface uses `--color-*` roles and
  `color-mix()` tints of them. Maroon dominates the chrome. The cadences are
  data: weekly green, odd blue, even gold (lime and sky in the dark theme).
- Gold is never text. Every text and background pairing is one tabled in the
  ADR, or measured at 4.5:1 at least.

### ADR 0005: object model

- `Schedule`, `Meeting` and their values are immutable classes in
  `src/domain/` that throw on a broken invariant; changes return `after…`
  copies; the schedule holds its meetings by reference. Overlaps are derived,
  never stored.
- Names are the glossary's (`docs/specs/domain-model.md`): add the glossary
  line first. One word, one meaning. No abbreviation, no single-letter name.
  Booleans are questions. Every `export` has a doc comment stating its rule in
  the specification's words.
- Sentences shown to the Organizer are worded only in `src/domain/findings.ts`,
  pinned by exact-string tests. `src/domain/` imports nothing from `src/io/`
  or `src/ui/`, uses no browser API, and holds no date.

### ADR 0006: the kept schedule

- Only `src/io/schedule-store.ts` touches IndexedDB (database `stud-planner`),
  keeping the schedule file's content; nothing uses `localStorage`,
  `sessionStorage`, cookies or the Cache API. Every change is kept at once.
  Every access is guarded and the system works without it, saying so.

### ADR 0007: the schedule file

- The schedule is saved and loaded as `stud-planner-schedule.json`, in the
  versioned format of `docs/specs/schedule-file.md`, written and read only by
  `src/io/schedule-file.ts`. A file is checked completely before anything is
  taken. A change of format is a new version; every version written is read.
- "Upload" and "download" never appear under `src/` (except the `download`
  attribute in `src/io/save.ts` and its test) nor in `docs/specs/`.

### ADR 0008: two abstract weeks

- The schedule is planned on an odd week and an even week, without dates; the
  system never reads today's date. A meeting is weekly (both weeks) or
  bi-weekly (its parity's week); there is no monthly cadence.
- Three tabs, one at a time: odd week, even week, merged (both; only
  the time an odd and an even meeting share is cut along its diagonal, odd
  upper left, even lower right, by `piecesOf` in `grid.ts`). No occurrence: a
  meeting is changed as a whole.
- A meeting is added from a week's tab only, held in that week (weekly or
  bi-weekly in it, `cadencesAddedIn`); nothing is added from the merged
  view.

### ADR 0009: a slot is booked once

- No two meetings overlap: an invariant of `Schedule`, whose constructor
  throws. Adding, moving, resizing, changing a cadence or a parity, and
  loading a file are refused when they would make one; a refused drop changes
  nothing. Ending as another starts is not an overlap.

## Writing

- **No narrating text** in the interface: no sentence that introduces a
  screen or a section, restates its heading or explains how to read it.
- Words are the glossary's, in the interface as in the code. Files are loaded
  or added and saved, never uploaded or downloaded.

## Git

- **Work is committed and pushed directly to `main`.** No development branch,
  no pull request, no SonarQube step. This overrides the global branch and
  pull request workflow for this repository.
- Never push a `v*` tag unless asked: a tag is a release.
- Commit subjects are imperative sentences saying what the change does.
- `CHANGELOG.md` (Keep a Changelog) is kept in step with every user-visible
  change, under `[Unreleased]`.

## Commands

```sh
npm ci              # install from the lockfile
npm run dev         # Vite dev server
npm run verify      # typecheck + lint + test + build + ADR checks: the full gate
npm run typecheck   # tsc -b over the app and test projects
npm run lint        # Biome lint + format check
npm run format      # Biome, rewrite files
npm run test        # Vitest once, with coverage and its 80 % floor
npm run build       # tsc -b, then the single file dist/stud-planner-vX.Y.Z.html
npm run check       # scripts/check-adr.sh (needs a build first)
scripts/release.sh vX.Y.Z  # cut a release from main (only when asked)
```
