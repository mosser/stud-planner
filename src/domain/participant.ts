import { needsAName } from './findings.ts'

/**
 * A person the Organizer meets: a student, a co-supervisor. A participant of the schedule, known
 * by a name no other participant of the schedule has, and taking part in some of its meetings.
 */
export class Participant {
  /** Their name, in the Organizer's words: not empty, without leading or trailing spaces. */
  readonly name: string

  /** Throws a RangeError for a participant without a name. */
  constructor(name: string) {
    const trimmed = name.trim()
    if (trimmed === '') {
      throw new RangeError(needsAName())
    }
    this.name = trimmed
  }

  /** Whether the participant has that name, whatever its case: two such cannot be told apart. */
  isNamed(name: string): boolean {
    return this.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase()
  }
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base' })

/** The participants by name, A to Z, whatever the case and the accents: Ana, Émile, Zoé. */
export function byName<T extends { readonly name: string }>(participants: readonly T[]): T[] {
  return [...participants].sort((one, other) => collator.compare(one.name, other.name))
}
