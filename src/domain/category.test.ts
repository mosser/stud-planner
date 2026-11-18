import { describe, expect, it } from 'vitest'
import { Category } from './category.ts'
import { aMeeting } from './meeting.fixture.ts'

describe('the categories', () => {
  it('are configured in config/categories.json: Master, PhD, Project and Lab', () => {
    expect(Category.all.map((category) => category.name)).toEqual([
      'Master',
      'PhD',
      'Project',
      'Lab',
    ])
  })

  it('are found by name, whatever its case', () => {
    expect(Category.named(' phd')).toBe(Category.all[1])
    expect(Category.named('Course')).toBeUndefined()
  })

  it('are one-to-one, Master and PhD, or titled, Project and Lab', () => {
    expect(Category.all.map((category) => category.isOneToOne)).toEqual([true, true, false, false])
  })

  it('are a list of names and kinds, not empty, no two alike', () => {
    const listed = Category.listedIn([
      { name: ' A ', kind: 'one-to-one' },
      { name: 'B', kind: 'titled' },
    ])
    expect(listed.map((category) => [category.name, category.isOneToOne])).toEqual([
      ['A', true],
      ['B', false],
    ])
    expect(() => Category.listedIn([])).toThrow(TypeError)
    expect(() => Category.listedIn([{ name: '  ', kind: 'titled' }])).toThrow(TypeError)
    expect(() => Category.listedIn([{ name: 'A', kind: 'group' }])).toThrow(TypeError)
    expect(() =>
      Category.listedIn([
        { name: 'A', kind: 'titled' },
        { name: 'a', kind: 'titled' },
      ]),
    ).toThrow(TypeError)
    expect(() => Category.listedIn(['A'])).toThrow(TypeError)
  })

  it('give a meeting what it is about, kept when it moves', () => {
    const lab = Category.named('Lab')
    expect(aMeeting().category).toBeUndefined()
    const meeting = aMeeting({ category: lab })
    expect(meeting.category).toBe(lab)
    expect(meeting.afterResizingTo(meeting.duration).category).toBe(lab)
  })
})
