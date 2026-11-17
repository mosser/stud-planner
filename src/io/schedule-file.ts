import type { Booking, Timing } from '../domain/booking.ts'
import { Cadence, Parity } from '../domain/cadence.ts'
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
const version = 1
const scheduleFields = ['format', 'version', 'meetings', 'timeBlocks']
const timingFields = ['cadence', 'parity', 'weekday', 'start', 'duration']
const meetingFields = ['title', ...timingFields, 'note']
const timeBlockFields = ['title', ...timingFields]
const theSchedule = 'the schedule'

/** When a booking takes its slots, as the schedule file holds it. */
interface TimingContent {
  readonly cadence: string
  readonly parity?: string
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
    ...(booking.cadence.parity === undefined ? {} : { parity: booking.cadence.parity.key }),
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

function cadenceOf(part: string, record: Record<string, unknown>): Cadence {
  const key = fieldRead(part, record, 'cadence', (value) =>
    value === 'weekly' || value === 'bi-weekly' ? value : undefined,
  )
  if (key === 'weekly') {
    if ('parity' in record) {
      throw new Refusal(valueNotAllowed(part, 'parity', record.parity))
    }
    return Cadence.weekly
  }
  const parity = fieldRead(part, record, 'parity', (value) =>
    typeof value === 'string' ? Parity.withKey(value) : undefined,
  )
  return Cadence.biWeekly(parity)
}

function timingOf(part: string, record: Record<string, unknown>): Timing {
  return {
    cadence: cadenceOf(part, record),
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

function meetingOf(part: string, value: unknown): Meeting {
  const record = recordOf('meetings', value)
  checkFields(part, record, meetingFields)
  const description = {
    title: fieldRead(part, record, 'title', text),
    ...timingOf(part, record),
    note: 'note' in record ? fieldRead(part, record, 'note', text) : undefined,
  }
  return built(part, () => new Meeting(description))
}

function timeBlockOf(part: string, value: unknown): TimeBlock {
  const record = recordOf('timeBlocks', value)
  checkFields(part, record, timeBlockFields)
  const description = {
    title: 'title' in record ? fieldRead(part, record, 'title', text) : undefined,
    ...timingOf(part, record),
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
  if (required(theSchedule, content, 'version') !== version) {
    throw new Refusal(unknownVersion(content.version))
  }
  const meetings = listOf(content, 'meetings').map((value, index) =>
    meetingOf(meetingOfTheFile(index + 1), value),
  )
  const timeBlocks = 'timeBlocks' in content ? listOf(content, 'timeBlocks') : []
  const blocks = timeBlocks.map((value, index) => timeBlockOf(timeBlockOfTheFile(index + 1), value))
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
