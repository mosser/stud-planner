// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { Cadence, Week } from '../domain/cadence.ts'
import { Duration } from '../domain/duration.ts'
import { aMeeting, aTimeBlock, at } from '../domain/meeting.fixture.ts'
import { Participant } from '../domain/participant.ts'
import { Schedule } from '../domain/schedule.ts'
import { Weekday } from '../domain/weekday.ts'
import {
  accessibleNameOf,
  gridOf,
  lengthClass,
  participantsWritten,
  piecesOf,
  slotAt,
} from './grid.ts'

const lab = aMeeting({ weekday: Weekday.tuesday })
const ana = aMeeting({ title: 'Ana', cadence: Cadence.biWeekly(Week.a) })
const bo = aMeeting({ title: 'Bo <b>', cadence: Cadence.biWeekly(Week.b), start: at('10:30') })
const schedule = new Schedule([lab, ana, bo])

function rendered(tab: 'overview' | 'a' | 'b'): HTMLElement {
  const element = document.createElement('div')
  element.innerHTML = gridOf(schedule, tab).text
  return element
}

const titles = (element: Element) =>
  [...element.querySelectorAll('.booking-title')].map((title) => title.textContent)

describe('the grid of a tab', () => {
  it('has a column per weekday', () => {
    const columns = rendered('a').querySelectorAll('.day')
    expect([...columns].map((column) => (column as HTMLElement).dataset.weekday)).toEqual(
      Weekday.all.map((weekday) => weekday.key),
    )
  })

  it('shows on week A the weekly meetings and those held in week A', () => {
    expect(titles(rendered('a'))).toEqual(['Ana', 'Lab meeting'])
    expect(titles(rendered('b'))).toEqual(['Bo <b>', 'Lab meeting'])
  })

  it('places a meeting on the rows of its quarters', () => {
    const meeting = rendered('a').querySelector<HTMLElement>('[data-booking="1"]')
    expect(meeting?.style.gridRow).toBe('9 / span 4')
    expect(meeting?.getAttribute('aria-label')).toBe(accessibleNameOf(ana))
  })

  it('draws on the overview a bi-weekly meeting whole, in the half of its week', () => {
    const overview = rendered('overview')
    const week = (rank: number) => {
      const booking = overview.querySelector<HTMLElement>(`[data-booking="${rank}"]`)
      return `${booking?.classList.contains('week-a') ? 'A' : 'B'} | ${booking?.style.gridRow}`
    }
    expect(week(1)).toBe('A | 9 / span 4')
    expect(week(2)).toBe('B | 11 / span 4')
    expect(overview.querySelectorAll('.piece')).toHaveLength(0)
    expect(overview.querySelector('[data-booking="1"] [data-remove="1"]')).not.toBeNull()
    expect(titles(overview)).toEqual(['Ana', 'Bo <b>', 'Lab meeting'])
  })

  it('outlines the other half where the other week has nothing', () => {
    const overview = rendered('overview')
    const empty = [...overview.querySelectorAll<HTMLElement>('.empty-half')].map(
      (half) => `${half.className.replace(/\s+/g, ' ').trim()} | ${half.style.gridRow}`,
    )
    expect(empty).toEqual(['empty-half week-a | 9 / span 2', 'empty-half week-b | 13 / span 2'])
    const weekly = document.createElement('div')
    weekly.innerHTML = gridOf(new Schedule([aMeeting()]), 'overview').text
    expect(weekly.querySelectorAll('.empty-half')).toHaveLength(0)
  })

  it('marks every hour of the day', () => {
    const hours = [...rendered('a').querySelectorAll('.hour')].map((hour) => hour.textContent)
    expect(hours[0]).toBe('08:00')
    expect(hours).toHaveLength(10)
  })
})

describe('a time block on the grid', () => {
  const block = aTimeBlock({
    cadence: Cadence.biWeekly(Week.a),
    weekday: Weekday.monday,
    start: at('09:00'),
  })
  const named = aTimeBlock({ title: 'Teaching', weekday: Weekday.friday })
  const withBlocks = new Schedule([bo], [block, named])

  function drawn(tab: 'overview' | 'a' | 'b'): HTMLElement {
    const element = document.createElement('div')
    element.innerHTML = gridOf(withBlocks, tab).text
    return element
  }

  it('is drawn as a time block, by its rank among the bookings, titled when it has a title', () => {
    const inWeekA = drawn('a')
    const untitled = inWeekA.querySelector<HTMLElement>('.booking.time-block[data-booking="1"]')
    expect(untitled?.querySelector('.booking-title')?.textContent).toBe('Time block')
    expect(untitled?.getAttribute('aria-label')).toBe(
      'Time block, bi-weekly, week A, Monday 09:00 to 11:00',
    )
    expect(inWeekA.querySelector('[data-booking="2"]')?.getAttribute('aria-label')).toBe(
      'Time block: Teaching, weekly, Friday 14:00 to 16:00',
    )
    expect(drawn('b').querySelector('[data-booking="1"]')).toBeNull()
  })

  it('shares on the overview the time it has in common with a meeting of the other week', () => {
    expect(piecesOf(block, withBlocks).map((piece) => piece.isShared)).toEqual([false, true])
    expect(drawn('overview').querySelectorAll('.booking.time-block.week-a')).toHaveLength(1)
    expect(drawn('overview').querySelectorAll('.empty-half.week-a')).toHaveLength(1)
  })
})

