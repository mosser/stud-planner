# Plan the meetings

The system has one screen. It shows one tab at a time, the odd week, the even
week or the merged view, each a grid with a weekday per column and a quarter of the
day per row. Above the grid stand the tabs, Add a meeting, Save and Load. The
tab shown is the odd week when the page opens.

## The tabs

| Tab | Shows |
|---|---|
| Odd week | The weekly meetings and the bi-weekly meetings held in the odd week. |
| Even week | The weekly meetings and the bi-weekly meetings held in the even week. |
| Merged | Every meeting, each filling its slots, except the time an odd and an even meeting share on a weekday: that time is cut along its diagonal, the upper left half for the odd meeting, the lower right half for the even one, and each meeting is whole before and after it. A title starting in a shared time is written in its half's corner. |

A weekly meeting looks alike on the three tabs, and unlike a bi-weekly one.

## Adding a meeting

A meeting is added from the odd week or the even week tab, and is held in the
week of that tab. Nothing is added from the merged view: Add a meeting is not
offered there, and pressing a slot adds nothing.

| Rule | Behaviour |
|---|---|
| From a slot | Pressing a free slot and dragging down marks the meeting's start and duration, one quarter at a time, within the day and over free slots only. A press without a drag marks one hour, or less when a taken slot or the end of the day comes first. |
| Cadence offered | The meeting dialog opens bi-weekly in the week of the tab. The other cadence it offers is weekly, held in that week too; never bi-weekly in the other week. |
| Without a pointer | Add a meeting opens the same dialog, empty: the first free hour of the week of the tab, Monday first. |
| Done | Adds the meeting once it has a title and overlaps nothing. Cancel, Escape or a click outside the dialog add nothing. |

## Moving, resizing and removing a meeting

| Rule | Behaviour |
|---|---|
| Move | Dragging a meeting to another slot changes its weekday and its start, never its duration, cadence or parity; it cannot end after the day. |
| Resize | Dragging the lower edge of a meeting changes its duration, one quarter at a time, within the day. |
| A weekly meeting | Moved or resized on any tab, it changes in both weeks. |
| Refused | While a drag would make an overlap, the meeting shows where it would go as refused; dropped there, it goes back where it was and nothing changes. |
| Escape | During a drag, Escape puts the meeting back where it was. |
| Remove | The remove mark of a meeting, Delete while the meeting has the focus, or Remove in its dialog asks the Organizer to confirm, naming the meeting, its cadence and its time: *Remove Lab meeting, weekly, Monday 10:00 to 11:00?* Confirmed, the meeting leaves the schedule; otherwise nothing changes. A weekly meeting removed from one week's tab leaves both weeks. |

## The meeting dialog

A click on a meeting, without a drag, opens its dialog: title, cadence,
parity (bi-weekly), weekday, start, duration and note, with Done and Remove.
Every change a drag makes can also be made here, with the keyboard. Done is
refused while the meeting would overlap another, and the dialog names it:
*Overlaps Lab meeting, odd week, 10:00 to 11:00*. A bi-weekly meeting made
weekly overlaps whatever takes its slots in the other week.

## Keeping, saving and loading

| Rule | Behaviour |
|---|---|
| Keep | Every change is kept at once; there is no action to keep. When the page opens, the kept schedule comes back. |
| Not kept | When the browser cannot keep the schedule, the screen says that closing the page will lose it, and everything else works. |
| Save | Saves the schedule file, `stud-planner-schedule.json`. |
| Load | Reads a schedule file the Organizer chooses. When the schedule holds a meeting, the Organizer confirms that the file replaces it. |
| Refused | A file that is not a schedule file, breaks one of its rules, or holds two meetings that overlap is refused with the reason; the schedule is left as it was. |
