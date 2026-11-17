# ADR 0003: Code quality with Vitest and Biome

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Sébastien Mosser

## Context

The project has one developer and no reviewer on every change: the checks
that run before a push are the review.

Options considered:

- **ESLint and Prettier.** Mature, but two tools and two configurations.
- **Biome.** One tool, one configuration, formats and lints.
- **A static analysis service** (SonarQube) on top. Adds a quality gate on new
  code, at the cost of a project to configure and a token to keep. It is not
  adopted now.

## Decision

- **Vitest** runs the tests, `*.test.ts` next to the code they test. UI tests
  start with `// @vitest-environment happy-dom`; the others run in Node.
  Coverage (v8) has a floor of 80 % on lines, functions, branches and
  statements: `npm run test` fails below it.
- **Biome** formats and lints (`biome.json`). No nested ternaries. No
  `biome-ignore` or `@ts-expect-error` without a reason comment. No `TODO`.
  Throw the specific error class (`TypeError`, `RangeError`).
- Business code and tests are separate compiler projects
  (`tsconfig.app.json`, `tsconfig.test.json`); business code never imports a
  test file, `vitest` or a `node:` module.
- `npm run verify` (typecheck, lint, test, build, `scripts/check-adr.sh`) is
  the definition of green, and CI runs the same steps on every push.
- `scripts/check-adr.sh` holds every ADR rule a grep or a Node one-liner can
  verify.

## Consequences

**Positive**

- One command says whether a change is ready.
- Rules that a script can check are not left to memory.

**Negative / accepted trade-offs**

- No external quality gate: issues a static analysis service would raise are
  caught only by Biome and the tests.

## Compliance

A change is compliant with this ADR when `npm run verify` passes, and every
new behaviour comes with its test.
