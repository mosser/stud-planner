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

/**
 * What a booking is shown as: a meeting by its title and its category, Kalvin | PhD, or its title
 * alone when it has no category; a time block by its title, or Time block.
 */
export function labelOf(booking: Booking): string {
  if (booking.isTimeBlock) {
    return booking.title ?? aTimeBlock
  }
  const { category } = booking as Booking & { readonly category?: { readonly name: string } }
  const title = booking.title ?? ''
  const isSaid =
    category === undefined || title.toLocaleLowerCase() === category.name.toLocaleLowerCase()
  return isSaid ? title : `${title} | ${category.name}`
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

/** The weeks of a booking as a choice of its dialog: Both weeks; Week A. */
export function cadenceChoice(cadence: Cadence): string {
  const written = weeksWritten(cadence)
  return written.charAt(0).toUpperCase() + written.slice(1)
}

/** The weeks a booking is held in, as the interface writes them: both weeks; week A. */
export function weeksWritten(cadence: Cadence): string {
  return cadence.week === undefined ? 'both weeks' : cadence.week.name
}

/** The heading of the dialog of a booking added: New meeting in week A; New time block in both weeks. */
export function newBookingHeading(isTimeBlock: boolean, cadence: Cadence): string {
  return `New ${isTimeBlock ? 'time block' : 'meeting'} in ${weeksWritten(cadence)}`
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

/**
 * Where the Organizer is on a day, as its toggle is named: Monday: on campus; Monday, week B:
 * remote; Monday: on campus or remote, not said.
 */
export function presenceLabel(
  weekday: string,
  week: string | undefined,
  presence: string | undefined,
): string {
  const day = week === undefined ? weekday : `${weekday}, ${week}`
  return `${day}: ${presence === undefined ? 'on campus or remote, not said' : presence.toLocaleLowerCase()}`
}

/** Why a day of a week cannot say twice where the Organizer is. */
export function dayTwice(weekday: string, week: string): string {
  return `${weekday} of ${week} says twice where the Organizer is.`
}

/** Why a one-to-one meeting cannot be without its student. */
export function needsAStudent(): string {
  return 'A one-to-one meeting needs a student.'
}

/** Why a meeting that is not one-to-one cannot have a student. */
export function studentOnlyOneToOne(): string {
  return 'Only a one-to-one meeting has a student.'
}

/** Why a meeting cannot be without a category. */
export function needsACategory(): string {
  return 'A meeting needs a category.'
}

/** Why a participant cannot be without a name. */
export function needsAName(): string {
  return 'A participant needs a name.'
}

/** Why a meeting cannot name a participant twice. */
export function participantTwice(name: string): string {
  return `A meeting names ${name} twice.`
}

/** Why a participant cannot be named so: another participant of the schedule is. */
export function nameTaken(name: string): string {
  return `There is already a participant named ${name}.`
}

/** Why a meeting cannot name someone: they are not a participant of the schedule. */
export function notAParticipant(name: string): string {
  return `${name} is not a participant of the schedule.`
}

/** What the Organizer confirms before a participant who takes part in meetings leaves the schedule. */
export function participantRemovalQuestion(
  name: string,
  meetingCount: number,
  oneToOneCount = 0,
): string {
  const meetings = meetingCount === 1 ? '1 meeting' : `${meetingCount} meetings`
  const question = `Remove ${name} from the participants, and from ${meetings}?`
  if (oneToOneCount === 0) {
    return question
  }
  const theirs =
    oneToOneCount === 1
      ? 'Their one-to-one meeting goes'
      : `Their ${oneToOneCount} one-to-one meetings go`
  return `${question} ${theirs} too.`
}

/** Who takes part in a meeting, as the interface writes it: with Ana and Bo. */
export function withParticipants(names: readonly string[]): string {
  if (names.length <= 1) {
    return names.length === 0 ? '' : `with ${names[0]}`
  }
  return `with ${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
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
  counts: { readonly meetings: number; readonly timeBlocks: number; readonly participants: number },
  fileName: string,
): string {
  const held = [counted(counts.meetings, 'meeting')]
  if (counts.timeBlocks > 0) {
    held.push(counted(counts.timeBlocks, 'time block'))
  }
  if (counts.participants > 0) {
    held.push(counted(counts.participants, 'participant'))
  }
  const listed = held.length > 1 ? `${held.slice(0, -1).join(', ')} and ${held.at(-1)}` : held[0]
  return `Replace the ${listed} of the schedule with those of ${fileName}?`
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
  return `it is a schedule file of version ${JSON.stringify(version)}, and this system reads versions 1 to 5.`
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

/** A day of a schedule file, by its rank, the first being 1: day 2. */
export function dayOfTheFile(rank: number): string {
  return `day ${rank}`
}

/** A participant of a schedule file, by its rank, the first being 1: participant 2. */
export function participantOfTheFile(rank: number): string {
  return `participant ${rank}`
}

/** A time block of a schedule file, by its rank, the first being 1: time block 2. */
export function timeBlockOfTheFile(rank: number): string {
  return `time block ${rank}`
}
