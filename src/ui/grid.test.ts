// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { Cadence, Parity } from '../domain/cadence.ts'
import { Duration } from '../domain/duration.ts'
import { aMeeting, at } from '../domain/meeting.fixture.ts'
import { Schedule } from '../domain/schedule.ts'
import { Weekday } from '../domain/weekday.ts'
import { accessibleNameOf, gridOf, piecesOf, slotAt } from './grid.ts'

const lab = aMeeting({ weekday: Weekday.tuesday })
const ana = aMeeting({ title: 'Ana', cadence: Cadence.biWeekly(Parity.odd) })
const bo = aMeeting({ title: 'Bo <b>', cadence: Cadence.biWeekly(Parity.even), start: at('10:30') })
const schedule = new Schedule([lab, ana, bo])

function rendered(tab: 'odd' | 'even' | 'overview'): HTMLElement {
  const element = document.createElement('div')
  element.innerHTML = gridOf(schedule, tab).text
  return element
}

const titles = (element: Element) =>
  [...element.querySelectorAll('.meeting-title')].map((title) => title.textContent)

describe('the grid of a tab', () => {
  it('has a column per weekday', () => {
    const columns = rendered('odd').querySelectorAll('.day')
    expect([...columns].map((column) => (column as HTMLElement).dataset.weekday)).toEqual(
      Weekday.all.map((weekday) => weekday.key),
    )
  })

  it('shows on the odd week the weekly meetings and those held in the odd week', () => {
    expect(titles(rendered('odd'))).toEqual(['Ana', 'Lab meeting'])
    expect(titles(rendered('even'))).toEqual(['Bo <b>', 'Lab meeting'])
  })

  it('places a meeting on the rows of its quarters', () => {
    const meeting = rendered('odd').querySelector<HTMLElement>('[data-meeting="1"]')
    expect(meeting?.style.gridRow).toBe('9 / span 4')
    expect(meeting?.getAttribute('aria-label')).toBe(accessibleNameOf(ana))
  })

  it('cuts on the overview only the time an odd and an even meeting share', () => {
    const overview = rendered('overview')
    const rowsOfPieces = (rank: number) =>
      [...overview.querySelectorAll<HTMLElement>(`.piece[data-meeting="${rank}"]`)].map(
        (piece) => `${piece.className.replace(/\s+/g, ' ').trim()} | ${piece.style.gridRow}`,
      )
    expect(rowsOfPieces(1)).toEqual([
      'meeting piece odd alone first | 9 / span 2',
      'meeting piece odd half last | 11 / span 2',
    ])
    expect(rowsOfPieces(2)).toEqual([
      'meeting piece even half first | 11 / span 2',
      'meeting piece even alone last | 13 / span 2',
    ])
    expect(overview.querySelector('.meeting-label.even.shared [data-remove="2"]')).not.toBeNull()
    expect(overview.querySelector('.resize-zone.odd.shared [data-resize="1"]')).not.toBeNull()
    expect(overview.querySelectorAll('[data-meeting="1"][tabindex="0"]')).toHaveLength(1)
    expect(titles(overview)).toEqual(['Ana', 'Bo <b>', 'Lab meeting'])
  })

  it('draws whole on the overview a bi-weekly meeting that shares no time', () => {
    const alone = new Schedule([
      ana,
      aMeeting({ title: 'Bo', cadence: Cadence.biWeekly(Parity.even), start: at('11:00') }),
    ])
    const element = document.createElement('div')
    element.innerHTML = gridOf(alone, 'overview').text
    expect(element.querySelectorAll('.piece')).toHaveLength(0)
    expect(element.querySelector<HTMLElement>('.meeting.odd')?.style.gridRow).toBe('9 / span 4')
  })

  it('marks every hour of the day', () => {
    const hours = [...rendered('odd').querySelectorAll('.hour')].map((hour) => hour.textContent)
    expect(hours[0]).toBe('08:00')
    expect(hours).toHaveLength(10)
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
      cadence: Cadence.biWeekly(Parity.odd),
      start: at('09:00'),
      duration: Duration.ofQuarters(12),
    })
    const first = aMeeting({
      title: 'One',
      cadence: Cadence.biWeekly(Parity.even),
      start: at('10:30'),
      duration: Duration.ofQuarters(2),
    })
    const second = aMeeting({
      title: 'Two',
      cadence: Cadence.biWeekly(Parity.even),
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
            cadence: Cadence.biWeekly(Parity.even),
            weekday: Weekday.friday,
          }),
        ]),
      ),
    ).toEqual(['10:00+60'])
  })

  it('cover the whole meeting when it shares all its time', () => {
    const twin = aMeeting({ title: 'Twin', cadence: Cadence.biWeekly(Parity.even) })
    expect(written(ana, new Schedule([ana, twin]))).toEqual(['10:00+60 shared'])
  })
})

describe('the slot under a point', () => {
  function placed(): HTMLElement {
    const element = rendered('odd')
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
    expect(slotAt(rendered('odd'), 10, 10)).toBeUndefined()
    expect(slotAt(document.createElement('div'), 10, 10)).toBeUndefined()
  })
})
