# Domain Model

The concepts a schedule is made of, and how they relate. The Organizer
changes them on the odd week, the even week and the overview, the browser keeps
them between two sessions, and the schedule file carries them. A schedule
holds no date: its weeks are abstract.

This file is also the **glossary**: a term below means one thing, everywhere,
in the specification, in the interface and in the code.

## Concepts

| Concept | Meaning |
|---|---|
| Organizer | The person who plans their recurring meetings with students, and the time they are not available for them, and the only user of the system. |
| Schedule | What the Organizer plans: the meetings and the time blocks. There is one schedule at a time. No two of its bookings overlap. |
| Booking | What takes slots of the schedule: a meeting or a time block. Both have a cadence, a weekday, a start and a duration, and are added, moved, resized and removed alike. |
| Meeting | A recurring meeting of the schedule: its title, its cadence, its weekday, its start, its duration, and its note when the Organizer gives one. A meeting has no date: it recurs for as long as it is in the schedule. |
| Time block | A recurring time the Organizer is not available for meetings: teaching, a committee, research. No meeting can be booked in it. It has a title when the Organizer gives one, a cadence, a weekday, a start and a duration, and no note. |
| Title | What a booking is called, in the Organizer's words, without leading or trailing spaces: a meeting's is not empty; a time block may have none, and is then shown as *Time block*. Two bookings may have the same title. |
| Note | Free text the Organizer attaches to a meeting: a room, a link, the participants. The system never reads what it says. |
| Cadence | How often a booking recurs: weekly or bi-weekly. |
| Weekly | The cadence of a booking held in the odd week and in the even week. |
| Bi-weekly | The cadence of a booking held in one week only, the odd or the even: its parity. |
| Parity | Which of the two weeks a bi-weekly booking is held in: odd or even. |
| Odd week, even week | The two abstract weeks the schedule is planned on. They have no date: which week of the calendar is odd is the Organizer's to know. |
| Overview | The odd week and the even week merged, as one grid: what the two weeks hold, alternating, and the time they share. A booking added from it is held in both weeks. |
| Weekday | Monday, Tuesday, Wednesday, Thursday or Friday. |
| Day | The hours a booking can take on a weekday: from 08:00 to 18:00, configured in `config/calendar.json`. |
| Quarter | Fifteen minutes. Starts and durations are whole quarters. |
| Start | The time of day a booking begins: a quarter of the day, its end within the day. |
| Duration | How long a booking lasts: one quarter at least, ending at the end of the day at most. |
| Slot | A quarter of a weekday. On the overview, the slots an odd and an even booking share are cut, together, along their diagonal: the upper left half for the odd week, the lower right half for the even week. |
| Free, taken | A slot is taken in a week when a booking held that week covers it, and free otherwise. A weekly booking takes its slots in both weeks, a bi-weekly one in its week only. |
| Overlap | Two bookings that would take the same slot in the same week: two meetings, a meeting in a time block, or two time blocks. The system refuses an overlap, whatever makes it: adding, moving, resizing, changing a cadence or a parity, or loading a file. |
| Tab | One of the three grids the screen shows, one at a time: the overview, first, the odd week and the even week. |
| Switch | What a press adds, on every tab: Meeting or Time block. It stands under the grid. |
| Keep | What the browser does of the schedule: it holds it between two sessions, best effort, and gives it back when the page opens. |
| Schedule file | The schedule as a file of the Organizer's computer, saved and loaded: see `schedule-file.md`. |
| Save | The system hands the schedule file to the browser, which writes it on the Organizer's computer. Nothing is sent over a network. |
| Load | The Organizer hands a schedule file to the system, which reads it in the browser and takes it as the schedule. |
| Refuse | The system does not take a change or a schedule file, says why, and keeps the schedule it has. |
