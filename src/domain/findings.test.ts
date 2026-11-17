import { describe, expect, it } from 'vitest'
import { Cadence, Parity } from './cadence.ts'
import { Duration } from './duration.ts'
import {
  cadenceChoice,
  durationWritten,
  fileRefused,
  meetingBroken,
  meetingOfTheFile,
  meetingsOverlap,
  missingField,
  notAScheduleFile,
  notJson,
  notKept,
  overlap,
  removalQuestion,
  replacementQuestion,
  setAside,
  unknownField,
  unknownVersion,
  valueNotAllowed,
} from './findings.ts'
import { aMeeting } from './meeting.fixture.ts'
import { Weekday } from './weekday.ts'

describe('the findings', () => {
  it('name the meeting overlapped, the weeks both are held in, and its time', () => {
    const lab = aMeeting()
    const ana = aMeeting({ title: 'Ana', cadence: Cadence.biWeekly(Parity.even) })
    expect(overlap(ana, lab)).toBe('Overlaps Lab meeting, even week, 10:00 to 11:00.')
    expect(overlap(lab, aMeeting({ title: 'Bo' }))).toBe('Overlaps Bo, every week, 10:00 to 11:00.')
  })

  it('ask to confirm a removal, naming the meeting, its cadence and its time', () => {
    expect(removalQuestion(aMeeting())).toBe('Remove Lab meeting, weekly, Monday 10:00 to 11:00?')
    const ana = aMeeting({
      title: 'Ana',
      cadence: Cadence.biWeekly(Parity.odd),
      weekday: Weekday.thursday,
    })
    expect(removalQuestion(ana)).toBe('Remove Ana, bi-weekly, odd week, Thursday 10:00 to 11:00?')
  })

  it('ask to confirm a replacement by a schedule file', () => {
    expect(replacementQuestion(1, 'a.json')).toBe(
      'Replace the 1 meeting of the schedule with those of a.json?',
    )
    expect(replacementQuestion(3, 'a.json')).toBe(
      'Replace the 3 meetings of the schedule with those of a.json?',
    )
  })

  it('write cadences and durations', () => {
    expect(Cadence.all.map(cadenceChoice)).toEqual([
      'Weekly',
      'Bi-weekly, odd week',
      'Bi-weekly, even week',
    ])
    expect([1, 4, 6, 9].map((quarters) => durationWritten(Duration.ofQuarters(quarters)))).toEqual([
      '15 min',
      '1 h',
      '1 h 30',
      '2 h 15',
    ])
  })

  it('say what the browser keeps', () => {
    expect(notKept()).toBe(
      'This browser does not keep the schedule: closing the page loses it. Save it to keep a copy.',
    )
    expect(setAside()).toBe(
      'The schedule this browser kept could not be read: it is set aside, and this schedule starts empty.',
    )
  })

  it('say why a schedule file is refused', () => {
    const part = meetingOfTheFile(2)
    expect(fileRefused('a.json', notJson())).toBe(
      'a.json is refused: it is not a schedule file, nor JSON.',
    )
    expect(notAScheduleFile()).toBe('it is not a schedule file.')
    expect(unknownVersion(2)).toBe(
      'it is a schedule file of version 2, and this system reads version 1.',
    )
    expect(missingField(part, 'title')).toBe('meeting 2 has no title.')
    expect(unknownField(part, 'room')).toBe(
      'meeting 2 has a field room, which a schedule file does not have.',
    )
    expect(valueNotAllowed(part, 'weekday', 'sunday')).toBe(
      'meeting 2 cannot have "sunday" as its weekday.',
    )
    expect(meetingBroken(part, 'A meeting needs a title.')).toBe(
      'meeting 2: A meeting needs a title.',
    )
    expect(meetingsOverlap('meeting 1', part, 'Overlaps Ana.')).toBe(
      'meeting 1 and meeting 2 overlap. Overlaps Ana.',
    )
  })
})
