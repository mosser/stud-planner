import { describe, expect, it } from 'vitest'
import { Cadence, Week } from '../domain/cadence.ts'
import { aMeeting, aTimeBlock, at } from '../domain/meeting.fixture.ts'
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
  aMeeting({ title: 'Ana', cadence: Cadence.biWeekly(Week.a), weekday: Weekday.tuesday }),
  aMeeting({
    title: 'Bo',
    cadence: Cadence.biWeekly(Week.b),
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
  return { format: 'stud-planner/schedule', version: 2, meetings, ...fields }
}

const aTimeBlockContent = {
  cadence: 'bi-weekly',
  week: 'A',
  weekday: 'wednesday',
  start: '14:00',
  duration: 120,
}

describe('the time blocks of the schedule file', () => {
  const withBlocks = new Schedule(
    [aMeeting()],
    [
      aTimeBlock({ title: 'Teaching' }),
      aTimeBlock({ cadence: Cadence.biWeekly(Week.a), weekday: Weekday.friday }),
    ],
  )

  it('are written after the meetings, a title only when there is one', () => {
    expect(contentOf(withBlocks).timeBlocks).toEqual([
      { title: 'Teaching', cadence: 'weekly', weekday: 'wednesday', start: '14:00', duration: 120 },
      { cadence: 'bi-weekly', week: 'A', weekday: 'friday', start: '14:00', duration: 120 },
    ])
  })

  it('are read back as they were written', () => {
    const read = readScheduleFile(scheduleFileOf(withBlocks))
    expect(!read.isRefused && contentOf(read.schedule)).toEqual(contentOf(withBlocks))
  })

  it('are none when the file has no list of time blocks', () => {
    const read = scheduleFromContent(fileWith([aMeetingContent]))
    expect(!read.isRefused && read.schedule.timeBlocks).toEqual([])
  })

  it('refuse a time block that breaks a rule, or has a field a time block does not have', () => {
    expect(
      reasonOf(
        scheduleFromContent(
          fileWith([], { timeBlocks: [{ ...aTimeBlockContent, start: '17:00' }] }),
        ),
      ),
    ).toBe('time block 1: A time block cannot end after 18:00.')
    expect(
      reasonOf(
        scheduleFromContent(fileWith([], { timeBlocks: [{ ...aTimeBlockContent, note: 'x' }] })),
      ),
    ).toBe('time block 1 has a field note, which a schedule file does not have.')
    expect(reasonOf(scheduleFromContent(fileWith([], { timeBlocks: 'none' })))).toBe(
      'the schedule cannot have "none" as its timeBlocks.',
    )
    expect(reasonOf(scheduleFromContent(fileWith([], { timeBlocks: [3] })))).toBe(
      'the schedule cannot have 3 as its timeBlocks.',
    )
  })

  it('refuse a meeting booked in a time block, naming both', () => {
    const inside = { ...aMeetingContent, weekday: 'wednesday', start: '15:00', cadence: 'weekly' }
    expect(
      reasonOf(scheduleFromContent(fileWith([inside], { timeBlocks: [aTimeBlockContent] }))),
    ).toBe('meeting 1 and time block 1 overlap. Overlaps Lab meeting, week A, 15:00 to 16:00.')
  })
})

describe('a schedule file of version 1', () => {
  const versionOne = {
    format: 'stud-planner/schedule',
    version: 1,
    meetings: [
      { ...aMeetingContent, title: 'Ana', cadence: 'bi-weekly', parity: 'odd' },
      { ...aMeetingContent, title: 'Bo', cadence: 'bi-weekly', parity: 'even' },
    ],
  }

  it('is read, its parity odd as week A and even as week B', () => {
    const read = scheduleFromContent(versionOne)
    expect(
      read.isRefused ? read.reason : read.schedule.meetings.map((meeting) => meeting.cadence.week),
    ).toEqual([Week.a, Week.b])
  })

  it('is read as it was written: with a parity, never a week', () => {
    const withWeek = {
      ...versionOne,
      meetings: [{ ...aMeetingContent, cadence: 'bi-weekly', week: 'A' }],
    }
    expect(reasonOf(scheduleFromContent(withWeek))).toBe(
      'meeting 1 has a field week, which a schedule file does not have.',
    )
    const withAWeek = {
      ...versionOne,
      meetings: [{ ...aMeetingContent, cadence: 'bi-weekly', parity: 'A' }],
    }
    expect(reasonOf(scheduleFromContent(withAWeek))).toBe(
      'meeting 1 cannot have "A" as its parity.',
    )
  })

  it('is written again as version 2', () => {
    const read = scheduleFromContent(versionOne)
    expect(!read.isRefused && contentOf(read.schedule).version).toBe(2)
  })
})

describe('the schedule file', () => {
  it('is saved as stud-planner-schedule.json', () => {
    expect(scheduleFileName).toBe('stud-planner-schedule.json')
  })

  it('writes each meeting as the specification lists, a week for a bi-weekly one only', () => {
    expect(contentOf(schedule)).toEqual({
      format: 'stud-planner/schedule',
      version: 2,
      meetings: [
        { ...aMeetingContent, note: 'Room 201' },
        {
          title: 'Ana',
          cadence: 'bi-weekly',
          week: 'A',
          weekday: 'tuesday',
          start: '10:00',
          duration: 60,
        },
        {
          title: 'Bo',
          cadence: 'bi-weekly',
          week: 'B',
          weekday: 'tuesday',
          start: '16:30',
          duration: 60,
        },
      ],
      timeBlocks: [],
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
    expect(reasonOf(scheduleFromContent(fileWith([], { version: 3 })))).toBe(
      'it is a schedule file of version 3, and this system reads versions 1 and 2.',
    )
    expect(reasonOf(scheduleFromContent(fileWith([], { version: '2' })))).toBe(
      'it is a schedule file of version "2", and this system reads versions 1 and 2.',
    )
  })

  it('refuses a field missing, a field it does not have, and a value not allowed', () => {
    expect(reasonOf(scheduleFromContent({ format: 'stud-planner/schedule', version: 2 }))).toBe(
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
    ['week of a weekly meeting', { week: 'A' }, '"A" as its week'],
    ['week', { cadence: 'bi-weekly', week: 'C' }, '"C" as its week'],
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

  it('refuses a bi-weekly meeting without its week', () => {
    expect(
      reasonOf(scheduleFromContent(fileWith([{ ...aMeetingContent, cadence: 'bi-weekly' }]))),
    ).toBe('meeting 1 has no week.')
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
