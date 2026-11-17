import { describe, expect, it } from 'vitest'
import { Duration } from './duration.ts'
import { TimeOfDay } from './time-of-day.ts'

describe('a time of day', () => {
  it('is a quarter of the day, written HH:MM', () => {
    expect(TimeOfDay.parse('09:45')?.toString()).toBe('09:45')
    expect(TimeOfDay.parse('00:00')?.minutes).toBe(0)
  })

  it('is not a time off the quarter, out of the day, or not written HH:MM', () => {
    expect(TimeOfDay.parse('09:10')).toBeUndefined()
    expect(TimeOfDay.parse('09:60')).toBeUndefined()
    expect(TimeOfDay.parse('25:00')).toBeUndefined()
    expect(TimeOfDay.parse('9:00')).toBeUndefined()
    expect(() => new TimeOfDay(-15)).toThrow(RangeError)
    expect(() => new TimeOfDay(10)).toThrow(RangeError)
  })

  it('counts quarters to another time, and moves by quarters', () => {
    const nine = new TimeOfDay(9 * 60)
    expect(nine.afterQuarters(3).toString()).toBe('09:45')
    expect(nine.afterQuarters(-4).toString()).toBe('08:00')
    expect(nine.quartersUntil(new TimeOfDay(10 * 60))).toBe(4)
    expect(nine.isBefore(nine.afterQuarters(1))).toBe(true)
    expect(nine.equals(new TimeOfDay(540))).toBe(true)
  })
})

describe('a duration', () => {
  it('is a whole number of quarters, one at least', () => {
    expect(Duration.ofQuarters(6).minutes).toBe(90)
    expect(new Duration(45).quarters).toBe(3)
    expect(new Duration(30).equals(Duration.ofQuarters(2))).toBe(true)
    expect(() => new Duration(0)).toThrow(RangeError)
    expect(() => new Duration(20)).toThrow(RangeError)
    expect(() => new Duration(22.5)).toThrow(RangeError)
  })
})
