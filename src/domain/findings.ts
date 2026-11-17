import type { Booking } from './booking.ts'
import type { Cadence } from './cadence.ts'
import type { Duration } from './duration.ts'
import type { TimeOfDay } from './time-of-day.ts'

/** A booking's time: 10:00 to 11:00. */
export function timeOf(booking: Booking): string {
  return `${booking.start} to ${booking.end}`
}

/** What a time block is called when it has no title. */
export const aTimeBlock = 'Time block'

/** What a booking is shown as: a meeting's title; a time block's, or Time block. */
export function labelOf(booking: Booking): string {
  return booking.title ?? aTimeBlock
}

/**
 * A booking named in a sentence: a meeting by its title; a time block as the time block Teaching,
 * or a time block when it has no title.
 */
export function nameOf(booking: Booking): string {
  if (!booking.isTimeBlock) {
    return booking.title ?? ''
  }
  return booking.title === undefined ? 'a time block' : `the time block ${booking.title}`
}

function aBooking(isTimeBlock: boolean): string {
  return isTimeBlock ? 'A time block' : 'A meeting'
}

/** A cadence as the interface writes it: weekly; bi-weekly, week A. */
export function cadenceWritten(cadence: Cadence): string {
  return cadence.week === undefined ? 'weekly' : `bi-weekly, ${cadence.week.name}`
}

/** A cadence as a choice of the meeting dialog: Weekly; Bi-weekly, week A. */
export function cadenceChoice(cadence: Cadence): string {
  const written = cadenceWritten(cadence)
  return written.charAt(0).toUpperCase() + written.slice(1)
}

/** A duration as the interface writes it: 15 min, 1 h, 1 h 30. */
export function durationWritten(duration: Duration): string {
  const hours = Math.floor(duration.minutes / 60)
  const minutes = duration.minutes % 60
  if (hours === 0) {
    return `${minutes} min`
  }
  return minutes === 0 ? `${hours} h` : `${hours} h ${String(minutes).padStart(2, '0')}`
}

/** Why a meeting cannot be without a title. */
export function needsATitle(): string {
  return 'A meeting needs a title.'
}

/** Why a meeting, or a time block, cannot start that early. */
export function startsBeforeTheDay(isTimeBlock: boolean, dayStart: TimeOfDay): string {
  return `${aBooking(isTimeBlock)} cannot start before ${dayStart}.`
}

/** Why a meeting, or a time block, cannot end that late. */
export function endsAfterTheDay(isTimeBlock: boolean, dayEnd: TimeOfDay): string {
  return `${aBooking(isTimeBlock)} cannot end after ${dayEnd}.`
}

/**
 * Why a booking cannot take its slots: the booking it would overlap, in the weeks both are held,
 * and when: Overlaps Lab meeting, week A, 10:00 to 11:00.
 */
export function overlap(booking: Booking, other: Booking): string {
  const weeks = booking.weeksSharedWith(other)
  const when = weeks.length === 1 ? weeks[0]?.name : 'every week'
  return `Overlaps ${nameOf(other)}, ${when}, ${timeOf(other)}.`
}

/** What the Organizer confirms before a booking leaves the schedule. */
export function removalQuestion(booking: Booking): string {
  return `Remove ${nameOf(booking)}, ${cadenceWritten(booking.cadence)}, ${booking.weekday.name} ${timeOf(booking)}?`
}

function counted(count: number, what: string): string {
  return count === 1 ? `1 ${what}` : `${count} ${what}s`
}

/** What the Organizer confirms before a schedule file replaces the schedule. */
export function replacementQuestion(
  meetingCount: number,
  timeBlockCount: number,
  fileName: string,
): string {
  const held = [counted(meetingCount, 'meeting')]
  if (timeBlockCount > 0) {
    held.push(counted(timeBlockCount, 'time block'))
  }
  return `Replace the ${held.join(' and ')} of the schedule with those of ${fileName}?`
}

/** What the screen says when the browser does not keep the schedule. */
export function notKept(): string {
  return 'This browser does not keep the schedule: closing the page loses it. Download it to keep a copy.'
}

/** What the screen says when the schedule the browser kept could not be read. */
export function setAside(): string {
  return 'The schedule this browser kept could not be read: it is set aside, and this schedule starts empty.'
}

/** What the screen says of a schedule file it refuses. */
export function fileRefused(fileName: string, reason: string): string {
  return `${fileName} is refused: ${reason}`
}

/** Why a file is refused: it is not JSON. */
export function notJson(): string {
  return 'it is not a schedule file, nor JSON.'
}

/** Why a file is refused: it is JSON, but not a schedule file. */
export function notAScheduleFile(): string {
  return 'it is not a schedule file.'
}

/** Why a file is refused: it is a schedule file of a version this system does not read. */
export function unknownVersion(version: unknown): string {
  return `it is a schedule file of version ${JSON.stringify(version)}, and this system reads versions 1 and 2.`
}

/** Why a file is refused: a part of it has a field missing. */
export function missingField(part: string, field: string): string {
  return `${part} has no ${field}.`
}

/** Why a file is refused: a part of it has a field the schedule file does not have. */
export function unknownField(part: string, field: string): string {
  return `${part} has a field ${field}, which a schedule file does not have.`
}

/** Why a file is refused: a field of a part of it has a value it cannot have. */
export function valueNotAllowed(part: string, field: string, value: unknown): string {
  return `${part} cannot have ${JSON.stringify(value)} as its ${field}.`
}

/** Why a file is refused: a meeting or a time block of it breaks one of its rules. */
export function bookingBroken(part: string, reason: string): string {
  return `${part}: ${reason}`
}

/** Why a file is refused: two of its bookings overlap. */
export function bookingsOverlap(part: string, otherPart: string, reason: string): string {
  return `${part} and ${otherPart} overlap. ${reason}`
}

/** A meeting of a schedule file, by its rank, the first being 1: meeting 3. */
export function meetingOfTheFile(rank: number): string {
  return `meeting ${rank}`
}

/** A time block of a schedule file, by its rank, the first being 1: time block 2. */
export function timeBlockOfTheFile(rank: number): string {
  return `time block ${rank}`
}
