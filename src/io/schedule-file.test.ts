import { describe, expect, it } from 'vitest'
import { Cadence, Parity } from '../domain/cadence.ts'
import { aMeeting, at } from '../domain/meeting.fixture.ts'
import { Schedule } from '../domain/schedule.ts'
import { Weekday } from '../domain/weekday.ts'
import {
  contentOf,
  readScheduleFile,
  type ScheduleRead,
  scheduleFileName,
  scheduleFileOf,
  scheduleFromContent,
} from './schedule-file.ts'

const schedule = new Schedule([
  aMeeting({ note: 'Room 201' }),
  aMeeting({ title: 'Ana', cadence: Cadence.biWeekly(Parity.odd), weekday: Weekday.tuesday }),
  aMeeting({
    title: 'Bo',
    cadence: Cadence.biWeekly(Parity.even),
    weekday: Weekday.tuesday,
    start: at('16:30'),
  }),
])

const aMeetingContent = {
  title: 'Lab meeting',
  cadence: 'weekly',
  weekday: 'monday',
  start: '10:00',
  duration: 60,
}

function reasonOf(read: ScheduleRead): string {
  return read.isRefused ? read.reason : 'taken'
}

function fileWith(meetings: unknown[], fields: Record<string, unknown> = {}): unknown {
  return { format: 'stud-planner/schedule', version: 1, meetings, ...fields }
}

describe('the schedule file', () => {
  it('is saved as stud-planner-schedule.json', () => {
    expect(scheduleFileName).toBe('stud-planner-schedule.json')
  })

  it('writes each meeting as the specification lists, a parity for a bi-weekly one only', () => {
    expect(contentOf(schedule)).toEqual({
      format: 'stud-planner/schedule',
      version: 1,
      meetings: [
        { ...aMeetingContent, note: 'Room 201' },
        {
          title: 'Ana',
          cadence: 'bi-weekly',
          parity: 'odd',
          weekday: 'tuesday',
          start: '10:00',
          duration: 60,
        },
        {
          title: 'Bo',
          cadence: 'bi-weekly',
          parity: 'even',
          weekday: 'tuesday',
          start: '16:30',
          duration: 60,
        },
      ],
    })
  })

  it('reads back the schedule it wrote', () => {
    const read = readScheduleFile(scheduleFileOf(schedule))
    expect(read.isRefused).toBe(false)
    if (!read.isRefused) {
      expect(contentOf(read.schedule)).toEqual(contentOf(schedule))
    }
  })

  it('reads a schedule with no meeting', () => {
    const read = scheduleFromContent(fileWith([]))
    expect(!read.isRefused && read.schedule.isEmpty).toBe(true)
  })

  it('refuses a file that is not JSON, or not a schedule file', () => {
    expect(reasonOf(readScheduleFile('{'))).toBe('it is not a schedule file, nor JSON.')
    expect(reasonOf(scheduleFromContent([]))).toBe('it is not a schedule file.')
    expect(reasonOf(scheduleFromContent({ format: 'other', version: 1 }))).toBe(
      'it is not a schedule file.',
    )
  })

  it('refuses a version it does not read', () => {
    expect(reasonOf(scheduleFromContent(fileWith([], { version: 2 })))).toBe(
      'it is a schedule file of version 2, and this system reads version 1.',
    )
  })

  it('refuses a field missing, a field it does not have, and a value not allowed', () => {
    expect(reasonOf(scheduleFromContent({ format: 'stud-planner/schedule', version: 1 }))).toBe(
      'the schedule has no meetings.',
    )
    expect(reasonOf(scheduleFromContent(fileWith([], { owner: 'me' })))).toBe(
      'the schedule has a field owner, which a schedule file does not have.',
    )
    expect(reasonOf(scheduleFromContent(fileWith([], { meetings: {} })))).toBe(
      'the schedule cannot have {} as its meetings.',
    )
    expect(reasonOf(scheduleFromContent(fileWith(['Lab'])))).toBe(
      'the schedule cannot have "Lab" as its meetings.',
    )
    const { title: _title, ...untitled } = aMeetingContent
    expect(reasonOf(scheduleFromContent(fileWith([untitled])))).toBe('meeting 1 has no title.')
    expect(reasonOf(scheduleFromContent(fileWith([{ ...aMeetingContent, room: 'A' }])))).toBe(
      'meeting 1 has a field room, which a schedule file does not have.',
    )
  })

  it.each([
    ['cadence', { cadence: 'monthly' }, '"monthly" as its cadence'],
    ['parity of a weekly meeting', { parity: 'odd' }, '"odd" as its parity'],
    ['parity', { cadence: 'bi-weekly', parity: 'third' }, '"third" as its parity'],
    ['weekday', { weekday: 'sunday' }, '"sunday" as its weekday'],
    ['start', { start: '10:10' }, '"10:10" as its start'],
    ['duration', { duration: 20 }, '20 as its duration'],
    ['duration written as text', { duration: '60' }, '"60" as its duration'],
    ['title', { title: 3 }, '3 as its title'],
    ['note', { note: false }, 'false as its note'],
  ])('refuses a meeting with a %s not allowed', (_field, change, said) => {
    expect(reasonOf(scheduleFromContent(fileWith([{ ...aMeetingContent, ...change }])))).toBe(
      `meeting 1 cannot have ${said}.`,
    )
  })

  it('refuses a bi-weekly meeting without its parity', () => {
    expect(
      reasonOf(scheduleFromContent(fileWith([{ ...aMeetingContent, cadence: 'bi-weekly' }]))),
    ).toBe('meeting 1 has no parity.')
  })

  it('refuses a meeting that breaks a rule of a meeting', () => {
    expect(reasonOf(scheduleFromContent(fileWith([{ ...aMeetingContent, start: '17:30' }])))).toBe(
      'meeting 1: A meeting cannot end after 18:00.',
    )
  })

  it('refuses two meetings that overlap, naming both', () => {
    const second = { ...aMeetingContent, title: 'Ana', start: '10:30' }
    expect(reasonOf(scheduleFromContent(fileWith([aMeetingContent, second])))).toBe(
      'meeting 1 and meeting 2 overlap. Overlaps Lab meeting, every week, 10:00 to 11:00.',
    )
  })
})
