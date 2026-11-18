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
| Overview | Every booking, each day in two halves side by side: week A on the left, week B on the right. A weekly booking takes both halves. A bi-weekly booking takes the half of its week, whole, its title, time and participants written as on its week's tab; where the other week has nothing at that time, the other half is outlined, so that what alternates shows at once. |
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
| Its weeks | A booking added is held in the weeks of the tab it is added from: in week A or week B, bi-weekly; from the overview, in both, weekly. The dialog says so in its heading, *New meeting in week A*, and asks for nothing more about its weeks. |
| Done | Adds the booking once it overlaps nothing, and, for a meeting, once it has a title. Cancel, Escape or a click outside the dialog add nothing. |

## Moving, resizing and removing a booking

Meetings and time blocks are moved, resized and removed alike.

| Rule | Behaviour |
|---|---|
| Move | Dragging a booking to another slot changes its weekday and its start, never its duration, cadence or week; it cannot end after the day. |
| Resize | Dragging the lower edge of a booking changes its duration, one quarter at a time, within the day. |
| A weekly booking | Moved or resized on any tab, it changes in both weeks. |
| Refused | While a drag would make an overlap, the booking shows where it would go as refused; dropped there, it goes back where it was, nothing changes, and the screen names the booking overlapped: *Overlaps the time block Teaching, every week, 10:00 to 12:00.* The notice is dismissed by its mark, or by the next change. |
| Escape | During a drag, Escape puts the booking back where it was. |
| Remove | The remove mark of a booking, Delete while it has the focus, or Remove in its dialog asks the Organizer to confirm, naming the booking, its cadence and its time: *Remove Lab meeting, weekly, Monday 10:00 to 11:00?*, *Remove a time block, bi-weekly, week A, Friday 14:00 to 15:00?* Confirmed, the booking leaves the schedule; otherwise nothing changes. A weekly booking removed from one week's tab leaves both weeks. |

## Short bookings

The grid fills the window: its quarters share the height the rest of the
page leaves, a line of text each at least, below which the page scrolls. Two
bookings back to back stand a pixel apart. A booking of half an hour
or less writes its title and time on one line, and its participants under
them; a booking of a quarter, its title alone. Every booking tells all of
itself on hover: its title, cadence, weekday, time and participants.

## Categories

| Rule | Behaviour |
|---|---|
| In the dialog | The dialog of a meeting asks for its category first, *Choose a category* until one is chosen, then what it needs: a one-to-one meeting, Master or PhD, its **student**, one participant, and its **co-supervisors**; a titled meeting, Project or Lab, its **title** and its **participants**. Done is refused until the category is chosen and the student picked, or the title typed. A meeting read without a category asks for it when next changed. |
| On the grid | A meeting is shown by its title and its category, *Kalvin \| PhD*, *Thesis tool \| Project*; once when they are the same word. A one-to-one meeting's title is its student's name, renamed with them. |
| Singled out | The list under the grid singles out a category's meetings, as it does a participant's. |

## On campus or remote

| Rule | Behaviour |
|---|---|
| The toggle | The header of each weekday holds a toggle saying where the Organizer is on that day: a building on campus, a house remote, a dashed circle when it does not say. A click goes from not said to on campus, to remote, and back. |
| Its week | On a week's tab, the toggle is that of the day in the week of the tab. On the overview, a day has one toggle while week A and week B say the same, which changes both; else two, marked A and B, one for the day in each week. |
| Locked | The toggles are shown, and do not change. |

## Participants

| Rule | Behaviour |
|---|---|
| The list | The participants button, beside Download and Upload, opens the participants of the schedule: each by name, with the number of meetings they take part in. Participants are listed by name, A to Z, whatever the case and the accents, here as in the list under the grid, the names offered as one types, and a meeting's chips and names. |
| Add | A name typed and added makes a participant; a name another participant has, whatever its case, is refused and the reason shown. |
| Rename | A name changed in the list renames the participant, in every meeting they take part in. |
| Remove | The remove mark of a participant takes them out of the schedule and of every meeting; the one-to-one meetings they are the student of go with them. When they take part in some, the Organizer confirms first: *Remove Kalvin from the participants, and from 3 meetings? Their 2 one-to-one meetings go too.* |
| On a meeting | The dialog of a meeting shows its student and its other participants as chips, each removed by its mark. A name typed is picked among the participants of the schedule, offered as one types, by Enter or Add; a name no participant has makes a new one, marked *(new)*, added to the schedule with the meeting. The grid writes the participants besides the student, two at most, then how many others: *Ana, Bo +10*; on hover and to a screen reader, the meeting names them all. |
| Singled out | A list under the grid, beside the switch, labelled *Filter by*, offers *None*, the categories and the participants: one chosen singles out their meetings, every other booking faded. Time blocks are never faded: they are the Organizer's own time. |
| Locked | The participants are shown, and none is added, renamed or removed. |

## The dialog of a booking

A click on a booking, without a drag, opens its dialog: title, weeks (both
weeks, week A or week B, when it is changed), weekday, start and duration,
and for a meeting its category, participants and note, with
Done and Remove. Every change a move or a resize makes can also be made here,
with the keyboard. Done is refused while the booking would overlap another,
and the dialog names it: *Overlaps Lab meeting, week A, 10:00 to 11:00.* A
bi-weekly booking made weekly overlaps whatever takes its slots in the other
week. A meeting needs a title; a time block does not.

## The lock

| Rule | Behaviour |
|---|---|
| Lock | The lock button, a padlock, locks the schedule against every change, and unlocks it. The padlock is open while the schedule can be changed, closed while it is locked; it is named *Lock* to a screen reader, and *Lock* or *Unlock* on hover. |
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
