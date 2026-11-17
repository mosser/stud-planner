# ADR 0010: Use the McMaster University colour palette

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Sébastien Mosser

## Context

The application is used at McMaster University, next to its siblings
`macreport` and `streaming-hat`, which use McMaster's palette. It needs colours
for its chrome and three colours of data: weekly, odd-week and even-week
meetings, which must stay apart on the month, where an odd and an even meeting
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

| Role | Light theme | Dark theme |
|---|---|---|
| Primary: masthead, tab shown, Done, Remove in a confirmation | Maroon, white text | Maroon, white text |
| Surface, text | White, black | Black, white |
| Secondary text, rules | Grey, Dundurn Grey | Dundurn Grey, Grey |
| Weekly meeting | King's Forest Green | Cootes Paradise Green |
| Odd week | Bayfront Blue | Albion Falls Blue |
| Even week | Gold | Gold |
| Refused, errors | Maroon | Royal Botanical Pink |

A meeting is drawn with its cadence's colour as a border and as a tint of the
surface behind its text: 22 % on white, 30 % on black; the halves of the
month, 40 % on white, 45 % on black.

### Usage rules

1. **Maroon dominates** the chrome. Gold is never more prominent than maroon.
2. **Accents and gold are for data**: the cadences of meetings. They are
   borders and tints, never text.
3. **No new literal.** A tint is mixed from a token with `color-mix()`.
4. **Text contrast meets WCAG AA (4.5:1).** The pairings used:

   | Text | Background | Ratio |
   |---|---|---|
   | White | Maroon | 11.1 |
   | Maroon | White | 11.1 |
   | Grey | White | 7.2 |
   | Black | each cadence, 22 % on white | 14.6 at least |
   | Grey | each cadence, 22 % on white | 5.0 at least |
   | Black | each cadence, 40 % on white | 10.4 at least |
   | White | each cadence, 30 % on black | 9.8 at least |
   | Dundurn Grey | each cadence, 30 % on black | 7.1 at least |
   | White | each cadence, 45 % on black | 5.8 at least |
   | Royal Botanical Pink | Black | 10.1 |

   **Forbidden for text:** gold on white (1.6:1) or on any light tint, and
   white on gold.
5. **Dark theme.** The roles of white and black swap, maroon stays primary,
   and the dark accents give way to their light counterparts.

## Consequences

**Positive**

- The application looks like its siblings and like McMaster material.
- Contrast is checked once, for the tints the screen uses.

**Negative / accepted trade-offs**

- Gold, the clearest colour against Bayfront Blue on the month, cannot carry
  text; the title of an even meeting is written in black, or white, over it.
- The application's look is tied to McMaster; if it must be neutral, this ADR
  is amended.

## Compliance

A change is compliant with this ADR when every colour literal is a `--mac-*`
token of the palette block of `src/style.css`, every other colour is a role
or a tint made from them, and every pairing of text and background is one of
rule 4 or measured at 4.5:1 at least.
