import { describe, expect, it } from 'vitest'
import { Cadence, Week } from './cadence.ts'
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

  it('is confirmed unless the Organizer marks it tentative', () => {
    expect(aMeeting().isTentative).toBe(false)
    expect(aMeeting({ isTentative: true }).isTentative).toBe(true)
    expect(aMeeting({ isTentative: true }).afterChanging({ isTentative: false }).isTentative).toBe(
      false,
    )
  })

  it('takes its slots when tentative, as any meeting does', () => {
    expect(aMeeting({ isTentative: true }).overlaps(aMeeting({ start: at('10:30') }))).toBe(true)
  })

  it('fits within the day', () => {
    expect(aMeeting({ start: at('17:00'), duration: Duration.ofQuarters(4) }).end.toString()).toBe(
      '18:00',
    )
    expect(() => aMeeting({ start: at('17:15') })).toThrow('A meeting cannot end after 18:00.')
    expect(() => aMeeting({ start: at('07:45') })).toThrow('A meeting cannot start before 08:00.')
  })

  it('is held in both weeks when weekly, in its week week when bi-weekly', () => {
    const inWeekA = aMeeting({ cadence: Cadence.biWeekly(Week.a) })
    expect(aMeeting().isHeldIn(Week.b)).toBe(true)
    expect(inWeekA.isHeldIn(Week.a)).toBe(true)
    expect(inWeekA.isHeldIn(Week.b)).toBe(false)
  })

  it('takes the quarters from its start to its end, on its weekday, in its weeks', () => {
    const inWeekA = aMeeting({ cadence: Cadence.biWeekly(Week.a) })
    expect(inWeekA.takes(Weekday.monday, at('10:00'), Week.a)).toBe(true)
    expect(inWeekA.takes(Weekday.monday, at('10:45'), Week.a)).toBe(true)
    expect(inWeekA.takes(Weekday.monday, at('11:00'), Week.a)).toBe(false)
    expect(inWeekA.takes(Weekday.monday, at('09:45'), Week.a)).toBe(false)
    expect(inWeekA.takes(Weekday.monday, at('10:00'), Week.b)).toBe(false)
    expect(inWeekA.takes(Weekday.tuesday, at('10:00'), Week.a)).toBe(false)
  })

  it('overlaps another on the same weekday, in a week in common, at times that overlap', () => {
    const lab = aMeeting()
    expect(lab.overlaps(aMeeting({ start: at('10:45') }))).toBe(true)
    expect(lab.overlaps(aMeeting({ cadence: Cadence.biWeekly(Week.b) }))).toBe(true)
    expect(lab.overlaps(aMeeting({ weekday: Weekday.tuesday }))).toBe(false)
  })

  it('does not overlap one that ends as it starts, nor one held in the other week', () => {
    const inWeekA = aMeeting({ cadence: Cadence.biWeekly(Week.a) })
    expect(inWeekA.overlaps(aMeeting({ start: at('11:00') }))).toBe(false)
    expect(inWeekA.overlaps(aMeeting({ start: at('09:00') }))).toBe(false)
    expect(inWeekA.overlaps(aMeeting({ cadence: Cadence.biWeekly(Week.b) }))).toBe(false)
  })

  it('moves and resizes as a copy, keeping the rest', () => {
    const lab = aMeeting({ note: 'Room 201', isTentative: true })
    const moved = lab.afterMovingTo(Weekday.friday, at('14:00'))
    expect([moved.weekday, moved.start.toString(), moved.duration.quarters]).toEqual([
      Weekday.friday,
      '14:00',
      4,
    ])
    expect(moved.note).toBe('Room 201')
    expect(moved.isTentative).toBe(true)
    expect(lab.afterResizingTo(Duration.ofQuarters(2)).isTentative).toBe(true)
    expect(lab.afterResizingTo(Duration.ofQuarters(2)).end.toString()).toBe('10:30')
    expect(lab.weekday).toBe(Weekday.monday)
    expect(() => lab.afterResizingTo(Duration.ofQuarters(40))).toThrow(RangeError)
  })
})
