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
- Drags on the grids (adding, moving, resizing a meeting) are
  written on Pointer Events, with no drag-and-drop library and not the HTML
  drag-and-drop API, which gives no control over snapping to a quarter. A
  drag shows where the meeting would go and changes the schedule once, when it
  ends. Every change a drag makes can also be made with the keyboard, in a
  dialog.
- Colours come from the palette of ADR 0010, through the `--color-*` roles
  of `src/style.css`.

## Consequences

**Positive**

- No framework runtime in the page and no framework to upgrade.
- Escaping is the default: an interpolation cannot inject markup by mistake.

**Negative / accepted trade-offs**

- Re-rendering is explicit and coarse; screens must stay small.
- Snapping, the preview of a drag and its cancellation are code of our own,
  with their tests.

## Compliance

A change is compliant with this ADR when `package.json` holds no UI framework
and no drag-and-drop library, `src/` sets no `draggable` attribute, and
markup is built with `html`.
