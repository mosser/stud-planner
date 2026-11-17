import { describe, expect, it } from 'vitest'
import { Cadence, Week } from './cadence.ts'
import { Duration } from './duration.ts'
import { aMeeting, aTimeBlock, at } from './meeting.fixture.ts'
import { OverlapError, Schedule } from './schedule.ts'
import { Weekday } from './weekday.ts'

const inWeekA = Cadence.biWeekly(Week.a)

describe('a time block', () => {
  it('has a title only when the Organizer gives one', () => {
    expect(aTimeBlock().title).toBeUndefined()
    expect(aTimeBlock({ title: '  ' }).title).toBeUndefined()
    expect(aTimeBlock({ title: ' Teaching ' }).title).toBe('Teaching')
    expect(aTimeBlock().isTimeBlock).toBe(true)
    expect(aMeeting().isTimeBlock).toBe(false)
  })

  it('fits within the day', () => {
    expect(() => aTimeBlock({ start: at('17:00') })).toThrow('A time block cannot end after 18:00.')
    expect(() => aTimeBlock({ start: at('07:00') })).toThrow(
      'A time block cannot start before 08:00.',
    )
  })

  it('moves and resizes as a copy, keeping its title', () => {
    const block = aTimeBlock({ title: 'Teaching' })
    const moved = block.afterMovingTo(Weekday.friday, at('09:00'))
    expect([moved.title, moved.weekday, moved.end.toString()]).toEqual([
      'Teaching',
      Weekday.friday,
      '11:00',
    ])
    expect(moved.isTimeBlock).toBe(true)
    expect(block.afterResizingTo(Duration.ofQuarters(1)).end.toString()).toBe('14:15')
  })

  it('overlaps a meeting as a meeting does, in the weeks both are held', () => {
    const block = aTimeBlock({ cadence: inWeekA })
    expect(block.overlaps(aMeeting({ weekday: Weekday.wednesday, start: at('15:30') }))).toBe(true)
    const inWeekB = aMeeting({ weekday: Weekday.wednesday, cadence: Cadence.biWeekly(Week.b) })
    expect(block.overlaps(inWeekB.afterMovingTo(Weekday.wednesday, at('14:00')))).toBe(false)
  })
})

describe('a schedule with time blocks', () => {
  const block = aTimeBlock({ title: 'Teaching' })
  const lab = aMeeting()

  it('holds meetings and time blocks, the meetings first among its bookings', () => {
    const schedule = new Schedule([lab], [block])
    expect(schedule.bookings).toEqual([lab, block])
    expect(schedule.isEmpty).toBe(false)
    expect(new Schedule([], [block]).isEmpty).toBe(false)
  })

  it('never books a meeting in a time block, nor two time blocks in one slot', () => {
    const inside = aMeeting({ weekday: Weekday.wednesday, start: at('15:00') })
    expect(() => new Schedule([inside], [block])).toThrow(OverlapError)
    expect(() => new Schedule([], [block, aTimeBlock({ start: at('15:00') })])).toThrow(
      'Overlaps the time block Teaching, every week, 14:00 to 16:00.',
    )
    expect(() =>
      new Schedule([lab]).afterAdding(aTimeBlock({ weekday: Weekday.monday, start: at('10:00') })),
    ).toThrow('Overlaps Lab meeting, every week, 10:00 to 11:00.')
  })

  it('adds, replaces and removes a time block', () => {
    const schedule = new Schedule([lab]).afterAdding(block)
    expect(schedule.timeBlocks).toEqual([block])
    const moved = block.afterMovingTo(Weekday.friday, at('08:00'))
    expect(schedule.afterReplacing(block, moved).timeBlocks).toEqual([moved])
    expect(schedule.afterRemoving(block).timeBlocks).toEqual([])
    expect(schedule.afterRemoving(block).meetings).toEqual([lab])
  })

  it('never puts a meeting in the place of a time block, nor the reverse', () => {
    const schedule = new Schedule([lab], [block])
    const meetingThere = aMeeting({ weekday: Weekday.friday })
    expect(() => schedule.afterReplacing(block, meetingThere)).toThrow(RangeError)
    expect(() => schedule.afterReplacing(lab, aTimeBlock({ weekday: Weekday.friday }))).toThrow(
      RangeError,
    )
    expect(() => schedule.afterRemoving(aTimeBlock())).toThrow(RangeError)
  })

  it('counts a time block in what is free', () => {
    const schedule = new Schedule([], [block])
    expect(schedule.isFree(Weekday.wednesday, at('15:45'), inWeekA)).toBe(false)
    expect(schedule.isFree(Weekday.wednesday, at('16:00'), inWeekA)).toBe(true)
  })
})
