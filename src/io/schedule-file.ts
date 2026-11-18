import type { Booking, Timing } from '../domain/booking.ts'
import { Cadence, Week } from '../domain/cadence.ts'
import { Category } from '../domain/category.ts'
import { Duration } from '../domain/duration.ts'
import {
  bookingBroken,
  bookingsOverlap,
  dayOfTheFile,
  dayTwice,
  meetingOfTheFile,
  missingField,
  nameTaken,
  notAParticipant,
  notAScheduleFile,
  notJson,
  overlap,
  participantOfTheFile,
  timeBlockOfTheFile,
  unknownField,
  unknownVersion,
  valueNotAllowed,
} from '../domain/findings.ts'
import { Meeting, type MeetingDescription } from '../domain/meeting.ts'
import { Participant } from '../domain/participant.ts'
import { type DayPresence, Presence } from '../domain/presence.ts'
import { Schedule } from '../domain/schedule.ts'
import { TimeBlock } from '../domain/time-block.ts'
import { TimeOfDay } from '../domain/time-of-day.ts'
import { Weekday } from '../domain/weekday.ts'

/** The name the schedule file is downloaded under (ADR 0007). */
export const scheduleFileName = 'stud-planner-schedule.json'

const format = 'stud-planner/schedule'
/** The version written; every version ever written is read (ADR 0007). */
const version = 6

/**
 * How a version of the schedule file is written: the field and the values of the week of a
 * bi-weekly booking (version 1 as `parity`, odd for week A and even for week B; later ones as
 * `week`, A or B), whether it lists participants (from version 3), whether its meetings have
 * a category and its days say where the Organizer is (from version 4), whether a one-to-one
 * meeting names its student (from version 5), and whether a meeting may be tentative (from
 * version 6).
 */
interface WeekWritten {
  readonly field: string
  readonly weeks: Readonly<Record<string, Week>>
  readonly hasParticipants: boolean
  readonly hasCategoriesAndDays: boolean
  readonly hasStudents: boolean
  readonly hasTentative: boolean
}

const parity = { field: 'parity', weeks: { odd: Week.a, even: Week.b } }
const lettered = { field: 'week', weeks: { A: Week.a, B: Week.b } }
const before = { hasParticipants: false, hasCategoriesAndDays: false, hasStudents: false }
const weekWritten: Readonly<Record<number, WeekWritten>> = {
  1: { ...parity, ...before, hasTentative: false },
  2: { ...lettered, ...before, hasTentative: false },
  3: { ...lettered, ...before, hasParticipants: true, hasTentative: false },
  4: {
    ...lettered,
    ...before,
    hasParticipants: true,
    hasCategoriesAndDays: true,
    hasTentative: false,
  },
  5: {
    ...lettered,
    hasParticipants: true,
    hasCategoriesAndDays: true,
    hasStudents: true,
    hasTentative: false,
  },
  6: {
    ...lettered,
    hasParticipants: true,
    hasCategoriesAndDays: true,
    hasStudents: true,
    hasTentative: true,
  },
}

function scheduleFields(written: WeekWritten): string[] {
  const fields = ['format', 'version', 'meetings', 'timeBlocks']
  const participants = written.hasParticipants ? ['participants'] : []
  const days = written.hasCategoriesAndDays ? ['days'] : []
  return [...fields, ...participants, ...days]
}

/**
 * What a part of a file is read with: its version's way of writing the week, and the
 * participants the meetings may name.
 */
