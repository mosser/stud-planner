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

  it('are a list of names, not empty, no two alike', () => {
    expect(Category.listedIn([' A ', 'B']).map((category) => category.name)).toEqual(['A', 'B'])
    expect(() => Category.listedIn([])).toThrow(TypeError)
    expect(() => Category.listedIn(['A', '  '])).toThrow(TypeError)
    expect(() => Category.listedIn(['A', 'a'])).toThrow(TypeError)
    expect(() => Category.listedIn({ A: 1 })).toThrow(TypeError)
  })

  it('give a meeting what it is about, kept when it moves', () => {
    const phd = Category.named('PhD')
    expect(aMeeting().category).toBeUndefined()
    const meeting = aMeeting({ category: phd })
    expect(meeting.category).toBe(phd)
    expect(meeting.afterResizingTo(meeting.duration).category).toBe(phd)
  })
})
