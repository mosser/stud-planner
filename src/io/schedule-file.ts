import type { Booking, Timing } from '../domain/booking.ts'
import { Cadence, Week } from '../domain/cadence.ts'
import { Duration } from '../domain/duration.ts'
import {
  bookingBroken,
  bookingsOverlap,
  meetingOfTheFile,
  missingField,
  notAScheduleFile,
  notJson,
  overlap,
  timeBlockOfTheFile,
  unknownField,
  unknownVersion,
  valueNotAllowed,
} from '../domain/findings.ts'
import { Meeting } from '../domain/meeting.ts'
import { Schedule } from '../domain/schedule.ts'
import { TimeBlock } from '../domain/time-block.ts'
import { TimeOfDay } from '../domain/time-of-day.ts'
import { Weekday } from '../domain/weekday.ts'

/** The name the schedule file is saved under (ADR 0007). */
export const scheduleFileName = 'stud-planner-schedule.json'

const format = 'stud-planner/schedule'
/** The version written; every version ever written is read (ADR 0007). */
const version = 2
const scheduleFields = ['format', 'version', 'meetings', 'timeBlocks']
/**
 * How a version of the schedule file writes the week of a bi-weekly booking: version 2 as `week`,
 * A or B; version 1 as `parity`, odd for week A and even for week B.
 */
interface WeekWritten {
  readonly field: string
  readonly weeks: Readonly<Record<string, Week>>
}

const weekWritten: Readonly<Record<number, WeekWritten>> = {
  1: { field: 'parity', weeks: { odd: Week.a, even: Week.b } },
  2: { field: 'week', weeks: { A: Week.a, B: Week.b } },
}

/** What a part of a file is read with: its version's way of writing the week. */
interface Reading {
  readonly part: string
  readonly written: WeekWritten
}

function timingFields(written: WeekWritten): string[] {
  return ['cadence', written.field, 'weekday', 'start', 'duration']
}
const theSchedule = 'the schedule'

/** When a booking takes its slots, as the schedule file holds it. */
interface TimingContent {
  readonly cadence: string
  readonly week?: string
  readonly weekday: string
  readonly start: string
  readonly duration: number
}

/** A meeting as the schedule file holds it. */
interface MeetingContent extends TimingContent {
  readonly title: string
  readonly note?: string
}

/** A time block as the schedule file holds it. */
interface TimeBlockContent extends TimingContent {
  readonly title?: string
}

/** The schedule as the schedule file holds it, and as the browser keeps it (ADR 0006). */
export interface ScheduleContent {
  readonly format: string
  readonly version: number
  readonly meetings: readonly MeetingContent[]
  readonly timeBlocks: readonly TimeBlockContent[]
}

/** What reading a schedule file gives: the schedule, or why the file is refused. */
export type ScheduleRead =
  | { readonly isRefused: false; readonly schedule: Schedule }
  | { readonly isRefused: true; readonly reason: string }

function contentOfTiming(booking: Booking): TimingContent {
  return {
    cadence: booking.cadence.key,
    ...(booking.cadence.week === undefined ? {} : { week: booking.cadence.week.key }),
    weekday: booking.weekday.key,
    start: booking.start.toString(),
    duration: booking.duration.minutes,
  }
}

function contentOfMeeting(meeting: Meeting): MeetingContent {
  return {
    title: meeting.title,
    ...contentOfTiming(meeting),
    ...(meeting.note === undefined ? {} : { note: meeting.note }),
  }
}

function contentOfTimeBlock(block: TimeBlock): TimeBlockContent {
  return {
    ...(block.title === undefined ? {} : { title: block.title }),
    ...contentOfTiming(block),
  }
}

/** The content of the schedule file of a schedule, in `docs/specs/schedule-file.md`. */
export function contentOf(schedule: Schedule): ScheduleContent {
  return {
    format,
    version,
    meetings: schedule.meetings.map(contentOfMeeting),
    timeBlocks: schedule.timeBlocks.map(contentOfTimeBlock),
  }
}

/** The text of the schedule file of a schedule: JSON, indented, ending with a new line. */
export function scheduleFileOf(schedule: Schedule): string {
  return `${JSON.stringify(contentOf(schedule), null, 2)}\n`
}

/** Thrown while reading, with the reason the file is refused; caught before it leaves. */
class Refusal extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function checkFields(part: string, record: Record<string, unknown>, allowed: string[]): void {
  const unknown = Object.keys(record).find((field) => !allowed.includes(field))
  if (unknown !== undefined) {
    throw new Refusal(unknownField(part, unknown))
  }
}

function required(part: string, record: Record<string, unknown>, field: string): unknown {
  if (!(field in record)) {
    throw new Refusal(missingField(part, field))
  }
  return record[field]
}

/** The value of the field read by `read`, or a refusal when `read` finds nothing in it. */
function fieldRead<T>(
  part: string,
  record: Record<string, unknown>,
  field: string,
  read: (value: unknown) => T | undefined,
): T {
  const value = required(part, record, field)
  const found = read(value)
  if (found === undefined) {
    throw new Refusal(valueNotAllowed(part, field, value))
  }
  return found
}

