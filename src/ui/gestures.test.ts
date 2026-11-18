import { describe, expect, it } from 'vitest'
import { Cadence, Week } from '../domain/cadence.ts'
import { aMeeting } from '../domain/meeting.fixture.ts'
import { Schedule } from '../domain/schedule.ts'
import { Weekday } from '../domain/weekday.ts'
import {
  bookingMoved,
  bookingResized,
  cadenceOffered,
  type Span,
  spanDragged,
  spanPressed,
  weekOf,
} from './gestures.ts'

const inWeekA = Cadence.biWeekly(Week.a)
const inWeekB = Cadence.biWeekly(Week.b)
/** Monday from 10:00 to 11:00, week A: quarters 8 to 11 of the day. */
const ana = aMeeting({ title: 'Ana', cadence: inWeekA })
const schedule = new Schedule([ana])
const monday = (quarter: number) => ({ weekday: Weekday.monday, quarter })

function written(span: Span): string {
  return `${span.weekday.name} ${span.start} ${span.duration.minutes}`
}

describe('the tabs', () => {
  it('show week A, week B, or both on the overview', () => {
    expect(weekOf('a')).toBe(Week.a)
    expect(weekOf('b')).toBe(Week.b)
    expect(weekOf('overview')).toBeUndefined()
  })
})

describe('the cadence offered from a free slot', () => {
  it('is bi-weekly in the week of the tab', () => {
    expect(cadenceOffered(schedule, 'a', monday(0))).toBe(inWeekA)
    expect(cadenceOffered(schedule, 'b', monday(8))).toBe(inWeekB)
  })

  it('is weekly on the overview, from a slot free in both weeks', () => {
    expect(cadenceOffered(schedule, 'overview', monday(0))).toBe(Cadence.weekly)
    expect(cadenceOffered(schedule, 'overview', monday(8))).toBeUndefined()
  })

  it('is none from a slot taken in the week of the tab', () => {
    expect(cadenceOffered(schedule, 'a', monday(8))).toBeUndefined()
  })
})

describe('adding by dragging', () => {
  it('marks from the slot pressed to the quarter reached, down or up', () => {
    expect(written(spanDragged(schedule, inWeekA, monday(0), 3))).toBe('Monday 08:00 60')
    expect(written(spanDragged(schedule, inWeekA, monday(3), 0))).toBe('Monday 08:00 60')
    expect(written(spanDragged(schedule, inWeekA, monday(2), 2))).toBe('Monday 08:30 15')
  })

  it('stops before the first taken slot', () => {
    expect(written(spanDragged(schedule, inWeekA, monday(4), 20))).toBe('Monday 09:00 60')
    expect(written(spanDragged(schedule, inWeekB, monday(4), 20))).toBe('Monday 09:00 255')
  })

  it('marks an hour from a press without a drag, or less when a taken slot comes first', () => {
    expect(written(spanPressed(schedule, inWeekA, monday(0)))).toBe('Monday 08:00 60')
    expect(written(spanPressed(schedule, inWeekA, monday(6)))).toBe('Monday 09:30 30')
  })

  it('marks no further than the end of the day', () => {
    expect(written(spanPressed(schedule, inWeekA, monday(38)))).toBe('Monday 17:30 30')
  })
})

describe('moving into the other week on the overview', () => {
  it('holds a bi-weekly booking dragged into the half of the other week in that week', () => {
    const moved = bookingMoved(ana, 0, { weekday: Weekday.friday, quarter: 8, half: Week.b })
    expect([moved.cadence, moved.weekday, moved.start.toString()]).toEqual([
      Cadence.biWeekly(Week.b),
      Weekday.friday,
      '10:00',
    ])
    expect(bookingMoved(ana, 0, { ...monday(8), half: Week.a }).cadence).toBe(inWeekA)
  })

  it("keeps a weekly booking weekly, and the week of a booking moved on a week's tab", () => {
    const weekly = aMeeting({ title: 'Lab' })
    expect(bookingMoved(weekly, 0, { ...monday(8), half: Week.b }).cadence).toBe(Cadence.weekly)
    expect(bookingMoved(ana, 0, monday(12)).cadence).toBe(inWeekA)
  })
})

describe('moving and resizing', () => {
  it('moves a meeting by the quarter it is held at, keeping its duration', () => {
    const moved = bookingMoved(ana, 2, { weekday: Weekday.friday, quarter: 22 })
    expect([moved.weekday, moved.start.toString(), moved.duration.quarters]).toEqual([
      Weekday.friday,
      '13:00',
      4,
    ])
  })

  it('keeps a moved meeting within the day', () => {
    expect(bookingMoved(ana, 3, monday(0)).start.toString()).toBe('08:00')
    expect(bookingMoved(ana, 0, monday(39)).end.toString()).toBe('18:00')
  })

  it('resizes a meeting to end with the quarter reached, one quarter at least', () => {
    expect(bookingResized(ana, monday(13)).end.toString()).toBe('11:30')
    expect(bookingResized(ana, monday(2)).duration.quarters).toBe(1)
    expect(bookingResized(ana, { weekday: Weekday.friday, quarter: 9 }).weekday).toBe(
      Weekday.monday,
    )
  })
})
