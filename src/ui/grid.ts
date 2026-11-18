import type { Booking } from '../domain/booking.ts'
import { Week } from '../domain/cadence.ts'
import type { Category } from '../domain/category.ts'
import { theDay } from '../domain/day.ts'
import { Duration } from '../domain/duration.ts'
import {
  cadenceWritten,
  labelOf,
  presenceLabel,
  tentativeWritten,
  timeOf,
  withParticipants,
} from '../domain/findings.ts'
import { Meeting } from '../domain/meeting.ts'
import { byName, type Participant } from '../domain/participant.ts'
import type { Schedule } from '../domain/schedule.ts'
import type { TimeOfDay } from '../domain/time-of-day.ts'
import { Weekday } from '../domain/weekday.ts'
import { type Slot, type Tab, weekOf } from './gestures.ts'
import { html, type Markup } from './html.ts'
import { presenceIcon } from './icon.ts'

/**
 * How a booking is named to a screen reader: Lab meeting, weekly, Monday 10:00 to 11:00; a
 * tentative meeting as Lab meeting, tentative, weekly, and so on; a time block as Time block:
 * Teaching, and so on.
 */
export function accessibleNameOf(booking: Booking): string {
  const name =
    booking.isTimeBlock && booking.title !== undefined
      ? `Time block: ${booking.title}`
      : labelOf(booking)
  const category =
    booking instanceof Meeting && booking.category !== undefined
      ? ` (${booking.category.name})`
      : ''
  const tentative = booking instanceof Meeting && booking.isTentative ? `, ${tentativeWritten}` : ''
  const spoken = `${name}${category}${tentative}, ${cadenceWritten(booking.cadence)}, ${booking.weekday.name} ${timeOf(booking)}`
  const people = participantsOf(booking)
  return people.length === 0 ? spoken : `${spoken}, ${withParticipants(people)}`
}

/** The names of the participants of a meeting besides its student, A to Z; none for a time block. */
function participantsOf(booking: Booking): readonly string[] {
  return booking instanceof Meeting
    ? byName(booking.participants).map((participant) => participant.name)
    : []
}

/** How the grid draws its bookings: whether it is locked, and whose meetings it singles out. */
export interface Drawing {
  /** Whether the schedule is locked: no remove marks, no handles. */
  readonly isLocked?: boolean | undefined
  /** The participant whose meetings stand out, every other booking dimmed; none when absent. */
  readonly participant?: Participant | undefined
  /** The category whose meetings stand out, every other booking dimmed; none when absent. */
  readonly category?: Category | undefined
}

/**
 * Whether a booking is dimmed: a participant or a category is singled out, and it is a meeting
 * that is not one of theirs. A time block is never dimmed: it is the Organizer's own time.
 */
function isDimmed(booking: Booking, drawing: Drawing): boolean {
  if (booking.isTimeBlock) {
    return false
  }
  const { participant, category } = drawing
  if (participant !== undefined) {
    return !(booking instanceof Meeting && booking.hasParticipant(participant))
  }
  if (category !== undefined) {
    return !(booking instanceof Meeting && booking.category === category)
  }
  return false
}

