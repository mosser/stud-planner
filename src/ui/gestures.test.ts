import { describe, expect, it } from 'vitest'
import { Cadence, Parity } from '../domain/cadence.ts'
import { aMeeting } from '../domain/meeting.fixture.ts'
import { Schedule } from '../domain/schedule.ts'
import { Weekday } from '../domain/weekday.ts'
import {
  cadenceOffered,
  cadencesAddedIn,
  meetingMoved,
  meetingResized,
  parityOf,
  type Span,
  spanDragged,
  spanPressed,
} from './gestures.ts'

const odd = Cadence.biWeekly(Parity.odd)
const even = Cadence.biWeekly(Parity.even)
/** Monday from 10:00 to 11:00, odd week: quarters 8 to 11 of the day. */
const ana = aMeeting({ title: 'Ana', cadence: odd })
const schedule = new Schedule([ana])
const monday = (quarter: number) => ({ weekday: Weekday.monday, quarter })

function written(span: Span): string {
  return `${span.weekday.name} ${span.start} ${span.duration.minutes}`
}

describe('the tabs', () => {
  it('show the odd week, the even week, or both on the overview', () => {
    expect(parityOf('odd')).toBe(Parity.odd)
    expect(parityOf('even')).toBe(Parity.even)
    expect(parityOf('overview')).toBeUndefined()
  })
})

describe('the cadence offered from a free slot', () => {
  it('is bi-weekly in the week of the tab', () => {
    expect(cadenceOffered(schedule, 'odd', monday(0))).toBe(odd)
    expect(cadenceOffered(schedule, 'even', monday(8))).toBe(even)
  })

  it('is none on the overview, where nothing is added', () => {
    expect(cadenceOffered(schedule, 'overview', monday(0))).toBeUndefined()
  })

  it('is none from a slot taken in the week of the tab', () => {
    expect(cadenceOffered(schedule, 'odd', monday(8))).toBeUndefined()
  })
})

describe('a meeting added from a week', () => {
  it('is held in that week: bi-weekly in it, or weekly', () => {
    expect(cadencesAddedIn(Parity.odd)).toEqual([Cadence.weekly, odd])
    expect(cadencesAddedIn(Parity.even)).toEqual([Cadence.weekly, even])
  })
})

describe('adding by dragging', () => {
  it('marks from the slot pressed to the quarter reached, down or up', () => {
    expect(written(spanDragged(schedule, odd, monday(0), 3))).toBe('Monday 08:00 60')
    expect(written(spanDragged(schedule, odd, monday(3), 0))).toBe('Monday 08:00 60')
    expect(written(spanDragged(schedule, odd, monday(2), 2))).toBe('Monday 08:30 15')
  })

  it('stops before the first taken slot', () => {
    expect(written(spanDragged(schedule, odd, monday(4), 20))).toBe('Monday 09:00 60')
    expect(written(spanDragged(schedule, even, monday(4), 20))).toBe('Monday 09:00 255')
  })

  it('marks an hour from a press without a drag, or less when a taken slot comes first', () => {
    expect(written(spanPressed(schedule, odd, monday(0)))).toBe('Monday 08:00 60')
    expect(written(spanPressed(schedule, odd, monday(6)))).toBe('Monday 09:30 30')
  })

  it('marks no further than the end of the day', () => {
    expect(written(spanPressed(schedule, odd, monday(38)))).toBe('Monday 17:30 30')
  })
})

describe('moving and resizing', () => {
  it('moves a meeting by the quarter it is held at, keeping its duration', () => {
    const moved = meetingMoved(ana, 2, { weekday: Weekday.friday, quarter: 22 })
    expect([moved.weekday, moved.start.toString(), moved.duration.quarters]).toEqual([
      Weekday.friday,
      '13:00',
      4,
    ])
  })

  it('keeps a moved meeting within the day', () => {
    expect(meetingMoved(ana, 3, monday(0)).start.toString()).toBe('08:00')
    expect(meetingMoved(ana, 0, monday(39)).end.toString()).toBe('18:00')
  })

  it('resizes a meeting to end with the quarter reached, one quarter at least', () => {
    expect(meetingResized(ana, monday(13)).end.toString()).toBe('11:30')
    expect(meetingResized(ana, monday(2)).duration.quarters).toBe(1)
    expect(meetingResized(ana, { weekday: Weekday.friday, quarter: 9 }).weekday).toBe(
      Weekday.monday,
    )
  })
})