describe('a short booking on the grid', () => {
  it('is drawn on one line when half an hour or less, its title alone for a quarter', () => {
    expect(lengthClass(aMeeting({ duration: Duration.ofQuarters(1) }))).toBe('short shortest')
    expect(lengthClass(aMeeting({ duration: Duration.ofQuarters(2) }))).toBe('short')
    expect(lengthClass(aMeeting({ duration: Duration.ofQuarters(3) }))).toBe('')
  })

  it('tells all of itself on hover', () => {
    const element = document.createElement('div')
    element.innerHTML = gridOf(new Schedule([aMeeting()]), 'a').text
    expect(element.querySelector('[data-booking="0"]')?.getAttribute('title')).toBe(
      'Lab meeting, weekly, Monday 10:00 to 11:00',
    )
  })
})

describe('the participants on the grid', () => {
  const ana = new Participant('Ana')
  const bo = new Participant('Bo')
  const withThem = aMeeting({ participants: [ana, bo] })
  const alone = aMeeting({ title: 'Alone', weekday: Weekday.friday })
  const block = aTimeBlock()
  const roster = new Schedule([withThem, alone], [block], [ana, bo])

  function drawn(participant?: Participant): HTMLElement {
    const element = document.createElement('div')
    element.innerHTML = gridOf(roster, 'overview', { participant }).text
    return element
  }

  it('are written on a meeting, and named to a screen reader', () => {
    const meeting = drawn().querySelector('[data-booking="0"]')
    expect(meeting?.querySelector('.booking-participants')?.textContent).toBe('Ana, Bo')
    expect(meeting?.getAttribute('aria-label')).toBe(
      'Lab meeting, weekly, Monday 10:00 to 11:00, with Ana and Bo',
    )
    expect(drawn().querySelector('[data-booking="1"] .booking-participants')).toBeNull()
  })

  it('single out the meetings of one of them, every other meeting dimmed, no time block', () => {
    const dimmed = [...drawn(bo).querySelectorAll('.dimmed')].map(
      (each) => (each as HTMLElement).dataset.booking,
    )
    expect(dimmed).toEqual(['1'])
    expect(drawn().querySelectorAll('.dimmed')).toHaveLength(0)
  })

  it('are written two at most, then counted', () => {
    expect(participantsWritten(['Ana'])).toBe('Ana')
    expect(participantsWritten(['Ana', 'Bo'])).toBe('Ana, Bo')
    expect(participantsWritten(['Ana', 'Bo', 'Chloé', 'Dan'])).toBe('Ana, Bo +2')
  })
})

describe('the pieces of a meeting on the overview', () => {
  const written = (meeting: typeof ana, within: Schedule) =>
    piecesOf(meeting, within).map(
      (piece) => `${piece.start}+${piece.duration.minutes}${piece.isShared ? ' shared' : ''}`,
    )

  it('are the time shared with a meeting of the other week, and the rest', () => {
    expect(written(ana, schedule)).toEqual(['10:00+30', '10:30+30 shared'])
    expect(written(bo, schedule)).toEqual(['10:30+30 shared', '11:00+30'])
  })

  it('share each meeting of the other week in turn, in order', () => {
    const long = aMeeting({
      title: 'Long',
      cadence: Cadence.biWeekly(Week.a),
      start: at('09:00'),
      duration: Duration.ofQuarters(12),
    })
    const first = aMeeting({
      title: 'One',
      cadence: Cadence.biWeekly(Week.b),
      start: at('10:30'),
      duration: Duration.ofQuarters(2),
    })
    const second = aMeeting({
      title: 'Two',
      cadence: Cadence.biWeekly(Week.b),
      start: at('09:30'),
      duration: Duration.ofQuarters(2),
    })
    expect(written(long, new Schedule([long, first, second]))).toEqual([
      '09:00+30',
      '09:30+30 shared',
      '10:00+30',
      '10:30+30 shared',
      '11:00+60',
    ])
  })

  it('are one, unshared, for a weekly meeting or a meeting alone on its weekday', () => {
    expect(written(lab, schedule)).toEqual(['10:00+60'])
    expect(
      written(
        ana,
        new Schedule([
          ana,
          aMeeting({
            title: 'Bo',
            cadence: Cadence.biWeekly(Week.b),
            weekday: Weekday.friday,
          }),
        ]),
      ),
    ).toEqual(['10:00+60'])
  })

  it('cover the whole meeting when it shares all its time', () => {
    const twin = aMeeting({ title: 'Twin', cadence: Cadence.biWeekly(Week.b) })
    expect(written(ana, new Schedule([ana, twin]))).toEqual(['10:00+60 shared'])
  })
})

describe('the slot under a point', () => {
  function placed(): HTMLElement {
    const element = rendered('a')
    element.querySelectorAll<HTMLElement>('.day').forEach((column, rank) => {
      column.getBoundingClientRect = () =>
        ({ left: rank * 100, right: rank * 100 + 100, top: 0, height: 400 }) as DOMRect
    })
    return element
  }

  it('is in the column under the point, at the quarter of its height', () => {
    expect(slotAt(placed(), 150, 85)).toEqual({ weekday: Weekday.tuesday, quarter: 8 })
  })

  it('is in the nearest column, within the day, when the point is outside', () => {
    expect(slotAt(placed(), 900, -20)).toEqual({ weekday: Weekday.friday, quarter: 0 })
    expect(slotAt(placed(), -5, 900)).toEqual({ weekday: Weekday.monday, quarter: 39 })
  })

  it('is none on a grid not laid out', () => {
    expect(slotAt(rendered('a'), 10, 10)).toBeUndefined()
    expect(slotAt(document.createElement('div'), 10, 10)).toBeUndefined()
  })
})
