import { describe, expect, it } from 'vitest'
import { Cadence, Parity } from './cadence.ts'
import { Weekday } from './weekday.ts'

describe('a cadence', () => {
  it('holds a weekly meeting in both weeks', () => {
    expect(Cadence.weekly.isWeekly).toBe(true)
    expect(Cadence.weekly.weeks).toEqual([Parity.odd, Parity.even])
    expect(Cadence.weekly.key).toBe('weekly')
  })

  it('holds a bi-weekly meeting in its parity week only', () => {
    const odd = Cadence.biWeekly(Parity.odd)
    expect(odd.isHeldIn(Parity.odd)).toBe(true)
    expect(odd.isHeldIn(Parity.even)).toBe(false)
    expect(odd.key).toBe('bi-weekly')
    expect(Cadence.biWeekly(Parity.odd)).toBe(odd)
    expect(Cadence.biWeekly(Parity.even).weeks).toEqual([Parity.even])
  })

  it('shares with another cadence the weeks both are held in', () => {
    const odd = Cadence.biWeekly(Parity.odd)
    const even = Cadence.biWeekly(Parity.even)
    expect(odd.weeksSharedWith(even)).toEqual([])
    expect(odd.weeksSharedWith(Cadence.weekly)).toEqual([Parity.odd])
    expect(Cadence.weekly.weeksSharedWith(Cadence.weekly)).toEqual(Parity.all)
  })

  it('lists weekly, then bi-weekly odd, then bi-weekly even', () => {
    expect(Cadence.all.map((cadence) => cadence.parity)).toEqual([
      undefined,
      Parity.odd,
      Parity.even,
    ])
  })
})

describe('a parity and a weekday', () => {
  it('are found by the key the schedule file writes', () => {
    expect(Parity.withKey('even')).toBe(Parity.even)
    expect(Parity.withKey('third')).toBeUndefined()
    expect(Weekday.withKey('friday')).toBe(Weekday.friday)
    expect(Weekday.withKey('saturday')).toBeUndefined()
    expect(Weekday.all.map((weekday) => weekday.name).join(' ')).toBe(
      'Monday Tuesday Wednesday Thursday Friday',
    )
  })
})
