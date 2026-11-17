import type { Cadence, Week } from './cadence.ts'
import { theDay } from './day.ts'
import type { Duration } from './duration.ts'
import { endsAfterTheDay, startsBeforeTheDay } from './findings.ts'
import type { TimeOfDay } from './time-of-day.ts'
import type { Weekday } from './weekday.ts'

/** When a booking takes its slots: its cadence, its weekday, its start and its duration. */
export interface Timing {
  readonly cadence: Cadence
  readonly weekday: Weekday
  readonly start: TimeOfDay
  readonly duration: Duration
}

/**
 * What takes slots of the schedule: a meeting, or a time block. No two bookings of a schedule
 * overlap (ADR 0009).
 */
export abstract class Booking implements Timing {
  /** Weekly, or bi-weekly in week A or in week B. */
  readonly cadence: Cadence
  readonly weekday: Weekday
  /** When it begins, within the day. */
  readonly start: TimeOfDay
  /** How long it lasts, ending within the day. */
  readonly duration: Duration
  /** Whether it is a time block, rather than a meeting. */
  readonly isTimeBlock: boolean

  /** Throws a RangeError for a booking that does not fit within the day. */
  protected constructor(timing: Timing, isTimeBlock: boolean) {
    if (timing.start.isBefore(theDay.start)) {
      throw new RangeError(startsBeforeTheDay(isTimeBlock, theDay.start))
    }
    const end = timing.start.afterQuarters(timing.duration.quarters)
    if (theDay.end.isBefore(end)) {
      throw new RangeError(endsAfterTheDay(isTimeBlock, theDay.end))
    }
    this.cadence = timing.cadence
    this.weekday = timing.weekday
    this.start = timing.start
    this.duration = timing.duration
    this.isTimeBlock = isTimeBlock
  }

  /** What the booking is called; a time block may have no title. */
  abstract readonly title: string | undefined

  /** The same booking, changed as said. */
  abstract afterChanging(changes: Partial<Timing>): Booking

  /** When the booking ends. */
  get end(): TimeOfDay {
    return this.start.afterQuarters(this.duration.quarters)
  }

  /** Whether the booking is held in the week of that week. */
  isHeldIn(week: Week): boolean {
    return this.cadence.isHeldIn(week)
  }

  /** Whether the booking takes the quarter starting at that time, on that weekday, in that week. */
  takes(weekday: Weekday, time: TimeOfDay, week: Week): boolean {
    return (
      this.weekday === weekday &&
      this.isHeldIn(week) &&
      !time.isBefore(this.start) &&
      time.isBefore(this.end)
    )
  }

  /**
   * Whether both bookings would take the same slot in the same week: the same weekday, a week in
   * common, and times that overlap. One ending as the other starts does not overlap it.
   */
  overlaps(other: Booking): boolean {
    return (
      this.weekday === other.weekday &&
      this.weeksSharedWith(other).length > 0 &&
      this.start.isBefore(other.end) &&
      other.start.isBefore(this.end)
    )
  }

  /** The weeks in which both bookings are held. */
  weeksSharedWith(other: Booking): readonly Week[] {
    return this.cadence.weeksSharedWith(other.cadence)
  }

  /** The same booking, on another weekday and at another start, lasting as long. */
  afterMovingTo(weekday: Weekday, start: TimeOfDay): Booking {
    return this.afterChanging({ weekday, start })
  }

  /** The same booking, starting as it does and lasting that long. */
  afterResizingTo(duration: Duration): Booking {
    return this.afterChanging({ duration })
  }

  /** When this booking takes its slots. */
  get timing(): Timing {
    return {
      cadence: this.cadence,
      weekday: this.weekday,
      start: this.start,
      duration: this.duration,
    }
  }
}
