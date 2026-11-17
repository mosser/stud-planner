import { Cadence, Parity } from '../domain/cadence.ts'
import { Duration } from '../domain/duration.ts'
import {
  meetingBroken,
  meetingOfTheFile,
  meetingsOverlap,
  missingField,
  notAScheduleFile,
  notJson,
  overlap,
  unknownField,
  unknownVersion,
  valueNotAllowed,
} from '../domain/findings.ts'
import { Meeting } from '../domain/meeting.ts'
import { Schedule } from '../domain/schedule.ts'
import { TimeOfDay } from '../domain/time-of-day.ts'
import { Weekday } from '../domain/weekday.ts'

/** The name the schedule file is saved under (ADR 0007). */
export const scheduleFileName = 'stud-planner-schedule.json'

const format = 'stud-planner/schedule'
const version = 1
const scheduleFields = ['format', 'version', 'meetings']
const meetingFields = ['title', 'cadence', 'parity', 'weekday', 'start', 'duration', 'note']
const theSchedule = 'the schedule'

/** A meeting as the schedule file holds it. */
interface MeetingContent {
  readonly title: string
  readonly cadence: string
  readonly parity?: string
  readonly weekday: string
  readonly start: string
  readonly duration: number
  readonly note?: string
}

/** The schedule as the schedule file holds it, and as the browser keeps it (ADR 0006). */
export interface ScheduleContent {
  readonly format: string
  readonly version: number
  readonly meetings: readonly MeetingContent[]
}

/** What reading a schedule file gives: the schedule, or why the file is refused. */
export type ScheduleRead =
  | { readonly isRefused: false; readonly schedule: Schedule }
  | { readonly isRefused: true; readonly reason: string }

function contentOfMeeting(meeting: Meeting): MeetingContent {
  return {
    title: meeting.title,
    cadence: meeting.cadence.key,
    ...(meeting.cadence.parity === undefined ? {} : { parity: meeting.cadence.parity.key }),
    weekday: meeting.weekday.key,
    start: meeting.start.toString(),
    duration: meeting.duration.minutes,
    ...(meeting.note === undefined ? {} : { note: meeting.note }),
  }
}

/** The content of the schedule file of a schedule, in `docs/specs/schedule-file.md`. */
export function contentOf(schedule: Schedule): ScheduleContent {
  return { format, version, meetings: schedule.meetings.map(contentOfMeeting) }
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
function valueOf<T>(
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
  const key = valueOf(part, record, 'cadence', (value) =>
    value === 'weekly' || value === 'bi-weekly' ? value : undefined,
  )
  if (key === 'weekly') {
    if ('parity' in record) {
      throw new Refusal(valueNotAllowed(part, 'parity', record.parity))
    }
    return Cadence.weekly
  }
  const parity = valueOf(part, record, 'parity', (value) =>
    typeof value === 'string' ? Parity.withKey(value) : undefined,
  )
  return Cadence.biWeekly(parity)
}

function meetingOf(part: string, value: unknown): Meeting {
  if (!isRecord(value)) {
    throw new Refusal(valueNotAllowed(theSchedule, 'meetings', value))
  }
  checkFields(part, value, meetingFields)
  const description = {
    title: valueOf(part, value, 'title', text),
    cadence: cadenceOf(part, value),
    weekday: valueOf(part, value, 'weekday', weekday),
    start: valueOf(part, value, 'start', time),
    duration: valueOf(part, value, 'duration', duration),
    note: 'note' in value ? valueOf(part, value, 'note', text) : undefined,
  }
  try {
    return new Meeting(description)
  } catch (error) {
    throw new Refusal(meetingBroken(part, (error as Error).message))
  }
}

function scheduleOf(content: unknown): Schedule {
  if (!isRecord(content) || content.format !== format) {
    throw new Refusal(notAScheduleFile())
  }
  checkFields(theSchedule, content, scheduleFields)
  if (required(theSchedule, content, 'version') !== version) {
    throw new Refusal(unknownVersion(content.version))
  }
  const meetings = valueOf(theSchedule, content, 'meetings', (value) =>
    Array.isArray(value) ? (value as unknown[]) : undefined,
  ).map((value, index) => meetingOf(meetingOfTheFile(index + 1), value))
  const pair = Schedule.firstOverlapAmong(meetings)
  if (pair !== undefined) {
    const [meeting, other] = pair
    const part = meetingOfTheFile(meetings.indexOf(other) + 1)
    const otherPart = meetingOfTheFile(meetings.indexOf(meeting) + 1)
    throw new Refusal(meetingsOverlap(part, otherPart, overlap(meeting, other)))
  }
  return new Schedule(meetings)
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
