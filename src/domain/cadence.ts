/** Which of the two weeks a bi-weekly meeting is held in: odd or even. */
export class Parity {
  static readonly odd = new Parity('odd', 'odd week')
  static readonly even = new Parity('even', 'even week')

  /** The two weeks, odd first. */
  static readonly all: readonly Parity[] = [Parity.odd, Parity.even]

  /** How the schedule file writes it: odd. */
  readonly key: string
  /** How the interface writes the week: odd week. */
  readonly week: string

  private constructor(key: string, week: string) {
    this.key = key
    this.week = week
  }

  /** The parity the schedule file writes so, or absent when it is none. */
  static withKey(key: string): Parity | undefined {
    return Parity.all.find((parity) => parity.key === key)
  }
}

/** How often a meeting recurs: weekly, in both weeks, or bi-weekly, in its parity's week. */
export class Cadence {
  static readonly weekly = new Cadence(undefined)
  private static readonly biWeeklyInOdd = new Cadence(Parity.odd)
  private static readonly biWeeklyInEven = new Cadence(Parity.even)

  /** Every cadence: weekly, then bi-weekly in the odd week, then in the even week. */
  static readonly all: readonly Cadence[] = [
    Cadence.weekly,
    Cadence.biWeeklyInOdd,
    Cadence.biWeeklyInEven,
  ]

  /** The week a bi-weekly meeting is held in; absent for a weekly meeting. */
  readonly parity: Parity | undefined

  private constructor(parity: Parity | undefined) {
    this.parity = parity
  }

  /** The cadence of a meeting held every other week, in the week of that parity. */
  static biWeekly(parity: Parity): Cadence {
    return parity === Parity.odd ? Cadence.biWeeklyInOdd : Cadence.biWeeklyInEven
  }

  /** Whether a meeting of this cadence is held in both weeks. */
  get isWeekly(): boolean {
    return this.parity === undefined
  }

  /** How the schedule file writes it: weekly or bi-weekly. */
  get key(): string {
    return this.isWeekly ? 'weekly' : 'bi-weekly'
  }

  /** The weeks a meeting of this cadence is held in. */
  get weeks(): readonly Parity[] {
    return this.parity === undefined ? Parity.all : [this.parity]
  }

  /** Whether a meeting of this cadence is held in the week of that parity. */
  isHeldIn(parity: Parity): boolean {
    return this.parity === undefined || this.parity === parity
  }

  /** The weeks in which meetings of both cadences are held. */
  weeksSharedWith(other: Cadence): readonly Parity[] {
    return this.weeks.filter((parity) => other.isHeldIn(parity))
  }
}
