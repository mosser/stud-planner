# ADR 0002: Distribution via GitHub Releases and GitHub Pages

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Sébastien Mosser

## Context

The build is one HTML file (ADR 0001). Users need one place to open the
current version, and a way to keep a given version as a file.

Options considered:

- **GitHub Pages only**, deployed from every push to `main`. Always current,
  but no version can be named, kept or returned to.
- **GitHub Releases only.** Every version is kept, immutable, with its notes,
  but every user must find, save and open a file.
- **Both, from one tag.** A release attaches the file; Pages serves the file
  of the latest release.

## Decision

- A release is a `vX.Y.Z` tag equal to the `version` of `package.json`, cut
  only by `scripts/release.sh vX.Y.Z` from a clean `main` level with
  `origin/main`. The script moves the `[Unreleased]` section of
  `CHANGELOG.md` under `[X.Y.Z]`, runs `npm run verify`, commits, tags, and
  pushes `main` and the tag together once confirmed.
- `.github/workflows/release.yml`, started by the tag, checks it against
  `package.json`, runs `npm run verify`, and creates the GitHub Release with
  `stud-planner-vX.Y.Z.html` attached and the notes taken from the
  `## [X.Y.Z]` section of `CHANGELOG.md` (`scripts/release-notes.sh`).
- A second job, after the release, serves the file of the latest release,
  unchanged, as `index.html` at `https://mosser.github.io/stud-planner/`.
- Releases are immutable: a fix is a new version.
- Workflow steps are pinned to a full commit SHA, with the version in a
  trailing comment.

## Consequences

**Positive**

- The page on GitHub Pages is always a released version, byte for byte the
  file attached to its release.
- The release notes are the CHANGELOG, written with the work.

**Negative / accepted trade-offs**

- A change on `main` reaches users only with a release.
- GitHub Pages must be set to deploy from GitHub Actions in the repository
  settings.

## Compliance

A change is compliant with this ADR when:

- every `uses:` of `.github/workflows/` is pinned to a 40-character SHA with
  its version in a comment;
- `release.yml` takes its notes from `scripts/release-notes.sh`, never
  generates them, and deploys Pages in a job that `needs: release`;
- `CHANGELOG.md` keeps an `## [Unreleased]` section;
- no `v*` tag is pushed except by `scripts/release.sh`.