const text = (value: unknown) => (typeof value === 'string' ? value : undefined)
const weekday = (value: unknown) => (typeof value === 'string' ? Weekday.withKey(value) : undefined)
const time = (value: unknown) => (typeof value === 'string' ? TimeOfDay.parse(value) : undefined)

function duration(value: unknown): Duration | undefined {
  try {
    return typeof value === 'number' ? new Duration(value) : undefined
  } catch {
    return undefined
  }
}

function cadenceOf({ part, written }: Reading, record: Record<string, unknown>): Cadence {
  const key = fieldRead(part, record, 'cadence', (value) =>
    value === 'weekly' || value === 'bi-weekly' ? value : undefined,
  )
  if (key === 'weekly') {
    if (written.field in record) {
      throw new Refusal(valueNotAllowed(part, written.field, record[written.field]))
    }
    return Cadence.weekly
  }
  const week = fieldRead(part, record, written.field, (value) =>
    typeof value === 'string' && Object.hasOwn(written.weeks, value)
      ? written.weeks[value]
      : undefined,
  )
  return Cadence.biWeekly(week)
}

function timingOf(reading: Reading, record: Record<string, unknown>): Timing {
  const { part } = reading
  return {
    cadence: cadenceOf(reading, record),
    weekday: fieldRead(part, record, 'weekday', weekday),
    start: fieldRead(part, record, 'start', time),
    duration: fieldRead(part, record, 'duration', duration),
  }
}

/** The booking `build` makes, or a refusal that says which part of the file breaks a rule. */
function built<T extends Booking>(part: string, build: () => T): T {
  try {
    return build()
  } catch (error) {
    throw new Refusal(bookingBroken(part, (error as Error).message))
  }
}

function recordOf(list: string, value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Refusal(valueNotAllowed(theSchedule, list, value))
  }
  return value
}

function meetingOf(reading: Reading, value: unknown): Meeting {
  const { part } = reading
  const record = recordOf('meetings', value)
  checkFields(part, record, ['title', ...timingFields(reading.written), 'note'])
  const description = {
    title: fieldRead(part, record, 'title', text),
    ...timingOf(reading, record),
    note: 'note' in record ? fieldRead(part, record, 'note', text) : undefined,
  }
  return built(part, () => new Meeting(description))
}

function timeBlockOf(reading: Reading, value: unknown): TimeBlock {
  const { part } = reading
  const record = recordOf('timeBlocks', value)
  checkFields(part, record, ['title', ...timingFields(reading.written)])
  const description = {
    title: 'title' in record ? fieldRead(part, record, 'title', text) : undefined,
    ...timingOf(reading, record),
  }
  return built(part, () => new TimeBlock(description))
}

function listOf(content: Record<string, unknown>, field: string): unknown[] {
  return fieldRead(theSchedule, content, field, (value) =>
    Array.isArray(value) ? (value as unknown[]) : undefined,
  )
}

function scheduleOf(content: unknown): Schedule {
  if (!isRecord(content) || content.format !== format) {
    throw new Refusal(notAScheduleFile())
  }
  checkFields(theSchedule, content, scheduleFields)
  const given = required(theSchedule, content, 'version')
  const written = typeof given === 'number' ? weekWritten[given] : undefined
  if (written === undefined) {
    throw new Refusal(unknownVersion(content.version))
  }
  const meetings = listOf(content, 'meetings').map((value, index) =>
    meetingOf({ part: meetingOfTheFile(index + 1), written }, value),
  )
  const timeBlocks = 'timeBlocks' in content ? listOf(content, 'timeBlocks') : []
  const blocks = timeBlocks.map((value, index) =>
    timeBlockOf({ part: timeBlockOfTheFile(index + 1), written }, value),
  )
  const partOf = new Map<Booking, string>([
    ...meetings.map((meeting, index) => [meeting, meetingOfTheFile(index + 1)] as const),
    ...blocks.map((block, index) => [block, timeBlockOfTheFile(index + 1)] as const),
  ])
  const pair = Schedule.firstOverlapAmong([...meetings, ...blocks])
  if (pair !== undefined) {
    const [booking, other] = pair
    const reason = overlap(booking, other)
    throw new Refusal(bookingsOverlap(partOf.get(other) ?? '', partOf.get(booking) ?? '', reason))
  }
  return new Schedule(meetings, blocks)
}

/** The schedule a schedule file's content holds, or why it is refused: nothing is taken then. */
export function scheduleFromContent(content: unknown): ScheduleRead {
  try {
    return { isRefused: false, schedule: scheduleOf(content) }
  } catch (error) {
    if (error instanceof Refusal) {
      return { isRefused: true, reason: error.message }
    }
    throw error
  }
}

/** The schedule a schedule file holds, or why it is refused: nothing is taken then. */
export function readScheduleFile(fileText: string): ScheduleRead {
  let content: unknown
  try {
    content = JSON.parse(fileText)
  } catch {
    return { isRefused: true, reason: notJson() }
  }
  return scheduleFromContent(content)
}
