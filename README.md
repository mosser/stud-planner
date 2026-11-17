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

Download the schedule and send the file to whom you choose; they upload it,
and may lock it. A schedule names people: it is never committed or published
with the page.

Architecture decisions are in [`docs/adr/`](docs/adr/), the specification in
[`docs/specs/`](docs/specs/).

## License

MIT, see [LICENSE](LICENSE).
