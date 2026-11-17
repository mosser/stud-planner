# Plan the meetings

The system has one screen, headed *Supervision Planner* with its icon, a
calendar page whose square is cut along its diagonal, week A and week B. It
shows one tab at a time, the overview, week A
or week B, each a grid with a weekday per column and a quarter of the
day per row. Above the grid stand the tabs, and Download and Upload, each shown
as an icon, an arrow down into a tray and up out of it, and named on hover;
under it, on
every tab, the switch between Meeting and Time block. At the right of the
masthead stands the lock. The overview is the first tab,
and the one shown when the page opens; the switch is then on Meeting.

## The tabs

| Tab | Shows |
|---|---|
| Overview | Every booking, each filling its slots, except the time a booking of week A and one of week B share on a weekday: that time is cut along its diagonal, the upper left half for the booking of week A, the lower right half for that of week B, and each booking is whole before and after it. A title starting in a shared time is written in its half's corner. |
| Week A | The weekly bookings and the bi-weekly bookings held in week A. |
| Week B | The weekly bookings and the bi-weekly bookings held in week B. |

Each tab is marked under its name with the colour of the week it shows, that
of week A, of week B, or both for the overview: the colours its
bi-weekly bookings are bordered with. A weekly booking looks alike on the three
tabs, and unlike a bi-weekly one. A
time block is grey, a meeting is tinted with the colour of its cadence; both
are bordered with that colour. So is what a drag shows of a booking added,
moved or resized. A time block without a title is shown as *Time block*.

## Adding a meeting or a time block

A booking is added on the grid, by pressing a slot. A press adds what the
switch says, a meeting or a time block, on every tab; the switch keeps its
choice from tab to tab. Where it is held depends on the tab:

| Tab | The booking added is held |
|---|---|
| Week A, week B | In the week of the tab. |
| Overview | In both weeks: it is weekly. |

| Rule | Behaviour |
|---|---|
| From a slot | Pressing a free slot and dragging down marks the booking's start and duration, one quarter at a time, within the day and over free slots only. A press without a drag marks one hour, or less when a taken slot or the end of the day comes first. On the overview, a slot is free when it is free in both weeks. |
| Cadence offered | From a week's tab, the dialog opens bi-weekly in the week of the tab; the other cadence it offers is weekly, held in that week too, never bi-weekly in the other week. From the overview, it offers weekly only. |
| Done | Adds the booking once it overlaps nothing, and, for a meeting, once it has a title. Cancel, Escape or a click outside the dialog add nothing. |

## Moving, resizing and removing a booking

Meetings and time blocks are moved, resized and removed alike.

| Rule | Behaviour |
|---|---|
| Move | Dragging a booking to another slot changes its weekday and its start, never its duration, cadence or week; it cannot end after the day. |
| Resize | Dragging the lower edge of a booking changes its duration, one quarter at a time, within the day. |
| A weekly booking | Moved or resized on any tab, it changes in both weeks. |
| Refused | While a drag would make an overlap, the booking shows where it would go as refused; dropped there, it goes back where it was, nothing changes, and the screen names the booking overlapped: *Overlaps the time block Teaching, every week, 10:00 to 12:00.* |
| Escape | During a drag, Escape puts the booking back where it was. |
| Remove | The remove mark of a booking, Delete while it has the focus, or Remove in its dialog asks the Organizer to confirm, naming the booking, its cadence and its time: *Remove Lab meeting, weekly, Monday 10:00 to 11:00?*, *Remove a time block, bi-weekly, week A, Friday 14:00 to 15:00?* Confirmed, the booking leaves the schedule; otherwise nothing changes. A weekly booking removed from one week's tab leaves both weeks. |

## The dialog of a booking

A click on a booking, without a drag, opens its dialog: title, cadence,
week (bi-weekly), weekday, start and duration, a note for a meeting, with
Done and Remove. Every change a move or a resize makes can also be made here,
with the keyboard. Done is refused while the booking would overlap another,
and the dialog names it: *Overlaps Lab meeting, week A, 10:00 to 11:00.* A
bi-weekly booking made weekly overlaps whatever takes its slots in the other
week. A meeting needs a title; a time block does not.

## The lock

| Rule | Behaviour |
|---|---|
| Lock | The lock button locks the schedule against every change, and unlocks it. It reads *Lock*, and *Locked* while it is pressed. |
| Locked | Nothing is added, moved, resized, changed or removed: a press on the grid does nothing, bookings have no remove mark and no lower edge to drag, the switch is not shown, and Delete does nothing. A click on a booking, or Enter, shows its dialog read only, with Close alone. |
| Kept | Whether the schedule is locked is kept with it: the page opens as it was left. |
| Replacing | Upload still replaces a locked schedule, once confirmed. |

## Keeping, downloading and uploading

| Rule | Behaviour |
|---|---|
| Keep | Every change is kept at once; there is no action to keep. When the page opens, the kept schedule comes back. |
| Not kept | When the browser cannot keep the schedule, the screen says that closing the page will lose it, and everything else works. |
| Download | Downloads the schedule file, `stud-planner-schedule.json`: the browser writes it on the Organizer's computer. |
| Upload | Reads, in the browser, a schedule file the Organizer chooses; nothing is sent over a network. When the schedule holds a booking, the Organizer confirms that the file replaces it: *Replace the 2 meetings and 1 time block of the schedule with those of week.json?* |
| Refused | A file uploaded that is not a schedule file, breaks one of its rules, or holds two bookings that overlap is refused with the reason; the schedule is left as it was. |

A schedule is shared by its file: the Organizer downloads it and hands it to
whom they choose, who uploads it. No schedule is published with the page: it
names people (ADR 0012).
