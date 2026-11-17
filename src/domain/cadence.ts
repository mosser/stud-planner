/**
 * One of the two abstract weeks the schedule is planned on, A or B, which alternate: A, B, A, B.
 * A bi-weekly booking is held in one of them.
 */
export class Week {
  static readonly a = new Week('A')
  static readonly b = new Week('B')

  /** The two weeks, A first. */
  static readonly all: readonly Week[] = [Week.a, Week.b]

  /** How the schedule file writes it: A. */
  readonly key: string

  private constructor(key: string) {
    this.key = key
  }

  /** How the interface writes it: week A. */
  get name(): string {
    return `week ${this.key}`
  }

  /** The week the schedule file writes so, or absent when it is none. */
  static withKey(key: string): Week | undefined {
    return Week.all.find((week) => week.key === key)
  }
}

/** How often a booking recurs: weekly, in both weeks, or bi-weekly, in week A or in week B. */
export class Cadence {
  static readonly weekly = new Cadence(undefined)
  private static readonly biWeeklyInA = new Cadence(Week.a)
  private static readonly biWeeklyInB = new Cadence(Week.b)

  /** Every cadence: weekly, then bi-weekly in week A, then in week B. */
  static readonly all: readonly Cadence[] = [
    Cadence.weekly,
    Cadence.biWeeklyInA,
    Cadence.biWeeklyInB,
  ]

  /** The week a bi-weekly booking is held in; absent for a weekly booking. */
  readonly week: Week | undefined

  private constructor(week: Week | undefined) {
    this.week = week
  }

  /** The cadence of a booking held every other week, in that week. */
  static biWeekly(week: Week): Cadence {
    return week === Week.a ? Cadence.biWeeklyInA : Cadence.biWeeklyInB
  }

  /** Whether a booking of this cadence is held in both weeks. */
  get isWeekly(): boolean {
    return this.week === undefined
  }

  /** How the schedule file writes it: weekly or bi-weekly. */
  get key(): string {
    return this.isWeekly ? 'weekly' : 'bi-weekly'
  }

  /** The weeks a booking of this cadence is held in. */
  get weeks(): readonly Week[] {
    return this.week === undefined ? Week.all : [this.week]
  }

  /** Whether a booking of this cadence is held in that week. */
  isHeldIn(week: Week): boolean {
    return this.week === undefined || this.week === week
  }

  /** The weeks in which bookings of both cadences are held. */
  weeksSharedWith(other: Cadence): readonly Week[] {
    return this.weeks.filter((week) => other.isHeldIn(week))
  }
}
