# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

`stud-planner` is a client-side web application in TypeScript, front-end only,
delivered as **one self-contained `dist/stud-planner-vX.Y.Z.html`** that opens
from `file://` and is served by GitHub Pages at
`https://mosser.github.io/stud-planner/`. Nothing crosses a network. See
[ADR 0001](docs/adr/0001-typescript-frontend-only-single-file-pinned-build.md).

It follows the conventions of its siblings `macreport` and `streaming-hat`.

**Current state:** scaffold only. The toolchain, the release pipeline and an
empty page shell (masthead, screen, footer with the version) are in place.
What the application does is not specified yet: `docs/specs/` is empty, and
there is no domain code.

## Where things live

- `docs/specs/`: the functional specification, the source of truth for
  behaviour. Expected: `stakeholders.md`, `domain-model.md` (the glossary), one
  file per workflow. Read the relevant spec before implementing a feature; if a
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
src/domain/   the object model and its rules: pure, no DOM (not created yet)
src/io/       reading and saving files, browser storage (not created yet)
src/ui/       html.ts (the escaping template), application.ts (the page shell)
src/main.ts   entry point, mounted from index.html
src/style.css palette tokens and all styling
config/       hand-maintained JSON, inlined at build time (not created yet)
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
- Colour literals live only in the palette block of `src/style.css`; the
  interface uses `--color-*` roles. Branding is not decided yet.

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
