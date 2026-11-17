import type { Booking } from '../domain/booking.ts'
import type { Week } from '../domain/cadence.ts'
import { theDay } from '../domain/day.ts'
import { Duration } from '../domain/duration.ts'
import { cadenceWritten, labelOf, timeOf } from '../domain/findings.ts'
import type { Schedule } from '../domain/schedule.ts'
import type { TimeOfDay } from '../domain/time-of-day.ts'
import { Weekday } from '../domain/weekday.ts'
import { type Slot, type Tab, weekOf } from './gestures.ts'
import { html, type Markup } from './html.ts'

/**
 * How a booking is named to a screen reader: Lab meeting, weekly, Monday 10:00 to 11:00; a time
 * block as Time block: Teaching, and so on.
 */
export function accessibleNameOf(booking: Booking): string {
  const name =
    booking.isTimeBlock && booking.title !== undefined
      ? `Time block: ${booking.title}`
      : labelOf(booking)
  return `${name}, ${cadenceWritten(booking.cadence)}, ${booking.weekday.name} ${timeOf(booking)}`
}

/** The class a week is drawn with: week-a or week-b. */
export function weekClass(week: Week): string {
  return `week-${week.key.toLowerCase()}`
}

/** The class a booking's cadence is drawn with: weekly, week-a or week-b. */
export function cadenceClass(booking: Booking): string {
  const { week } = booking.cadence
  return week === undefined ? 'weekly' : weekClass(week)
}

/** The class a booking's kind is drawn with: meeting or time-block. */
export function kindClass(booking: Booking): string {
  return booking.isTimeBlock ? 'time-block' : 'meeting'
}

function classesOf(booking: Booking): string {
  return `${kindClass(booking)} ${cadenceClass(booking)}`
}

/** The rows of the day column a booking, or where one goes, takes, as a grid-row value. */
export function rowsOf(placed: { readonly start: TimeOfDay; readonly duration: Duration }): string {
  return `${theDay.quarterAt(placed.start) + 1} / span ${placed.duration.quarters}`
}

/** The remove mark of a booking; none while the schedule is locked. */
function removeMark(booking: Booking, rank: number, isLocked: boolean): Markup | string {
  if (isLocked) {
    return ''
  }
  return html`<button type="button" class="remove" data-remove="${rank}"
    aria-label="Remove ${labelOf(booking)}" title="Remove">×</button>`
}

/** A booking drawn whole: on a week's tab, or on the overview when it shares no time. */
/** The handle of a booking's lower edge; none while the schedule is locked. */
function resizeHandle(rank: number, isLocked: boolean): Markup | string {
  return isLocked ? '' : html`<span class="resize" data-resize="${rank}" aria-hidden="true"></span>`
}

function wholeBooking(booking: Booking, rank: number, isLocked: boolean): Markup {
  return html`<div class="booking ${classesOf(booking)}" style="grid-row: ${rowsOf(booking)}"
    data-booking="${rank}" role="button" tabindex="0" aria-label="${accessibleNameOf(booking)}">
    <span class="booking-title">${labelOf(booking)}</span>
    <span class="booking-time">${timeOf(booking)}</span>
    ${removeMark(booking, rank, isLocked)}
    ${resizeHandle(rank, isLocked)}
  </div>`
}

/** A part of a booking's time on the overview: shared with a booking of the other week, or not. */
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
 * The parts of a booking's time on the overview, in order: those it shares with a bi-weekly
 * booking of the other week, meeting or time block, on the same weekday, and those it holds alone.
 * A weekly booking shares none.
 */
