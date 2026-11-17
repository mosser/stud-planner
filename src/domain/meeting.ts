import type { Cadence, Parity } from './cadence.ts'
import { theDay } from './day.ts'
import type { Duration } from './duration.ts'
import { endsAfterTheDay, needsATitle, startsBeforeTheDay } from './findings.ts'
import type { TimeOfDay } from './time-of-day.ts'
import type { Weekday } from './weekday.ts'

/** What makes a meeting: what the Organizer gives, and what the schedule file holds. */
export interface MeetingDescription {
  readonly title: string
  readonly cadence: Cadence
  readonly weekday: Weekday
  readonly start: TimeOfDay
  readonly duration: Duration
  readonly note?: string | undefined
}

/** A recurring meeting of the schedule, held for as long as it is in it. */
export class Meeting implements MeetingDescription {
  /** What the meeting is called: not empty, without leading or trailing spaces. */
  readonly title: string
  /** Weekly, or bi-weekly in the odd or the even week. */
  readonly cadence: Cadence
  readonly weekday: Weekday
  /** When it begins, within the day. */
  readonly start: TimeOfDay
  /** How long it lasts, ending within the day. */
  readonly duration: Duration
  /** Free text, never read by the system; absent when there is none. */
  readonly note: string | undefined

  /**
   * Throws a RangeError for a meeting without a title, or that does not fit within the day. The
   * title and the note are taken without their leading and trailing spaces; an empty note is none.
   */
  constructor(description: MeetingDescription) {
    const title = description.title.trim()
    if (title === '') {
      throw new RangeError(needsATitle())
    }
    if (description.start.isBefore(theDay.start)) {
      throw new RangeError(startsBeforeTheDay(theDay.start))
    }
    const end = description.start.afterQuarters(description.duration.quarters)
    if (theDay.end.isBefore(end)) {
      throw new RangeError(endsAfterTheDay(theDay.end))
    }
    const note = description.note?.trim()
    this.title = title
    this.cadence = description.cadence
    this.weekday = description.weekday
    this.start = description.start
    this.duration = description.duration
    this.note = note === '' ? undefined : note
  }

  /** When the meeting ends. */
  get end(): TimeOfDay {
    return this.start.afterQuarters(this.duration.quarters)
  }

  /** Whether the meeting is held in the week of that parity. */
  isHeldIn(parity: Parity): boolean {
    return this.cadence.isHeldIn(parity)
  }

  /** Whether the meeting takes the quarter starting at that time, on that weekday, in that week. */
  takes(weekday: Weekday, time: TimeOfDay, parity: Parity): boolean {
    return (
      this.weekday === weekday &&
      this.isHeldIn(parity) &&
      !time.isBefore(this.start) &&
      time.isBefore(this.end)
    )
  }

  /**
   * Whether both meetings would take the same slot in the same week: the same weekday, a week in
   * common, and times that overlap. One ending as the other starts does not overlap it.
   */
  overlaps(other: Meeting): boolean {
    return (
      this.weekday === other.weekday &&
      this.weeksSharedWith(other).length > 0 &&
      this.start.isBefore(other.end) &&
      other.start.isBefore(this.end)
    )
  }

  /** The weeks in which both meetings are held. */
  weeksSharedWith(other: Meeting): readonly Parity[] {
    return this.cadence.weeksSharedWith(other.cadence)
  }

  /** The same meeting, changed as said. */
  afterChanging(changes: Partial<MeetingDescription>): Meeting {
    return new Meeting({ ...this.description, ...changes })
  }

  /** The same meeting, on another weekday and at another start, lasting as long. */
  afterMovingTo(weekday: Weekday, start: TimeOfDay): Meeting {
    return this.afterChanging({ weekday, start })
  }

  /** The same meeting, starting as it does and lasting that long. */
  afterResizingTo(duration: Duration): Meeting {
    return this.afterChanging({ duration })
  }

  /** What makes this meeting. */
  get description(): MeetingDescription {
    return {
      title: this.title,
      cadence: this.cadence,
      weekday: this.weekday,
      start: this.start,
      duration: this.duration,
      note: this.note,
    }
  }
}
