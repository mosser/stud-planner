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
- **Participants**: the people of the schedule, students and co-supervisors, each named
  once, added, renamed and removed in their own dialog. A meeting is ticked with its
  participants, who are written on it; the list under the grid singles out one participant's
  meetings.
- **Categories**: every meeting is Master, PhD, Project or Lab, tagged on the grid, and the
  list under the grid singles out a category's meetings as it does a participant's.
- **On campus or remote**: each weekday's header says where you are that day, in week A and
  in week B, with a click.
- Meetings of half an hour or less stay readable: title and time on one line, participants
  under them; every booking tells all of itself on hover.
- The schedule is kept by the browser between two sessions, and is downloaded as, or
  uploaded from, `stud-planner-schedule.json`: the way to share it.
