# Changelog

All notable changes to this project are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **Supervision Planner**, with its icon in the masthead and the browser's tab.
- A schedule of recurring meetings, weekly or bi-weekly, planned on two abstract weeks,
  week A and week B, which alternate, without dates, Monday to Friday from 08:00 to 18:00, by the quarter.
- Three tabs, shown one at a time, each marked with the colour of its week: **Overview**,
  shown first, which merges the two weeks, cutting the time a booking of week A and one of
  week B share along its diagonal, week A upper left, week B lower right; then **Week A** and
  **Week B**.
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
- **Shared schedules**: the schedules of the `schedules/` folder of the repository are built
  into the page and listed at the top right; choosing one replaces the schedule, once
  confirmed, and locks it.
- The schedule is kept by the browser between two sessions, and is saved to, or loaded
  from, `stud-planner-schedule.json`.
