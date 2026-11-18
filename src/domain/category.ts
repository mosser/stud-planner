import categories from '../../config/categories.json' with { type: 'json' }

/** What a meeting is about, among the categories `config/categories.json` lists: PhD, Lab. */
export class Category {
  /** Its name, as the interface and the schedule file write it. */
  readonly name: string

  private constructor(name: string) {
    this.name = name
  }

  /**
   * The categories a configuration lists, in its order: an array of names, not empty, each a
   * text with a letter, no two alike whatever their case. Throws a TypeError otherwise.
   */
  static listedIn(configuration: unknown): readonly Category[] {
    const isList =
      Array.isArray(configuration) &&
      configuration.length > 0 &&
      configuration.every((name) => typeof name === 'string' && name.trim() !== '')
    if (!isList) {
      throw new TypeError('config/categories.json must list the names of the categories')
    }
    const names = (configuration as string[]).map((name) => name.trim())
    const lowered = names.map((name) => name.toLocaleLowerCase())
    if (new Set(lowered).size !== names.length) {
      throw new TypeError('config/categories.json must not list a category twice')
    }
    return names.map((name) => new Category(name))
  }

  /** Every category of the system, in the order configured. */
  static readonly all: readonly Category[] = Category.listedIn(categories)

  /** The category of that name, whatever its case; absent when there is none. */
  static named(name: string): Category | undefined {
    const lowered = name.trim().toLocaleLowerCase()
    return Category.all.find((category) => category.name.toLocaleLowerCase() === lowered)
  }
}
