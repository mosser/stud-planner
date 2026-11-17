# Changelog

All notable changes to this project are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- A schedule of recurring meetings, weekly or bi-weekly, planned on two abstract weeks,
  odd and even, without dates, Monday to Friday from 08:00 to 18:00, by the quarter.
- Three tabs, shown one at a time: **Odd week**, **Even week**, and **Month**, which merges
  them: the time an odd and an even meeting share is cut along its diagonal, odd upper
  left, even lower right.
- Adding a meeting by pressing a free slot and dragging down, or with **Add a meeting**;
  moving it by dragging, resizing it by its lower edge, and changing it in its dialog.
- Removing a meeting from its remove mark, the Delete key or its dialog, once confirmed.
- A slot is never booked twice: a change or a file that would make two meetings overlap is
  refused, and the meeting overlapped is named.
- The McMaster University colour palette, in a light and a dark theme: weekly meetings in
  green, odd weeks in blue, even weeks in gold.
- The schedule is kept by the browser between two sessions, and is saved to, or loaded
  from, `stud-planner-schedule.json`.
