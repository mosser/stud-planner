import categories from '../../config/categories.json' with { type: 'json' }

const kinds = ['one-to-one', 'titled']

/**
 * What a meeting is about, among the categories `config/categories.json` lists: PhD, Lab. A
 * one-to-one category (Master, PhD) is a meeting with a student, named after them; a titled one
 * (Project, Lab) has a title of its own.
 */
export class Category {
  /** Its name, as the interface and the schedule file write it. */
  readonly name: string
  /** Whether a meeting of this category is with one student, named after them. */
  readonly isOneToOne: boolean

  private constructor(name: string, isOneToOne: boolean) {
    this.name = name
    this.isOneToOne = isOneToOne
  }

  /**
   * The categories a configuration lists, in its order: an array, not empty, of `{ name, kind }`,
   * each name a text with a letter, no two alike whatever their case, each kind `one-to-one` or
   * `titled`. Throws a TypeError otherwise.
   */
  static listedIn(configuration: unknown): readonly Category[] {
    const isList =
      Array.isArray(configuration) &&
      configuration.length > 0 &&
      configuration.every(
        (entry) =>
          typeof entry === 'object' &&
          entry !== null &&
          typeof entry.name === 'string' &&
          entry.name.trim() !== '' &&
          kinds.includes(entry.kind),
      )
    if (!isList) {
      throw new TypeError(
        'config/categories.json must list categories as { "name", "kind": "one-to-one" or "titled" }',
      )
    }
    const entries = configuration as { name: string; kind: string }[]
    const lowered = entries.map((entry) => entry.name.trim().toLocaleLowerCase())
    if (new Set(lowered).size !== entries.length) {
      throw new TypeError('config/categories.json must not list a category twice')
    }
    return entries.map((entry) => new Category(entry.name.trim(), entry.kind === 'one-to-one'))
  }

  /** Every category of the system, in the order configured. */
  static readonly all: readonly Category[] = Category.listedIn(categories)

  /** The category of that name, whatever its case; absent when there is none. */
  static named(name: string): Category | undefined {
    const lowered = name.trim().toLocaleLowerCase()
    return Category.all.find((category) => category.name.toLocaleLowerCase() === lowered)
  }
}