interface Reading {
  readonly part: string
  readonly written: WeekWritten
  /** The participants of the schedule: a file before students may add one, named by a title. */
  readonly participants: Participant[]
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

/**
 * A meeting as the schedule file holds it: its participants by name; a one-to-one meeting its
 * student by name, and no title.
 */
interface MeetingContent extends TimingContent {
  readonly title?: string
  readonly student?: string
  readonly note?: string
  readonly participants?: readonly string[]
  readonly category?: string
  /** Absent for a meeting confirmed. */
  readonly tentative?: boolean
}

/** A day of a week that says where the Organizer is, as the schedule file holds it. */
interface DayContent {
  readonly week: string
  readonly weekday: string
  readonly presence: string
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
  readonly participants: readonly string[]
  readonly days: readonly DayContent[]
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
    ...(meeting.student === undefined
      ? { title: meeting.title }
      : { student: meeting.student.name }),
    ...contentOfTiming(meeting),
    ...(meeting.note === undefined ? {} : { note: meeting.note }),
    ...(meeting.participants.length === 0
      ? {}
      : { participants: meeting.participants.map((participant) => participant.name) }),
    ...(meeting.category === undefined ? {} : { category: meeting.category.name }),
    ...(meeting.isTentative ? { tentative: true } : {}),
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
    participants: schedule.participants.map((participant) => participant.name),
    days: schedule.presences.map((day) => ({
      week: day.week.key,
      weekday: day.weekday.key,
      presence: day.presence.key,
    })),
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
function built<T>(part: string, build: () => T): T {
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

/** The student a one-to-one meeting names, a participant of the schedule. */
function studentOf(reading: Reading, record: Record<string, unknown>): Participant {
  const { part } = reading
  const name = fieldRead(part, record, 'student', text)
  const student = reading.participants.find((each) => each.isNamed(name))
  if (student === undefined) {
    throw new Refusal(bookingBroken(part, notAParticipant(name)))
  }
  return student
}

/** The participants a meeting names, each a participant of the schedule. */
function participantsOf(reading: Reading, record: Record<string, unknown>): Participant[] {
  const { part } = reading
  const names = fieldRead(part, record, 'participants', (value) =>
    Array.isArray(value) && value.every((name) => typeof name === 'string')
      ? (value as string[])
      : undefined,
  )
  return names.map((name) => {
    const participant = reading.participants.find((each) => each.isNamed(name))
    if (participant === undefined) {
      throw new Refusal(bookingBroken(part, notAParticipant(name)))
    }
    return participant
  })
}

function meetingOf(reading: Reading, value: unknown): Meeting {
  const { part } = reading
  const record = recordOf('meetings', value)
  const participantsField = reading.written.hasParticipants ? ['participants'] : []
  checkFields(part, record, [
    'title',
    ...timingFields(reading.written),
    'note',
    ...participantsField,
    ...(reading.written.hasCategoriesAndDays ? ['category'] : []),
    ...(reading.written.hasStudents ? ['student'] : []),
    ...(reading.written.hasTentative ? ['tentative'] : []),
  ])
  const description = {
    title: 'student' in record ? undefined : fieldRead(part, record, 'title', text),
    student: 'student' in record ? studentOf(reading, record) : undefined,
    ...timingOf(reading, record),
    note: 'note' in record ? fieldRead(part, record, 'note', text) : undefined,
    participants: 'participants' in record ? participantsOf(reading, record) : [],
    category:
      'category' in record
        ? fieldRead(part, record, 'category', (value) =>
            typeof value === 'string' ? Category.named(value) : undefined,
          )
        : undefined,
    isTentative:
      'tentative' in record
        ? fieldRead(part, record, 'tentative', (value) =>
            typeof value === 'boolean' ? value : undefined,
          )
        : false,
  }
  if (!reading.written.hasStudents && description.category?.isOneToOne === true) {
    return built(part, () => new Meeting(namedAfterItsStudent(reading, description)))
  }
  return built(part, () => new Meeting(description))
}

/**
 * A one-to-one meeting of a file written before students, which has a title: its student is the
 * participant of that name, made one of the schedule when none has it, and the meeting is named
 * after them.
 */
function namedAfterItsStudent(
  reading: Reading,
  description: MeetingDescription,
): MeetingDescription {
  const title = description.title ?? ''
  let student = reading.participants.find((participant) => participant.isNamed(title))
  if (student === undefined) {
    student = built(reading.part, () => new Participant(title))
    reading.participants.push(student)
  }
  const others = (description.participants ?? []).filter((participant) => participant !== student)
  return { ...description, title: undefined, student, participants: others }
}

/** The days of the weeks that say where the Organizer is, each once. */
function daysOf(content: Record<string, unknown>): DayPresence[] {
  if (!('days' in content)) {
    return []
  }
  const days: DayPresence[] = []
  listOf(content, 'days').forEach((value, index) => {
    const part = dayOfTheFile(index + 1)
    const record = recordOf('days', value)
    checkFields(part, record, ['week', 'weekday', 'presence'])
    const day = {
      week: fieldRead(part, record, 'week', (each) =>
        typeof each === 'string' ? Week.withKey(each) : undefined,
      ),
      weekday: fieldRead(part, record, 'weekday', weekday),
      presence: fieldRead(part, record, 'presence', (each) =>
        typeof each === 'string' ? Presence.withKey(each) : undefined,
      ),
    }
    if (days.some((before) => before.week === day.week && before.weekday === day.weekday)) {
      throw new Refusal(bookingBroken(part, dayTwice(day.weekday.name, day.week.name)))
    }
    days.push(day)
  })
  return days
}

/** The participants of the schedule, by name, no two with the same name. */
function rosterOf(content: Record<string, unknown>): Participant[] {
  if (!('participants' in content)) {
    return []
  }
  const roster: Participant[] = []
  listOf(content, 'participants').forEach((value, index) => {
    const part = participantOfTheFile(index + 1)
    if (typeof value !== 'string') {
      throw new Refusal(valueNotAllowed(part, 'name', value))
    }
    const participant = built(part, () => new Participant(value))
    if (roster.some((each) => each.isNamed(participant.name))) {
      throw new Refusal(bookingBroken(part, nameTaken(participant.name)))
    }
    roster.push(participant)
  })
  return roster
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
  const given = required(theSchedule, content, 'version')
  const written = typeof given === 'number' ? weekWritten[given] : undefined
  if (written === undefined) {
    throw new Refusal(unknownVersion(content.version))
  }
  checkFields(theSchedule, content, scheduleFields(written))
  const participants = rosterOf(content)
  const meetings = listOf(content, 'meetings').map((value, index) =>
    meetingOf({ part: meetingOfTheFile(index + 1), written, participants }, value),
  )
  const timeBlocks = 'timeBlocks' in content ? listOf(content, 'timeBlocks') : []
  const blocks = timeBlocks.map((value, index) =>
    timeBlockOf({ part: timeBlockOfTheFile(index + 1), written, participants }, value),
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
  return new Schedule(meetings, blocks, participants, daysOf(content))
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
