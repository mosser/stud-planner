# Domain Model

The concepts a schedule is made of, and how they relate. The Organizer
changes them on week A, week B and the overview, the browser keeps
them between two sessions, and the schedule file carries them. A schedule
holds no date: its weeks are abstract.

This file is also the **glossary**: a term below means one thing, everywhere,
in the specification, in the interface and in the code.

## Concepts

| Concept | Meaning |
|---|---|
| Organizer | The person who plans their recurring meetings with students, and the time they are not available for them, and the only user of the system. |
| Schedule | What the Organizer plans: the meetings, the time blocks, and the participants. There is one schedule at a time. No two of its bookings overlap. |
| Booking | What takes slots of the schedule: a meeting or a time block. Both have a cadence, a weekday, a start and a duration, and are added, moved, resized and removed alike. |
| Meeting | A recurring meeting of the schedule: its title, its cadence, its weekday, its start, its duration, its participants, and its note when the Organizer gives one. A meeting has no date: it recurs for as long as it is in the schedule. |
| Participant | A person the Organizer meets: a student, a co-supervisor. A participant of the schedule, by a name no other participant has, whatever its case. A meeting is with some of them, each once, or none. No participant is ever in two meetings at once, since no two meetings overlap. A time block has none. |
| Singled out | A participant whose meetings stand out on the grid, every other booking faded, while chosen in the list above it. |
| Time block | A recurring time the Organizer is not available for meetings: teaching, a committee, research. No meeting can be booked in it. It has a title when the Organizer gives one, a cadence, a weekday, a start and a duration, and no note. |
| Title | What a booking is called, in the Organizer's words, without leading or trailing spaces: a meeting's is not empty; a time block may have none, and is then shown as *Time block*. Two bookings may have the same title. |
| Note | Free text the Organizer attaches to a meeting: a room, a link, the participants. The system never reads what it says. |
| Cadence | How often a booking recurs: weekly or bi-weekly. |
| Weekly | The cadence of a booking held in week A and in week B. |
| Bi-weekly | The cadence of a booking held in one week only: week A or week B, its week. |
| Week A, week B | The two abstract weeks the schedule is planned on, which alternate: A, B, A, B. They have no date: which week of the calendar is week A is the Organizer's to know. |
| Overview | Week A and week B merged, as one grid: what the two weeks hold, alternating, and the time they share. A booking added from it is held in both weeks. |
| Weekday | Monday, Tuesday, Wednesday, Thursday or Friday. |
| Day | The hours a booking can take on a weekday: from 08:00 to 18:00, configured in `config/calendar.json`. |
| Quarter | Fifteen minutes. Starts and durations are whole quarters. |
| Start | The time of day a booking begins: a quarter of the day, its end within the day. |
| Duration | How long a booking lasts: one quarter at least, ending at the end of the day at most. |
| Slot | A quarter of a weekday. On the overview, the slots a booking of week A and one of week B share are cut, together, along their diagonal: the upper left half for week A, the lower right half for week B. |
| Free, taken | A slot is taken in a week when a booking held that week covers it, and free otherwise. A weekly booking takes its slots in both weeks, a bi-weekly one in its week only. |
| Overlap | Two bookings that would take the same slot in the same week: two meetings, a meeting in a time block, or two time blocks. The system refuses an overlap, whatever makes it: adding, moving, resizing, changing a cadence or a week, or uploading a file. |
| Tab | One of the three grids the screen shows, one at a time: the overview, first, week A and week B. |
| Switch | What a press adds, on every tab: Meeting or Time block. It stands under the grid. |
| Lock | What keeps the schedule from every change, made by accident or not, until it is unlocked. The browser keeps it with the schedule. |
| Keep | What the browser does of the schedule, and of its lock: it holds them between two sessions, best effort, and gives them back when the page opens. |
| Schedule file | The schedule as a file of the Organizer's computer, downloaded and uploaded: see `schedule-file.md`. It is how a schedule is shared, never published. |
| Download | The system hands the schedule file to the browser, which writes it on the Organizer's computer, as it does a file downloaded. Nothing is sent over a network. |
| Upload | The Organizer hands a schedule file to the system, which reads it in the browser and takes it as the schedule. Nothing is sent over a network. |
| Refuse | The system does not take a change or a schedule file uploaded, says why, and keeps the schedule it has. |
