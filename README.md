# stud-planner

A scheduler for recurring meetings, weekly and bi-weekly, laid out on two
weeks that alternate, week A and week B. Browser-only, delivered as one self-contained HTML
file. Nothing it does crosses a network.

- **Use it:** <https://mosser.github.io/stud-planner/>, or download
  `stud-planner-vX.Y.Z.html` from the
  [latest release](https://github.com/mosser/stud-planner/releases/latest) and
  open it in a browser.
- **Build it:** Node 26, then `npm ci` and `npm run verify`; the page is in
  `dist/`.

## Sharing a schedule

Save the schedule, put the file in [`schedules/`](schedules/) under the name it
should be listed by (`schedules/Fall 2026.json`), commit it, and cut a release:
the page lists it at the top right, under *Shared schedules*. Everything in
`schedules/` is public with the page.

Architecture decisions are in [`docs/adr/`](docs/adr/), the specification in
[`docs/specs/`](docs/specs/).

## License

MIT, see [LICENSE](LICENSE).
