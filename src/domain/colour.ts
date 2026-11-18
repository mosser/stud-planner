/**
 * What a time block is filled with: grey unless the Organizer chooses another colour of the
 * palette. None is a colour of a cadence, which colours the meetings.
 */
export class Colour {
  static readonly grey = new Colour('grey', 'Grey')
  static readonly pink = new Colour('pink', 'Pink')
  static readonly lime = new Colour('lime', 'Lime')
  static readonly purple = new Colour('purple', 'Purple')

  /** Every colour a time block may have, grey first, the colour it has unless chosen. */
  static readonly all: readonly Colour[] = [Colour.grey, Colour.pink, Colour.lime, Colour.purple]

  /** How the schedule file and the style sheet write it: grey, pink, lime or purple. */
  readonly key: string
  /** How the interface writes it: Grey. */
  readonly name: string

  private constructor(key: string, name: string) {
    this.key = key
    this.name = name
  }

  /** The colour the schedule file writes so, or absent when it is none. */
  static withKey(key: string): Colour | undefined {
    return Colour.all.find((colour) => colour.key === key)
  }
}