export function piecesOf(booking: Booking, schedule: Schedule): readonly Piece[] {
  const week = booking.cadence.week
  const shared = schedule.bookings
    .filter(
      (other) =>
        week !== undefined &&
        other.weekday === booking.weekday &&
        other.cadence.week !== undefined &&
        other.cadence.week !== week &&
        other.start.isBefore(booking.end) &&
        booking.start.isBefore(other.end),
    )
    .map((other) => ({
      from: later(booking.start, other.start),
      to: earlier(booking.end, other.end),
    }))
    .sort((one, other) => one.from.minutes - other.from.minutes)
  const pieces: Piece[] = []
  let reached = booking.start
  for (const { from, to } of shared) {
    if (reached.isBefore(from)) {
      pieces.push(pieceFrom(reached, from, false))
    }
    pieces.push(pieceFrom(from, to, true))
    reached = to
  }
  if (reached.isBefore(booking.end)) {
    pieces.push(pieceFrom(reached, booking.end, false))
  }
  return pieces
}

/** The classes of a piece: cut along its diagonal when shared, rounded at the booking's ends. */
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
 * A bi-weekly booking on the overview that shares time with a booking of the other week: the time
 * shared cut along its diagonal, the upper left half for week A, the lower right half for week B, the
 * rest whole; its title and remove mark over its first piece, its lower edge over its last.
 */
function piecedBooking(
  booking: Booking,
  rank: number,
  week: Week,
  pieces: readonly Piece[],
  isLocked: boolean,
) {
  const first = pieces[0] as Piece
  const last = pieces[pieces.length - 1] as Piece
  const kind = kindClass(booking)
  const drawn = pieces.map((piece, index) => {
    const focus =
      index === 0 ? html`role="button" tabindex="0" aria-label="${accessibleNameOf(booking)}"` : ''
    return html`<div class="booking piece ${kind} ${weekClass(week)} ${pieceClasses(piece, index, pieces.length)}"
      style="grid-row: ${rowsOf(piece)}" data-booking="${rank}" ${focus}></div>`
  })
  return html`${drawn}
    <div class="booking-label ${weekClass(week)} ${sharedClass(first)}" style="grid-row: ${rowsOf(first)}">
      <span class="booking-title">${labelOf(booking)}</span>${removeMark(booking, rank, isLocked)}
    </div>
    <div class="resize-zone ${weekClass(week)} ${sharedClass(last)}" style="grid-row: ${rowsOf(last)}">
      ${resizeHandle(rank, isLocked)}
    </div>`
}

function bookingOnTab(
  booking: Booking,
  rank: number,
  tab: Tab,
  schedule: Schedule,
  isLocked: boolean,
): Markup {
  const week = booking.cadence.week
  const pieces = piecesOf(booking, schedule)
  if (tab === 'overview' && week !== undefined && pieces.some((piece) => piece.isShared)) {
    return piecedBooking(booking, rank, week, pieces, isLocked)
  }
  return wholeBooking(booking, rank, isLocked)
}

function isShownOn(booking: Booking, tab: Tab): boolean {
  const week = weekOf(tab)
  return week === undefined || booking.isHeldIn(week)
}

function hourLabels(): Markup {
  const hours = theDay.quarters.filter((time) => time.minutes % 60 === 0)
  return html`${hours.map(
    (time) =>
      html`<div class="hour" style="grid-row: ${theDay.quarterAt(time) + 1} / span 4">${time.toString()}</div>`,
  )}`
}

/**
 * The grid of a tab: a weekday per column, a quarter of the day per row, and its bookings, each
 * by its rank among the bookings of the schedule; without remove marks or handles while locked.
 */
export function gridOf(schedule: Schedule, tab: Tab, isLocked = false): Markup {
  const shown = schedule.bookings
    .map((booking, rank) => ({ booking, rank }))
    .filter(({ booking }) => isShownOn(booking, tab))
  const columns = Weekday.all.map(
    (weekday) =>
      html`<div class="day" data-weekday="${weekday.key}">${shown
        .filter(({ booking }) => booking.weekday === weekday)
        .map(({ booking, rank }) => bookingOnTab(booking, rank, tab, schedule, isLocked))}</div>`,
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
