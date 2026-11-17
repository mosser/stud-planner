// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { Cadence, Parity } from '../domain/cadence.ts'
import { aMeeting, at } from '../domain/meeting.fixture.ts'
import { Schedule } from '../domain/schedule.ts'
import { Weekday } from '../domain/weekday.ts'
import { accessibleNameOf, gridOf, slotAt } from './grid.ts'

const lab = aMeeting({ weekday: Weekday.tuesday })
const ana = aMeeting({ title: 'Ana', cadence: Cadence.biWeekly(Parity.odd) })
const bo = aMeeting({ title: 'Bo <b>', cadence: Cadence.biWeekly(Parity.even), start: at('10:30') })
const schedule = new Schedule([lab, ana, bo])

function rendered(tab: 'odd' | 'even' | 'month'): HTMLElement {
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

  it('cuts the slots of a bi-weekly meeting in half on the month, odd and even', () => {
    const month = rendered('month')
    const odd = month.querySelector<HTMLElement>('.half.odd[data-meeting="1"]')
    expect(odd?.style.gridRow).toBe('9 / span 4')
    expect(month.querySelector<HTMLElement>('.half.even[data-meeting="2"]')?.style.gridRow).toBe(
      '11 / span 4',
    )
    expect(month.querySelectorAll('.meeting.weekly:not(.half)')).toHaveLength(1)
    expect(month.querySelector('.half-label.odd [data-resize="1"]')).not.toBeNull()
    expect(titles(month)).toEqual(['Ana', 'Bo <b>', 'Lab meeting'])
  })

  it('marks every hour of the day', () => {
    const hours = [...rendered('odd').querySelectorAll('.hour')].map((hour) => hour.textContent)
    expect(hours[0]).toBe('08:00')
    expect(hours).toHaveLength(10)
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
