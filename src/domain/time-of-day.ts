/** Fifteen minutes: starts and durations are whole quarters. */
export const minutesInAQuarter = 15

const minutesInADay = 24 * 60
const writtenTime = /^(\d{2}):(\d{2})$/

/** A time of day on a quarter, from midnight to the next midnight. */
export class TimeOfDay {
  /** The minutes since midnight. */
  readonly minutes: number

  /** Throws a RangeError for a time that is not a quarter of the day. */
  constructor(minutes: number) {
    const isAQuarter = Number.isInteger(minutes) && minutes % minutesInAQuarter === 0
    if (!isAQuarter || minutes < 0 || minutes > minutesInADay) {
      throw new RangeError(`${minutes} minutes after midnight is not a quarter of the day`)
    }
    this.minutes = minutes
  }

  /** The time written HH:MM, or absent when the text is not a quarter of the day. */
  static parse(text: string): TimeOfDay | undefined {
    const match = writtenTime.exec(text)
    if (match === null) {
      return undefined
    }
    const hours = Number(match[1])
    const minutes = Number(match[2])
    if (minutes >= 60) {
      return undefined
    }
    try {
      return new TimeOfDay(hours * 60 + minutes)
    } catch {
      return undefined
    }
  }

  /** The time so many quarters later, or earlier for a negative number. */
  afterQuarters(quarters: number): TimeOfDay {
    return new TimeOfDay(this.minutes + quarters * minutesInAQuarter)
  }

  /** How many quarters from this time to the other, negative when the other comes first. */
  quartersUntil(other: TimeOfDay): number {
    return (other.minutes - this.minutes) / minutesInAQuarter
  }

  /** Whether this time comes before the other. */
  isBefore(other: TimeOfDay): boolean {
    return this.minutes < other.minutes
  }

  /** Whether both are the same time. */
  equals(other: TimeOfDay): boolean {
    return this.minutes === other.minutes
  }

  /** The time as HH:MM. */
  toString(): string {
    const hours = String(Math.floor(this.minutes / 60)).padStart(2, '0')
    const minutes = String(this.minutes % 60).padStart(2, '0')
    return `${hours}:${minutes}`
  }
}
