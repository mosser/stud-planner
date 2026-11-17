# Plan the meetings

The system has one screen. It shows the three template weeks side by side
(stacked when the window is narrow): the odd week, the even week and the
monthly week. Above them stand this week, Add a meeting, Save and Load.

## This week

| Rule | Behaviour |
|---|---|
| Parity of this week | The week of today, by its Monday, and whether it is odd or even: *Week of 16 November 2026: odd*. |
| Switch | *Make this week even* (or *odd*) sets the reference week so that this week has that parity. Every meeting stays where it is on the template weeks. |

## Adding a meeting

| Rule | Behaviour |
|---|---|
| From a slot | Pressing an empty slot and dragging down marks the meeting's start and duration, one quarter at a time, within the day. A press without a drag marks one hour, or up to the end of the day. |
| Cadence offered | The meeting dialog opens with the cadence of the template week pressed: bi-weekly in odd weeks, bi-weekly in even weeks, or monthly on the first of the month. The Organizer may change it, weekly among the choices. |
| Without a pointer | Add a meeting opens the same dialog, empty, Monday at 09:00 for one hour, bi-weekly in odd weeks. |
| Done | Adds the meeting once it has a title. Cancel, Escape or a click outside the dialog add nothing. |

## Moving and reshaping a meeting

| Rule | Behaviour |
|---|---|
| Move | Dragging a meeting to another slot changes its weekday and its start, never its duration; it cannot end after the day. |
| Odd to even | Dragging a bi-weekly meeting from one parity's week to the other's changes its parity. |
| A weekly meeting | Appears on the odd and on the even week, alike; moving it on either moves it on both. |
| The monthly week | A monthly meeting moves within the monthly week only, and nothing else moves onto it: a cadence changes in the meeting dialog. |
| Resize | Dragging the lower edge of a meeting changes its duration, one quarter at a time, within the day. |
| Escape | During a drag, Escape puts the meeting back where it was. |

## The meeting dialog

A click on a meeting, without a drag, opens its dialog: title, cadence,
parity (bi-weekly) or ordinal (monthly), weekday, start, duration, note, and
the meeting's clashes. Done applies the changes; Remove takes the meeting
out of the schedule, once confirmed. Every change a drag makes can also be
made here, with the keyboard.

## Clashes

A meeting in a clash is marked on its template week, the meetings that share
a slot standing side by side, and its dialog lists each clash: *Clashes with
Lab meeting, every week*.

| Meeting | with weekly | with bi-weekly | with monthly |
|---|---|---|---|
| Weekly | every week | every other week | every month |
| Bi-weekly | every other week | every other week, same parity; never otherwise | some months |
| Monthly | every month | some months | every month, same ordinal; some months, fourth and last; never otherwise |

Two meetings clash only when they share a weekday and their times overlap: one
ending as the other starts do not clash.

## Keeping, saving and loading

| Rule | Behaviour |
|---|---|
| Keep | Every change is kept at once; there is no action to keep. When the page opens, the kept schedule comes back. |
| Not kept | When the browser cannot keep the schedule, the screen says that closing the page will lose it, and everything else works. |
| Save | Saves the schedule file, `stud-planner-schedule.json`. |
| Load | Reads a schedule file the Organizer chooses. When the schedule holds a meeting, the Organizer confirms that the file replaces it. |
| Refused | A file that is not a schedule file, or breaks one of its rules, is refused with the reason; the schedule is left as it was. |
