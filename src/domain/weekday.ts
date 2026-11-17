/** Monday, Tuesday, Wednesday, Thursday or Friday. */
export class Weekday {
  static readonly monday = new Weekday('monday', 'Monday')
  static readonly tuesday = new Weekday('tuesday', 'Tuesday')
  static readonly wednesday = new Weekday('wednesday', 'Wednesday')
  static readonly thursday = new Weekday('thursday', 'Thursday')
  static readonly friday = new Weekday('friday', 'Friday')

  /** The weekdays, Monday first. */
  static readonly all: readonly Weekday[] = [
    Weekday.monday,
    Weekday.tuesday,
    Weekday.wednesday,
    Weekday.thursday,
    Weekday.friday,
  ]

  /** How the schedule file writes it: monday. */
  readonly key: string
  /** How the interface writes it: Monday. */
  readonly name: string

  private constructor(key: string, name: string) {
    this.key = key
    this.name = name
  }

  /** The weekday the schedule file writes so, or absent when it is none. */
  static withKey(key: string): Weekday | undefined {
    return Weekday.all.find((weekday) => weekday.key === key)
  }
}