function dimmedClass(booking: Booking, drawing: Drawing): string {
  return isDimmed(booking, drawing) ? 'dimmed' : ''
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
  const tentative = booking instanceof Meeting && booking.isTentative ? ' tentative' : ''
  return `${kindClass(booking)} ${cadenceClass(booking)}${tentative}`
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

/** How many participants a meeting names on the grid before it counts the others. */
const namesWritten = 2

/**
 * The participants of a meeting, as the grid writes them: two names at most, then how many
 * others, as in Ana, Bo +10. Its description, on hover and to a screen reader, names them all.
 */
export function participantsWritten(names: readonly string[]): string {
  const written = names.slice(0, namesWritten).join(', ')
  const others = names.length - namesWritten
  return others > 0 ? `${written} +${others}` : written
}

/**
 * The participants of a meeting on the grid: all of them, as many lines as its height allows;
 * the short form, two names and how many others, kept for `fitParticipants` when they do not fit.
 */
function participantsLine(booking: Booking): Markup | string {
  const people = participantsOf(booking)
  if (people.length === 0) {
    return ''
  }
  const all = people.join(', ')
  const short = participantsWritten(people)
  return html`<span class="booking-participants" data-all="${all}" data-short="${short}">${all}</span>`
}

/**
 * Writes on each meeting of the grid all its participants where they fit, and the short form, two
 * names and how many others, where they do not. Done once the grid is laid out, and again when
 * the window is resized.
 */
export function fitParticipants(grid: ParentNode): void {
  for (const line of grid.querySelectorAll<HTMLElement>('.booking-participants')) {
    line.textContent = line.dataset.all ?? ''
    if (line.scrollHeight > line.clientHeight + 1) {
      line.textContent = line.dataset.short ?? ''
    }
  }
}

/**
 * The class a booking's length is drawn with, so that a short one stays readable: `short`, its
 * title and time on one line, for half an hour or less; `shortest` too, its title alone, for a
 * quarter.
 */
export function lengthClass(booking: Booking): string {
  const { quarters } = booking.duration
  if (quarters === 1) {
    return 'short shortest'
  }
  return quarters === 2 ? 'short' : ''
}

function wholeBooking(booking: Booking, rank: number, drawing: Drawing): Markup {
  const isLocked = drawing.isLocked === true
  const name = accessibleNameOf(booking)
  return html`<div class="booking ${classesOf(booking)} ${lengthClass(booking)} ${dimmedClass(booking, drawing)}"
    style="grid-row: ${rowsOf(booking)}" data-booking="${rank}" role="button" tabindex="0"
    aria-label="${name}" title="${name}">
    <span class="booking-title">${labelOf(booking)}</span>
    <span class="booking-time">${timeOf(booking)}</span>
    ${participantsLine(booking)}
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

/**
 * The half of the day column a bi-weekly booking leaves empty on the overview, where the other
 * week has nothing at that time: outlined, so that the overview shows the booking alternates.
 */
function emptyHalf(piece: Piece, week: Week): Markup | string {
  return piece.isShared
    ? ''
    : html`<div class="empty-half ${weekClass(week)}" style="grid-row: ${rowsOf(piece)}" aria-hidden="true"></div>`
}

/**
 * A booking on its tab, whole. On the overview, a bi-weekly booking takes the half of the day
 * column that is its week's, week A the left, week B the right, and the other half is outlined
 * where the other week has nothing; a weekly booking takes both halves.
 */
function bookingOnTab(
  booking: Booking,
  rank: number,
  tab: Tab,
  schedule: Schedule,
  drawing: Drawing,
): Markup {
  const week = booking.cadence.week
  if (tab !== 'overview' || week === undefined) {
    return wholeBooking(booking, rank, drawing)
  }
  const empty = piecesOf(booking, schedule).map((piece) => emptyHalf(piece, week))
  return html`${wholeBooking(booking, rank, drawing)}${empty}`
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
 * The toggles of a day, saying where the Organizer is on it: one for the week of the tab. On the
 * overview, one for both weeks when they say the same, else one for each, marked with its letter.
 * Each goes from not said, to on campus, to remote, and back.
 */
function presenceToggles(schedule: Schedule, tab: Tab, weekday: Weekday, drawing: Drawing): Markup {
  const shown = weekOf(tab)
  const isAlike = schedule.presenceOn(Week.a, weekday) === schedule.presenceOn(Week.b, weekday)
  const isLocked = drawing.isLocked === true
  if (shown !== undefined || isAlike) {
    const week = shown ?? Week.a
    return html`<span class="presences">${presenceToggle(schedule, weekday, week, {
      weekKey: shown === undefined ? 'both' : week.key,
      letter: undefined,
      isLocked,
    })}</span>`
  }
  return html`<span class="presences">${Week.all.map((week) =>
    presenceToggle(schedule, weekday, week, { weekKey: week.key, letter: week, isLocked }),
  )}</span>`
}

/** A toggle of a day: for a week, or for both (`both`); marked with the letter of its week when given. */
function presenceToggle(
  schedule: Schedule,
  weekday: Weekday,
  week: Week,
  shownAs: {
    readonly weekKey: string
    readonly letter: Week | undefined
    readonly isLocked: boolean
  },
): Markup {
  const presence = schedule.presenceOn(week, weekday)
  const label = presenceLabel(weekday.name, shownAs.letter?.name, presence?.name)
  const letter =
    shownAs.letter === undefined
      ? ''
      : html`<span class="presence-week">${shownAs.letter.key}</span>`
  const weekClassName = shownAs.letter === undefined ? '' : weekClass(shownAs.letter)
  return html`<button type="button" class="presence ${presence?.key ?? 'unsaid'} ${weekClassName}"
    data-presence-week="${shownAs.weekKey}" data-presence-weekday="${weekday.key}"
    aria-label="${label}" title="${label}" ${shownAs.isLocked ? 'disabled' : ''}>${presenceIcon(presence?.key)}${letter}</button>`
}

/**
 * The grid of a tab: a weekday per column, a quarter of the day per row, and its bookings, each
 * by its rank among the bookings of the schedule; without remove marks or handles while locked.
 */
export function gridOf(schedule: Schedule, tab: Tab, drawing: Drawing = {}): Markup {
  const shown = schedule.bookings
    .map((booking, rank) => ({ booking, rank }))
    .filter(({ booking }) => isShownOn(booking, tab))
  const columns = Weekday.all.map(
    (weekday) =>
      html`<div class="day" data-weekday="${weekday.key}">${shown
        .filter(({ booking }) => booking.weekday === weekday)
        .map(({ booking, rank }) => bookingOnTab(booking, rank, tab, schedule, drawing))}</div>`,
  )
  return html`<div class="week" data-shows="${tab}" style="--quarters: ${theDay.quarterCount}">
    <div class="corner"></div>
    ${Weekday.all.map(
      (weekday) =>
        html`<div class="weekday">${weekday.name}${presenceToggles(schedule, tab, weekday, drawing)}</div>`,
    )}
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
  const isOverview = grid.querySelector('.week[data-shows="overview"]') !== null
  const isLeft = x < box.left + box.width / 2
  const half = isLeft ? Week.a : Week.b
  return {
    weekday,
    quarter: Math.min(Math.max(quarter, 0), theDay.quarterCount - 1),
    ...(isOverview ? { half } : {}),
  }
}
