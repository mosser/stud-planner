import { describe, expect, it } from 'vitest'
import { Cadence, Week } from './cadence.ts'
import { Weekday } from './weekday.ts'

describe('a cadence', () => {
  it('holds a weekly meeting in both weeks', () => {
    expect(Cadence.weekly.isWeekly).toBe(true)
    expect(Cadence.weekly.weeks).toEqual([Week.a, Week.b])
    expect(Cadence.weekly.key).toBe('weekly')
  })

  it('holds a bi-weekly meeting in its week week only', () => {
    const inWeekA = Cadence.biWeekly(Week.a)
    expect(inWeekA.isHeldIn(Week.a)).toBe(true)
    expect(inWeekA.isHeldIn(Week.b)).toBe(false)
    expect(inWeekA.key).toBe('bi-weekly')
    expect(Cadence.biWeekly(Week.a)).toBe(inWeekA)
    expect(Cadence.biWeekly(Week.b).weeks).toEqual([Week.b])
  })

  it('shares with another cadence the weeks both are held in', () => {
    const inWeekA = Cadence.biWeekly(Week.a)
    const inWeekB = Cadence.biWeekly(Week.b)
    expect(inWeekA.weeksSharedWith(inWeekB)).toEqual([])
    expect(inWeekA.weeksSharedWith(Cadence.weekly)).toEqual([Week.a])
    expect(Cadence.weekly.weeksSharedWith(Cadence.weekly)).toEqual(Week.all)
  })

  it('lists weekly, then bi-weekly in week A, then bi-weekly in week B', () => {
    expect(Cadence.all.map((cadence) => cadence.week)).toEqual([undefined, Week.a, Week.b])
  })
})

describe('a week and a weekday', () => {
  it('are found by the key the schedule file writes', () => {
    expect(Week.withKey('B')).toBe(Week.b)
    expect(Week.withKey('C')).toBeUndefined()
    expect(Week.a.name).toBe('week A')
    expect(Weekday.withKey('friday')).toBe(Weekday.friday)
    expect(Weekday.withKey('saturday')).toBeUndefined()
    expect(Weekday.all.map((weekday) => weekday.name).join(' ')).toBe(
      'Monday Tuesday Wednesday Thursday Friday',
    )
  })
})
