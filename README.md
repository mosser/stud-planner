# stud-planner

A browser-only application, delivered as one self-contained HTML file. Nothing
it does crosses a network.

- **Use it:** <https://mosser.github.io/stud-planner/>, or download
  `stud-planner-vX.Y.Z.html` from the
  [latest release](https://github.com/mosser/stud-planner/releases/latest) and
  open it in a browser.
- **Build it:** Node 26, then `npm ci` and `npm run verify`; the page is in
  `dist/`.

Architecture decisions are in [`docs/adr/`](docs/adr/), the specification in
[`docs/specs/`](docs/specs/).

## License

MIT, see [LICENSE](LICENSE).
