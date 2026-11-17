import { describe, expect, it } from 'vitest'
import { Cadence, Week } from './cadence.ts'
import { aMeeting, at } from './meeting.fixture.ts'
import { OverlapError, Schedule } from './schedule.ts'
import { Weekday } from './weekday.ts'

const inWeekA = Cadence.biWeekly(Week.a)
const inWeekB = Cadence.biWeekly(Week.b)

describe('a schedule', () => {
  it('starts with no meeting', () => {
    expect(new Schedule().isEmpty).toBe(true)
  })

  it('never holds two meetings that overlap', () => {
    const lab = aMeeting()
    const ana = aMeeting({ title: 'Ana', start: at('10:30'), cadence: inWeekA })
    expect(() => new Schedule([lab, ana])).toThrow(OverlapError)
    expect(() => new Schedule([lab, ana])).toThrow('Overlaps Lab meeting, week A, 10:00 to 11:00.')
  })

  it('holds a bi-weekly meeting in each week at the same slot', () => {
    const ana = aMeeting({ title: 'Ana', cadence: inWeekA })
    const bo = aMeeting({ title: 'Bo', cadence: inWeekB })
    expect(new Schedule([ana, bo]).meetings).toEqual([ana, bo])
  })

  it('refuses a meeting added that overlaps another, and keeps itself', () => {
    const schedule = new Schedule([aMeeting({ cadence: inWeekA })])
    expect(() => schedule.afterAdding(aMeeting({ title: 'Bo' }))).toThrow(OverlapError)
    expect(schedule.meetings).toHaveLength(1)
    expect(schedule.afterAdding(aMeeting({ title: 'Bo', cadence: inWeekB })).meetings).toHaveLength(
      2,
    )
  })

  it('says which meeting a candidate would overlap, the one it replaces aside', () => {
    const lab = aMeeting()
    const schedule = new Schedule([lab])
    const later = lab.afterMovingTo(Weekday.monday, at('10:30'))
    expect(schedule.overlapOf(later)).toBe(lab)
    expect(schedule.overlapOf(later, lab)).toBeUndefined()
  })

  it('replaces a meeting by its changed copy, in its place, and refuses an overlap', () => {
    const lab = aMeeting()
    const ana = aMeeting({ title: 'Ana', weekday: Weekday.tuesday })
    const schedule = new Schedule([lab, ana])
    const moved = schedule.afterReplacing(lab, lab.afterMovingTo(Weekday.monday, at('14:00')))
    expect(moved.meetings.map((meeting) => meeting.start.toString())).toEqual(['14:00', '10:00'])
    expect(() =>
      schedule.afterReplacing(lab, lab.afterMovingTo(Weekday.tuesday, at('10:00'))),
    ).toThrow(OverlapError)
    expect(() => schedule.afterReplacing(aMeeting(), lab)).toThrow(RangeError)
  })

  it('removes a meeting it holds', () => {
    const lab = aMeeting()
    const schedule = new Schedule([lab])
    expect(schedule.afterRemoving(lab).isEmpty).toBe(true)
    expect(() => schedule.afterRemoving(aMeeting())).toThrow(RangeError)
  })

  it('lists the meetings held in a week', () => {
    const lab = aMeeting()
    const ana = aMeeting({ title: 'Ana', weekday: Weekday.tuesday, cadence: inWeekA })
    const schedule = new Schedule([lab, ana])
    expect(schedule.meetingsHeldIn(Week.a)).toEqual([lab, ana])
    expect(schedule.meetingsHeldIn(Week.b)).toEqual([lab])
  })

  it('says whether a quarter is free in every week of a cadence', () => {
    const ana = aMeeting({ title: 'Ana', cadence: inWeekA })
    const schedule = new Schedule([ana])
    expect(schedule.isFree(Weekday.monday, at('10:00'), inWeekB)).toBe(true)
    expect(schedule.isFree(Weekday.monday, at('10:00'), inWeekA)).toBe(false)
    expect(schedule.isFree(Weekday.monday, at('10:00'), Cadence.weekly)).toBe(false)
    expect(schedule.isFree(Weekday.monday, at('10:00'), inWeekA, ana)).toBe(true)
    expect(schedule.isFree(Weekday.monday, at('11:00'), Cadence.weekly)).toBe(true)
  })
})
