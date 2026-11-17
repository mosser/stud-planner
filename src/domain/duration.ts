import { minutesInAQuarter } from './time-of-day.ts'

/** How long a meeting lasts: one quarter at least, in whole quarters. */
export class Duration {
  /** The minutes it lasts. */
  readonly minutes: number

  /** Throws a RangeError for a duration that is not a whole number of quarters, one at least. */
  constructor(minutes: number) {
    if (!Number.isInteger(minutes) || minutes < minutesInAQuarter || minutes % minutesInAQuarter) {
      throw new RangeError(`${minutes} minutes is not a whole number of quarters`)
    }
    this.minutes = minutes
  }

  /** The duration of so many quarters. */
  static ofQuarters(quarters: number): Duration {
    return new Duration(quarters * minutesInAQuarter)
  }

  /** The number of quarters it lasts. */
  get quarters(): number {
    return this.minutes / minutesInAQuarter
  }

  /** Whether both last as long. */
  equals(other: Duration): boolean {
    return this.minutes === other.minutes
  }
}
