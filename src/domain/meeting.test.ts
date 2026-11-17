import { describe, expect, it } from 'vitest'
import { Cadence, Parity } from './cadence.ts'
import { Duration } from './duration.ts'
import { aMeeting, at } from './meeting.fixture.ts'
import { Weekday } from './weekday.ts'

describe('a meeting', () => {
  it('has a title, without leading or trailing spaces', () => {
    expect(aMeeting({ title: '  Ana  ' }).title).toBe('Ana')
    expect(() => aMeeting({ title: '   ' })).toThrow('A meeting needs a title.')
  })

  it('has a note only when the Organizer gives one', () => {
    expect(aMeeting({ note: ' Room 201 ' }).note).toBe('Room 201')
    expect(aMeeting({ note: '  ' }).note).toBeUndefined()
    expect(aMeeting().note).toBeUndefined()
  })

  it('fits within the day', () => {
    expect(aMeeting({ start: at('17:00'), duration: Duration.ofQuarters(4) }).end.toString()).toBe(
      '18:00',
    )
    expect(() => aMeeting({ start: at('17:15') })).toThrow('A meeting cannot end after 18:00.')
    expect(() => aMeeting({ start: at('07:45') })).toThrow('A meeting cannot start before 08:00.')
  })

  it('is held in both weeks when weekly, in its parity week when bi-weekly', () => {
    const odd = aMeeting({ cadence: Cadence.biWeekly(Parity.odd) })
    expect(aMeeting().isHeldIn(Parity.even)).toBe(true)
    expect(odd.isHeldIn(Parity.odd)).toBe(true)
    expect(odd.isHeldIn(Parity.even)).toBe(false)
  })

  it('takes the quarters from its start to its end, on its weekday, in its weeks', () => {
    const odd = aMeeting({ cadence: Cadence.biWeekly(Parity.odd) })
    expect(odd.takes(Weekday.monday, at('10:00'), Parity.odd)).toBe(true)
    expect(odd.takes(Weekday.monday, at('10:45'), Parity.odd)).toBe(true)
    expect(odd.takes(Weekday.monday, at('11:00'), Parity.odd)).toBe(false)
    expect(odd.takes(Weekday.monday, at('09:45'), Parity.odd)).toBe(false)
    expect(odd.takes(Weekday.monday, at('10:00'), Parity.even)).toBe(false)
    expect(odd.takes(Weekday.tuesday, at('10:00'), Parity.odd)).toBe(false)
  })

  it('overlaps another on the same weekday, in a week in common, at times that overlap', () => {
    const lab = aMeeting()
    expect(lab.overlaps(aMeeting({ start: at('10:45') }))).toBe(true)
    expect(lab.overlaps(aMeeting({ cadence: Cadence.biWeekly(Parity.even) }))).toBe(true)
    expect(lab.overlaps(aMeeting({ weekday: Weekday.tuesday }))).toBe(false)
  })

  it('does not overlap one that ends as it starts, nor one held in the other week', () => {
    const odd = aMeeting({ cadence: Cadence.biWeekly(Parity.odd) })
    expect(odd.overlaps(aMeeting({ start: at('11:00') }))).toBe(false)
    expect(odd.overlaps(aMeeting({ start: at('09:00') }))).toBe(false)
    expect(odd.overlaps(aMeeting({ cadence: Cadence.biWeekly(Parity.even) }))).toBe(false)
  })

  it('moves and resizes as a copy, keeping the rest', () => {
    const lab = aMeeting({ note: 'Room 201' })
    const moved = lab.afterMovingTo(Weekday.friday, at('14:00'))
    expect([moved.weekday, moved.start.toString(), moved.duration.quarters]).toEqual([
      Weekday.friday,
      '14:00',
      4,
    ])
    expect(moved.note).toBe('Room 201')
    expect(lab.afterResizingTo(Duration.ofQuarters(2)).end.toString()).toBe('10:30')
    expect(lab.weekday).toBe(Weekday.monday)
    expect(() => lab.afterResizingTo(Duration.ofQuarters(40))).toThrow(RangeError)
  })
})
