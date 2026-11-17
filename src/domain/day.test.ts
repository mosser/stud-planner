import { describe, expect, it } from 'vitest'
import { Day, theDay } from './day.ts'
import { TimeOfDay } from './time-of-day.ts'

describe('the day', () => {
  it('is configured in config/calendar.json, from 08:00 to 18:00', () => {
    expect(theDay.start.toString()).toBe('08:00')
    expect(theDay.end.toString()).toBe('18:00')
    expect(theDay.quarterCount).toBe(40)
  })

  it('lists its quarters, and ranks them from 0', () => {
    const day = Day.from({ dayStartsAt: '09:00', dayEndsAt: '10:00' })
    expect(day.quarters.map(String)).toEqual(['09:00', '09:15', '09:30', '09:45'])
    expect(day.quarterAt(new TimeOfDay(9 * 60 + 30))).toBe(2)
    expect(day.timeOfQuarter(3).toString()).toBe('09:45')
  })

  it('ends after it starts', () => {
    expect(() => Day.from({ dayStartsAt: '10:00', dayEndsAt: '10:00' })).toThrow(RangeError)
  })

  it('is refused when the configuration does not give its hours as HH:MM', () => {
    expect(() => Day.from({ dayStartsAt: '8:00', dayEndsAt: '18:00' })).toThrow(TypeError)
    expect(() => Day.from({ dayStartsAt: '08:00' })).toThrow(TypeError)
    expect(() => Day.from(undefined)).toThrow(TypeError)
  })
})
