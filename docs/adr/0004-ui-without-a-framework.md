# ADR 0004: User interface without a framework

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Sébastien Mosser

## Context

The interface is a handful of screens in one file (ADR 0001). Every library
inlined weighs on the page, and every dependency has to be bumped by hand.

Options considered:

- **A framework** (React, Vue, Svelte). Reactive rendering, at the cost of a
  runtime in the page and a toolchain to keep pinned.
- **Plain DOM with an escaping template.** No runtime; the code re-renders a
  screen explicitly.

## Decision

- Views are rendered with the `html` tagged template of `src/ui/html.ts`,
  which escapes every interpolated value. `raw()` wraps only markup the
  system built itself, never text the user typed or a file name.
- A click changes the state and re-renders the screen. An edit made while
  typing updates the DOM in place, so keyboard focus is kept.
- Colour literals live only in the palette block of `src/style.css`; the
  interface uses the `--color-*` roles.

## Consequences

**Positive**

- No framework runtime in the page and no framework to upgrade.
- Escaping is the default: an interpolation cannot inject markup by mistake.

**Negative / accepted trade-offs**

- Re-rendering is explicit and coarse; screens must stay small.

## Compliance

A change is compliant with this ADR when `package.json` holds no UI framework,
markup is built with `html`, and no colour literal appears outside the palette
block of `src/style.css`.
