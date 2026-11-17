import calendar from '../../config/calendar.json'
import { TimeOfDay } from './time-of-day.ts'

/** The hours a meeting can take on a weekday, configured in `config/calendar.json`. */
export class Day {
  /** When the first meeting can start. */
  readonly start: TimeOfDay
  /** When the last meeting must have ended. */
  readonly end: TimeOfDay

  /** Throws a RangeError when the day does not end after it starts. */
  constructor(start: TimeOfDay, end: TimeOfDay) {
    if (!start.isBefore(end)) {
      throw new RangeError(`A day cannot end at ${end}, at or before its start at ${start}`)
    }
    this.start = start
    this.end = end
  }

  /**
   * The day `config/calendar.json` configures: `dayStartsAt` and `dayEndsAt`, each a quarter
   * written HH:MM. Throws a TypeError for a file that does not hold them.
   */
  static from(configuration: unknown): Day {
    const { dayStartsAt, dayEndsAt } = (configuration ?? {}) as Record<string, unknown>
    const start = typeof dayStartsAt === 'string' ? TimeOfDay.parse(dayStartsAt) : undefined
    const end = typeof dayEndsAt === 'string' ? TimeOfDay.parse(dayEndsAt) : undefined
    if (start === undefined || end === undefined) {
      throw new TypeError('config/calendar.json must give dayStartsAt and dayEndsAt as HH:MM')
    }
    return new Day(start, end)
  }

  /** The number of quarters in the day. */
  get quarterCount(): number {
    return this.start.quartersUntil(this.end)
  }

  /** The start of each quarter of the day, the first first. */
  get quarters(): readonly TimeOfDay[] {
    return Array.from({ length: this.quarterCount }, (_unused, index) =>
      this.start.afterQuarters(index),
    )
  }

  /** The rank of the quarter starting at that time, the first quarter of the day being 0. */
  quarterAt(time: TimeOfDay): number {
    return this.start.quartersUntil(time)
  }

  /** The time the quarter of that rank starts at. */
  timeOfQuarter(quarter: number): TimeOfDay {
    return this.start.afterQuarters(quarter)
  }
}

/** The day of the system. */
export const theDay = Day.from(calendar)
