# Changelog

All notable changes to this project are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- A meeting tall enough to list all its participants lists them all, rather than two and how
  many others; the short form is kept for the meetings where they do not fit.

## [1.1.1] - 2026-11-17

### Changed

- A meeting's time is always written under its title, half-hour meetings included, whose
  participants show on hover.

## [1.1.0] - 2026-11-17

### Added

- On the overview, a bi-weekly meeting or time block dragged into the other week's half of a
  day moves to that week.

### Changed

- The grid fills the window, its quarter hours sharing the height left, a line of text each
  at least; a smaller window scrolls.
- Participants are listed by name, A to Z, wherever they are listed.

## [1.0.0] - 2026-11-17

### Added

- **Supervision Planner**, with its icon in the masthead and the browser's tab.
- A schedule of recurring meetings, weekly or bi-weekly, planned on two abstract weeks,
  week A and week B, which alternate, without dates, Monday to Friday from 08:00 to 18:00,
  by the quarter.
- Three tabs, shown one at a time, each marked with the colour of its week: **Overview**,
  shown first, which shows the two weeks side by side in each day, week A on the left and
  week B on the right, outlining the half of a week that has nothing where the other has a
  booking; then **Week A** and **Week B**.
- A refused change's warning is dismissed by its ×.
- Adding a meeting by pressing a free slot and dragging down: held in the week of the tab,
  weekly or bi-weekly, or, from the overview, in both weeks; moving it by dragging,
  resizing it by its lower edge, and changing it in its dialog.
- Time blocks: the recurring time the Organizer is not available for meetings, with an
  optional title, drawn in grey. A **Meeting | Time block** switch under the grid says what
  a press adds, on every tab; one added from the overview is held in both weeks. No meeting
  can be booked in a time block.
- Removing a meeting or a time block from its remove mark, the Delete key or its dialog,
  once confirmed.
- A slot is never booked twice: a change or a file that would make two meetings overlap is
  refused, and the meeting overlapped is named.
- The McMaster University colour palette, in a light theme: weekly meetings in
  green, week A in blue, week B in gold.
- A **Lock** at the top right blocks every change made by accident: nothing is added,
  moved, resized, changed or removed, and a booking clicked is shown read only. The browser
  remembers it.
- **Participants**: the people of the schedule, students and co-supervisors, each named
  once, added, renamed and removed in their own dialog. A meeting's dialog picks them by name,
  as chips, and adds a name no one has yet; the grid writes two names and how many others,
  and the list under the grid singles out one participant's meetings. Time blocks stay
  visible whatever is singled out.
- **Categories**: every meeting is Master, PhD, Project or Lab, asked first when it is added.
  A Master or PhD meeting is a one-to-one with its student, named after them, and maybe
  co-supervisors: *Kalvin | PhD*. A Project or Lab meeting has its own title and its
  participants. The list under the grid singles out a category's meetings as it does a
  participant's.
- **On campus or remote**: each weekday's header says where you are that day, in week A and
  in week B, with a click.
- Meetings back to back stand apart; meetings of half an hour or less stay readable: title
  and time on one line, participants under them; every booking tells all of itself on hover.
- The schedule is kept by the browser between two sessions, and is downloaded as, or
  uploaded from, `stud-planner-schedule.json`, with the icons above the grid: the way to
  share it.
