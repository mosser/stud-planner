# Stakeholders

## The one user

The system has exactly one user role: the **Organizer**, who holds recurring
meetings (with students, a team, a committee) and wants to see at a glance
how their odd week and their even week fill up. They
plan on their own computer, in their own browser. There is no participant
interface, no invitation and no shared calendar.

## Stakeholders

| Stakeholder | Kind | Interest in the system |
|---|---|---|
| Organizer | Direct | Places, moves, reshapes and removes recurring meetings on the odd and the even week; wants no time booked twice, and the schedule kept between sessions. |
| Participants | Indirect | The people the Organizer meets. Never use the system. Their names may appear in a meeting's title or note, which therefore never leave the Organizer's computer unless the Organizer saves the schedule file. |

## Project roles

| Role | Held by | Responsibility |
|---|---|---|
| Sponsor and subject matter expert | Sébastien Mosser | Decides what a schedule holds and how it is shown. |
| Engineer | Sébastien Mosser | Development, quality assurance and releases. |

Technical choices (language, framework, deployment) are the Engineer's to make
and are recorded in `docs/adr/`.
