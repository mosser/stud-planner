import { Cadence } from './cadence.ts'
import { Duration } from './duration.ts'
import { Meeting, type MeetingDescription } from './meeting.ts'
import { TimeOfDay } from './time-of-day.ts'
import { Weekday } from './weekday.ts'

/** The time written HH:MM; throws for a text that is not one. */
export function at(text: string): TimeOfDay {
  const time = TimeOfDay.parse(text)
  if (time === undefined) {
    throw new RangeError(`${text} is not a time of day`)
  }
  return time
}

/** A meeting on Monday from 10:00 to 11:00, weekly, called Lab meeting, unless told otherwise. */
export function aMeeting(changes: Partial<MeetingDescription> = {}): Meeting {
  return new Meeting({
    title: 'Lab meeting',
    cadence: Cadence.weekly,
    weekday: Weekday.monday,
    start: at('10:00'),
    duration: Duration.ofQuarters(4),
    ...changes,
  })
}
