# Domain Model

The concepts a schedule is made of, and how they relate. The Organizer
changes them on the template weeks, the browser keeps them between two
sessions, and the schedule file carries them. A date of the real calendar
appears in one place only: the reference week, which ties the odd and even
weeks to the weeks of the year.

This file is also the **glossary**: a term below means one thing, everywhere,
in the specification, in the interface and in the code.

## Concepts

| Concept | Meaning |
|---|---|
| Organizer | The person who plans their recurring meetings, and the only user of the system. |
| Schedule | What the Organizer plans: the meetings and the reference week. There is one schedule at a time. |
| Meeting | A recurring meeting of the schedule: its title, its cadence, its weekday, its start, its duration, and its note when the Organizer gives one. A meeting has no date: it recurs for as long as it is in the schedule. |
| Title | What a meeting is called, in the Organizer's words: not empty, without leading or trailing spaces. Two meetings may have the same title. |
| Note | Free text the Organizer attaches to a meeting: a room, a link, the participants. The system never reads what it says. |
| Cadence | How often a meeting recurs: weekly, bi-weekly or monthly. |
| Weekly | The cadence of a meeting held every week, odd and even. |
| Bi-weekly | The cadence of a meeting held every other week: in the odd weeks or in the even weeks, its parity. |
| Monthly | The cadence of a meeting held once a month, on one weekday of the month given by its ordinal: the second Wednesday. |
| Parity | What a week is, odd or even, and what a bi-weekly meeting is held in. |
| Odd week, even week | The weeks alternate strictly, odd, even, odd, from the reference week, which is odd: a bi-weekly meeting is always fourteen days from the last, the turn of a year included. The parity of a week is not that of its ISO week number. |
| Reference week | A week of the real calendar, by its Monday, that the schedule takes as odd. When a schedule is started, it is the first ISO week of the current year; the Organizer changes it by saying whether this week is odd or even. Changing it moves no meeting. |
| This week | The week of today, and its parity, as the reference week makes it. |
| Ordinal | Which weekday of the month a monthly meeting is held on: first, second, third, fourth or last. There is no fifth: not every month has one. |
| Weekday | Monday, Tuesday, Wednesday, Thursday or Friday. |
| Day | The hours a meeting can take on a weekday: from 08:00 to 18:00, configured in `config/calendar.json`. |
| Quarter | Fifteen minutes. Starts and durations are whole quarters. |
| Start | The time of day a meeting begins: a quarter of the day, its end within the day. |
| Duration | How long a meeting lasts: one quarter at least, ending at the end of the day at most. |
| Template week | One of the three grids the schedule is shown on, each a weekday per column and a quarter per row: the **odd week** shows the weekly meetings and the bi-weekly meetings held in odd weeks; the **even week**, the weekly meetings and those held in even weeks; the **monthly week**, the monthly meetings, each marked with its ordinal. |
| Slot | A quarter of a weekday on a template week. |
| Clash | Two meetings that take the same time on the same weekday of some week. A clash is shown and listed, never refused. |
| Every week, every month, some months | How often a clash happens, by the cadences of the two meetings: see the table of clashes in `plan-the-meetings.md`. |
| Keep | What the browser does of the schedule: it holds it between two sessions, best effort, and gives it back when the page opens. |
| Schedule file | The schedule as a file of the Organizer's computer, saved and loaded: see `schedule-file.md`. |
| Save | The system hands the schedule file to the browser, which writes it on the Organizer's computer. Nothing is sent over a network. |
| Load | The Organizer hands a schedule file to the system, which reads it in the browser and takes it as the schedule. |
| Refuse | The system does not take a schedule file the Organizer loads, says why, and keeps the schedule it has. |
