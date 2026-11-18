# ADR 0010: Use the McMaster University colour palette

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Sébastien Mosser

## Context

The application is used at McMaster University, next to its siblings
`macreport` and `streaming-hat`, which use McMaster's palette. It needs colours
for its chrome and three colours of data: weekly, week-A and week-B
bookings, which must stay apart on the overview, where a booking of week A and one of week B
share their slots.

McMaster publishes its palette and usage rules at
<https://brand.mcmaster.ca/guidelines_introduction/visual-identity-guidelines/colour-palette/>.
The values below are the ones `macreport` and `streaming-hat` take from that
page.

Options considered:

- **A neutral palette of our own.** Free of a brand, but unlike the sibling
  applications, and every contrast decided anew.
- **The McMaster palette**, its heritage colours for the chrome and its
  accents for data, with contrast checked once.

## Decision

The interface uses **only** the McMaster palette, as `--mac-*` custom
properties in the palette block of `src/style.css`. Every other colour is a
role (`--color-*`) defined from them, or a tint mixed from them with
`color-mix()`; no other literal is introduced.

### Palette

| Token | Name | HEX |
|---|---|---|
| `--mac-maroon` | Heritage Maroon | `#7A003C` |
| `--mac-gold` | Heritage Gold | `#FDBF57` |
| `--mac-grey` | Heritage Grey | `#495965` |
| `--mac-white` | White | `#FFFFFF` |
| `--mac-black` | Black | `#000000` |
| `--mac-accent-pink` | Royal Botanical Pink | `#FF9980` |
| `--mac-accent-lime` | Cootes Paradise Green | `#E4EA6C` |
| `--mac-accent-green` | King's Forest Green | `#0E5B3D` |
| `--mac-accent-blue` | Bayfront Blue | `#0D5D78` |
| `--mac-accent-sky` | Albion Falls Blue | `#AAD5E1` |
| `--mac-accent-purple` | Pier 4 Purple | `#CC99CC` |
| `--mac-accent-light-grey` | Dundurn Grey | `#DBDBDD` |

### Roles

The interface has one theme, light: a white surface and black text, whatever
the browser's preference.

| Role | Colour |
|---|---|
| Primary: masthead, Done, Remove in a confirmation | Maroon, white text |
| Chosen: the tab shown, the kind a press adds | Maroon text and border on maroon 12 % on white |
| Surface, text | White, black |
| Secondary text, rules | Grey, Dundurn Grey |
| Weekly | King's Forest Green |
| Week A | Bayfront Blue |
| Week B | Gold |
| Mark under a tab's name, 4 px: overview, week A, week B | Half blue and half gold, blue, gold |
| Time block | Grey, 25 % on white |
| Half of a week left empty on the overview | Dashed Dundurn Grey outline |
| Category tag on a meeting | Black text, Grey border, on the meeting's fill |
| Toggle of a day: said, not said | Black, Grey |
| Icon in the masthead: frame, week A, week B | Dundurn Grey, Albion Falls Blue, gold |
| Icon of the browser's tab: frame, week A, week B | Maroon, Bayfront Blue, gold; read from the roles when the page opens |
| Refused, errors | Maroon |

A booking is drawn with its cadence's colour as a border, and filled behind
its text with a light tone of it:

| Cadence | Fill |
|---|---|
| Weekly | Green, 22 % on white |
| Week A | Albion Falls Blue, 65 % on white |
| Week B | Gold, 22 % on white |

Week A is filled with Albion Falls Blue rather than a tint of the
Bayfront Blue of its border: a tint of Bayfront Blue is a blue grey that
cannot be told from the grey of a time block. A time block is filled with its
grey, whatever its cadence.

### Usage rules

1. **Maroon dominates** the chrome. Gold is never more prominent than maroon.
   What is chosen among a few, the tab shown or the kind a press adds, is a
   light maroon; solid maroon is kept for the masthead and the actions that
   conclude a dialog.
2. **Accents and gold are for data**: the cadences of bookings. They are
   borders and fills, never text.
3. **No new literal.** A tint is mixed from a token with `color-mix()`.
4. **Text contrast meets WCAG AA (4.5:1).** The pairings used:

   | Text | Background | Ratio |
   |---|---|---|
   | White | Maroon | 11.1 |
   | Maroon | White | 11.1 |
   | Maroon | Maroon, 12 % on white | 8.7 |
   | Grey | White | 7.2 |
   | Black | each fill | 14.6 at least |
   | Grey | each fill | 5.0 at least |
   | Black / Grey | Grey, 25 % on white (time block) | 14.4 / 4.9 |

   **Forbidden for text:** gold on white (1.6:1) or on any light tint, and
   white on gold.

### Options considered for the themes

- **A light and a dark theme**, following the browser's preference. Every
  role then has two values, each pairing two ratios, and the cadences two
  sets of fills to keep apart from the grey of a time block.
- **The light theme only.** One set of colours to check and to keep readable.

## Consequences

**Positive**

- The application looks like its siblings and like McMaster material.
- Contrast is checked once, for the tints the screen uses.

**Negative / accepted trade-offs**

- Gold, the clearest colour against Albion Falls Blue on the overview, cannot carry
  text; the title of a booking of week B is written in black over it.
- A reader who sets the browser to a dark theme still gets a light page.
- The application's look is tied to McMaster; if it must be neutral, this ADR
  is amended.

## Compliance

A change is compliant with this ADR when every colour literal is a `--mac-*`
token of the palette block of `src/style.css`, every other colour is a role
or a tint made from them, and every pairing of text and background is one of
rule 4 or measured at 4.5:1 at least.
