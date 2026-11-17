import type { Parity } from '../domain/cadence.ts'
import { theDay } from '../domain/day.ts'
import { Duration } from '../domain/duration.ts'
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

/** A meeting drawn whole: on a week's tab, or on the merged view when it shares no time. */
function wholeMeeting(meeting: Meeting, rank: number): Markup {
  return html`<div class="meeting ${cadenceClass(meeting)}" style="grid-row: ${rowsOf(meeting)}"
    data-meeting="${rank}" role="button" tabindex="0" aria-label="${accessibleNameOf(meeting)}">
    <span class="meeting-title">${meeting.title}</span>
    <span class="meeting-time">${timeOf(meeting)}</span>
    ${removeMark(meeting, rank)}
    <span class="resize" data-resize="${rank}" aria-hidden="true"></span>
  </div>`
}

/** A part of a meeting's time on the merged view: shared with a meeting of the other week, or not. */
export interface Piece {
  readonly start: TimeOfDay
  readonly duration: Duration
  readonly isShared: boolean
}

function pieceFrom(start: TimeOfDay, end: TimeOfDay, isShared: boolean): Piece {
  return { start, duration: Duration.ofQuarters(start.quartersUntil(end)), isShared }
}

function later(one: TimeOfDay, other: TimeOfDay): TimeOfDay {
  return one.isBefore(other) ? other : one
}

function earlier(one: TimeOfDay, other: TimeOfDay): TimeOfDay {
  return one.isBefore(other) ? one : other
}

/**
 * The parts of a meeting's time on the merged view, in order: those it shares with a bi-weekly meeting
 * of the other week, on the same weekday, and those it holds alone. A weekly meeting shares none.
 */
export function piecesOf(meeting: Meeting, schedule: Schedule): readonly Piece[] {
  const parity = meeting.cadence.parity
  const shared = schedule.meetings
    .filter(
      (other) =>
        parity !== undefined &&
        other.weekday === meeting.weekday &&
        other.cadence.parity !== undefined &&
        other.cadence.parity !== parity &&
        other.start.isBefore(meeting.end) &&
        meeting.start.isBefore(other.end),
    )
    .map((other) => ({
      from: later(meeting.start, other.start),
      to: earlier(meeting.end, other.end),
    }))
    .sort((one, other) => one.from.minutes - other.from.minutes)
  const pieces: Piece[] = []
  let reached = meeting.start
  for (const { from, to } of shared) {
    if (reached.isBefore(from)) {
      pieces.push(pieceFrom(reached, from, false))
    }
    pieces.push(pieceFrom(from, to, true))
    reached = to
  }
  if (reached.isBefore(meeting.end)) {
    pieces.push(pieceFrom(reached, meeting.end, false))
  }
  return pieces
}

/** The classes of a piece: cut along its diagonal when shared, rounded at the meeting's ends. */
function pieceClasses(piece: Piece, rank: number, count: number): string {
  const classes = [piece.isShared ? 'half' : 'alone']
  if (rank === 0) classes.push('first')
  if (rank === count - 1) classes.push('last')
  return classes.join(' ')
}

/** Where a shared piece writes or holds something: in the half of its week. */
function sharedClass(piece: Piece): string {
  return piece.isShared ? 'shared' : ''
}

/**
 * A bi-weekly meeting on the merged view that shares time with a meeting of the other week: the time
 * shared cut along its diagonal, the upper left half for odd, the lower right half for even, the
 * rest whole; its title and remove mark over its first piece, its lower edge over its last.
 */
function piecedMeeting(meeting: Meeting, rank: number, parity: Parity, pieces: readonly Piece[]) {
  const first = pieces[0] as Piece
  const last = pieces[pieces.length - 1] as Piece
  const drawn = pieces.map((piece, index) => {
    const focus =
      index === 0 ? html`role="button" tabindex="0" aria-label="${accessibleNameOf(meeting)}"` : ''
    return html`<div class="meeting piece ${parity.key} ${pieceClasses(piece, index, pieces.length)}"
      style="grid-row: ${rowsOf(piece)}" data-meeting="${rank}" ${focus}></div>`
  })
  return html`${drawn}
    <div class="meeting-label ${parity.key} ${sharedClass(first)}" style="grid-row: ${rowsOf(first)}">
      <span class="meeting-title">${meeting.title}</span>${removeMark(meeting, rank)}
    </div>
    <div class="resize-zone ${parity.key} ${sharedClass(last)}" style="grid-row: ${rowsOf(last)}">
      <span class="resize" data-resize="${rank}" aria-hidden="true"></span>
    </div>`
}

function meetingOnTab(meeting: Meeting, rank: number, tab: Tab, schedule: Schedule): Markup {
  const parity = meeting.cadence.parity
  const pieces = piecesOf(meeting, schedule)
  if (tab === 'merged' && parity !== undefined && pieces.some((piece) => piece.isShared)) {
    return piecedMeeting(meeting, rank, parity, pieces)
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
        .map(({ meeting, rank }) => meetingOnTab(meeting, rank, tab, schedule))}</div>`,
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
