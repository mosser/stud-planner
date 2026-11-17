import type { Parity } from '../domain/cadence.ts'
import { theDay } from '../domain/day.ts'
import type { Duration } from '../domain/duration.ts'
import { cadenceWritten, timeOf } from '../domain/findings.ts'
import type { Meeting } from '../domain/meeting.ts'
import type { Schedule } from '../domain/schedule.ts'
import type { TimeOfDay } from '../domain/time-of-day.ts'
import { Weekday } from '../domain/weekday.ts'
import { parityOf, type Slot, type Tab } from './gestures.ts'
import { html, type Markup } from './html.ts'

/** How a meeting is named to a screen reader: Lab meeting, weekly, Monday 10:00 to 11:00. */
export function accessibleNameOf(meeting: Meeting): string {
  return `${meeting.title}, ${cadenceWritten(meeting.cadence)}, ${meeting.weekday.name} ${timeOf(meeting)}`
}

/** The class a meeting's cadence is drawn with: weekly, odd or even. */
export function cadenceClass(meeting: Meeting): string {
  return meeting.cadence.parity?.key ?? 'weekly'
}

/** The rows of the day column a meeting, or where one goes, takes, as a grid-row value. */
export function rowsOf(placed: { readonly start: TimeOfDay; readonly duration: Duration }): string {
  return `${theDay.quarterAt(placed.start) + 1} / span ${placed.duration.quarters}`
}

function removeMark(meeting: Meeting, rank: number): Markup {
  return html`<button type="button" class="remove" data-remove="${rank}"
    aria-label="Remove ${meeting.title}" title="Remove">×</button>`
}

/** A meeting drawn whole: on a week's tab, or a weekly meeting on the month. */
function wholeMeeting(meeting: Meeting, rank: number): Markup {
  return html`<div class="meeting ${cadenceClass(meeting)}" style="grid-row: ${rowsOf(meeting)}"
    data-meeting="${rank}" role="button" tabindex="0" aria-label="${accessibleNameOf(meeting)}">
    <span class="meeting-title">${meeting.title}</span>
    <span class="meeting-time">${timeOf(meeting)}</span>
    ${removeMark(meeting, rank)}
    <span class="resize" data-resize="${rank}" aria-hidden="true"></span>
  </div>`
}

/**
 * A bi-weekly meeting on the month: its slots cut along their diagonal, the upper left half for
 * odd, the lower right half for even, and its title, remove mark and lower edge over them.
 */
function halvedMeeting(meeting: Meeting, rank: number, parity: Parity): Markup {
  const rows = rowsOf(meeting)
  return html`<div class="meeting half ${parity.key}" style="grid-row: ${rows}" data-meeting="${rank}"
      role="button" tabindex="0" aria-label="${accessibleNameOf(meeting)}"></div>
    <div class="half-label ${parity.key}" style="grid-row: ${rows}">
      <span class="meeting-title">${meeting.title}</span>${removeMark(meeting, rank)}
      <span class="resize" data-resize="${rank}" aria-hidden="true"></span>
    </div>`
}

function meetingOnTab(meeting: Meeting, rank: number, tab: Tab): Markup {
  const parity = meeting.cadence.parity
  if (tab === 'month' && parity !== undefined) {
    return halvedMeeting(meeting, rank, parity)
  }
  return wholeMeeting(meeting, rank)
}

function isShownOn(meeting: Meeting, tab: Tab): boolean {
  const parity = parityOf(tab)
  return parity === undefined || meeting.isHeldIn(parity)
}

function hourLabels(): Markup {
  const hours = theDay.quarters.filter((time) => time.minutes % 60 === 0)
  return html`${hours.map(
    (time) =>
      html`<div class="hour" style="grid-row: ${theDay.quarterAt(time) + 1} / span 4">${time.toString()}</div>`,
  )}`
}

/** The grid of a tab: a weekday per column, a quarter of the day per row, and its meetings. */
export function gridOf(schedule: Schedule, tab: Tab): Markup {
  const shown = schedule.meetings
    .map((meeting, rank) => ({ meeting, rank }))
    .filter(({ meeting }) => isShownOn(meeting, tab))
  const columns = Weekday.all.map(
    (weekday) =>
      html`<div class="day" data-weekday="${weekday.key}">${shown
        .filter(({ meeting }) => meeting.weekday === weekday)
        .map(({ meeting, rank }) => meetingOnTab(meeting, rank, tab))}</div>`,
  )
  return html`<div class="week" data-shows="${tab}" style="--quarters: ${theDay.quarterCount}">
    <div class="corner"></div>
    ${Weekday.all.map((weekday) => html`<div class="weekday">${weekday.name}</div>`)}
    <div class="hours">${hourLabels()}</div>
    ${columns}
  </div>`
}

/**
 * The slot under a point of the screen: the day column it is in, or the nearest one, and the
 * quarter at its height, within the day.
 */
export function slotAt(grid: Element, x: number, y: number): Slot | undefined {
  const columns = [...grid.querySelectorAll<HTMLElement>('.day[data-weekday]')]
  let nearest: { column: HTMLElement; distance: number } | undefined
  for (const column of columns) {
    const box = column.getBoundingClientRect()
    const distance = Math.max(box.left - x, 0, x - box.right)
    if (nearest === undefined || distance < nearest.distance) {
      nearest = { column, distance }
    }
  }
  if (nearest === undefined) {
    return undefined
  }
  const weekday = Weekday.withKey(nearest.column.dataset.weekday ?? '')
  const box = nearest.column.getBoundingClientRect()
  if (weekday === undefined || box.height <= 0) {
    return undefined
  }
  const quarter = Math.floor(((y - box.top) / box.height) * theDay.quarterCount)
  return { weekday, quarter: Math.min(Math.max(quarter, 0), theDay.quarterCount - 1) }
}
