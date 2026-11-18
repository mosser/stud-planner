import type { Week } from './cadence.ts'
import type { Weekday } from './weekday.ts'

/** Where the Organizer is on a day: on campus, or remote. */
export class Presence {
  static readonly onCampus = new Presence('on-campus', 'On campus')
  static readonly remote = new Presence('remote', 'Remote')

  /** Both, on campus first. */
  static readonly all: readonly Presence[] = [Presence.onCampus, Presence.remote]

  /** How the schedule file writes it: on-campus or remote. */
  readonly key: string
  /** How the interface writes it: On campus. */
  readonly name: string

  private constructor(key: string, name: string) {
    this.key = key
    this.name = name
  }

  /** The presence the schedule file writes so, or absent when it is none. */
  static withKey(key: string): Presence | undefined {
    return Presence.all.find((presence) => presence.key === key)
  }
}

/** A day of a week, week A or week B, and where the Organizer is on it. */
export interface DayPresence {
  readonly week: Week
  readonly weekday: Weekday
  readonly presence: Presence
}
