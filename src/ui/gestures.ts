import type { Booking } from '../domain/booking.ts'
import { Cadence, Week } from '../domain/cadence.ts'
import { theDay } from '../domain/day.ts'
import { Duration } from '../domain/duration.ts'
import type { Schedule } from '../domain/schedule.ts'
import type { TimeOfDay } from '../domain/time-of-day.ts'
import type { Weekday } from '../domain/weekday.ts'

/** The three grids the screen shows, one at a time. */
export type Tab = 'overview' | 'a' | 'b'

/** The tabs, in the order the screen shows them. */
export const tabs: readonly Tab[] = ['overview', 'a', 'b']

/** The week a tab shows, or absent for the overview, which shows both. */
export function weekOf(tab: Tab): Week | undefined {
  if (tab === 'overview') {
    return undefined
  }
  return tab === 'a' ? Week.a : Week.b
}

/** A slot pointed at: a weekday and the rank of a quarter of the day, the first being 0. */
export interface Slot {
  readonly weekday: Weekday
  readonly quarter: number
}

/** Where a new meeting goes: its weekday, its start and its duration. */
export interface Span {
  readonly weekday: Weekday
  readonly start: TimeOfDay
  readonly duration: Duration
}

/** The quarters of an hour. */
const quartersInAnHour = 4

function isFree(schedule: Schedule, cadence: Cadence, weekday: Weekday, quarter: number): boolean {
  return schedule.isFree(weekday, theDay.timeOfQuarter(quarter), cadence)
}

/**
 * The cadence a booking added from a free slot is offered: bi-weekly in the week of the tab, or,
 * on the overview, weekly. Absent from a slot taken in a week the cadence is held in.
 */
export function cadenceOffered(schedule: Schedule, tab: Tab, slot: Slot): Cadence | undefined {
  const week = weekOf(tab)
  const cadence = week === undefined ? Cadence.weekly : Cadence.biWeekly(week)
  return isFree(schedule, cadence, slot.weekday, slot.quarter) ? cadence : undefined
}

/**
 * The cadences a booking added from a tab may have. From a week, it is held in that week: weekly,
 * or bi-weekly in it. From the overview, it is held in both: weekly.
 */
export function cadencesAddedFrom(tab: Tab): readonly Cadence[] {
  const week = weekOf(tab)
  if (week === undefined) {
    return [Cadence.weekly]
  }
  return Cadence.all.filter((cadence) => cadence.isHeldIn(week))
}

/**
 * The span marked by pressing a free slot and dragging to a quarter of the same weekday: from the
 * slot pressed to that quarter, over free slots only, stopping before the first taken one.
 */
export function spanDragged(
  schedule: Schedule,
  cadence: Cadence,
  pressed: Slot,
  quarter: number,
): Span {
  const direction = Math.sign(quarter - pressed.quarter)
  let reached = pressed.quarter
  while (reached !== quarter && isFree(schedule, cadence, pressed.weekday, reached + direction)) {
    reached += direction
  }
  const first = Math.min(pressed.quarter, reached)
  const last = Math.max(pressed.quarter, reached)
  return {
    weekday: pressed.weekday,
    start: theDay.timeOfQuarter(first),
    duration: Duration.ofQuarters(last - first + 1),
  }
}

/**
 * The span marked by a press without a drag: one hour, or less when a taken slot or the end of
 * the day comes first.
 */
export function spanPressed(schedule: Schedule, cadence: Cadence, pressed: Slot): Span {
  const lastQuarter = Math.min(pressed.quarter + quartersInAnHour - 1, theDay.quarterCount - 1)
  return spanDragged(schedule, cadence, pressed, lastQuarter)
}

/**
 * The booking dragged to a slot, held by the quarter it was pressed at: on the slot's weekday,
 * lasting as long, within the day.
 */
export function bookingMoved(booking: Booking, heldAt: number, slot: Slot): Booking {
  const latestStart = theDay.quarterCount - booking.duration.quarters
  const quarter = Math.min(Math.max(slot.quarter - heldAt, 0), latestStart)
  return booking.afterMovingTo(slot.weekday, theDay.timeOfQuarter(quarter))
}

/** The booking whose lower edge is dragged to a quarter: ending with it, one quarter at least. */
export function bookingResized(booking: Booking, slot: Slot): Booking {
  const quarters = Math.max(slot.quarter - theDay.quarterAt(booking.start) + 1, 1)
  return booking.afterResizingTo(Duration.ofQuarters(quarters))
}
