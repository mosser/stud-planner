import { describe, expect, it } from 'vitest'
import { Cadence, Week } from './cadence.ts'
import { Duration } from './duration.ts'
import {
  bookingBroken,
  bookingsOverlap,
  cadenceChoice,
  durationWritten,
  fileRefused,
  labelOf,
  meetingOfTheFile,
  missingField,
  nameOf,
  newBookingHeading,
  notAScheduleFile,
  notJson,
  notKept,
  overlap,
  participantRemovalQuestion,
  removalQuestion,
  replacementQuestion,
  setAside,
  unknownField,
  unknownVersion,
  valueNotAllowed,
  withParticipants,
} from './findings.ts'
import { aMeeting, aTimeBlock } from './meeting.fixture.ts'
import { Weekday } from './weekday.ts'

describe('the findings', () => {
  it('name the meeting overlapped, the weeks both are held in, and its time', () => {
    const lab = aMeeting()
    const ana = aMeeting({ title: 'Ana', cadence: Cadence.biWeekly(Week.b) })
    expect(overlap(ana, lab)).toBe('Overlaps Lab meeting, week B, 10:00 to 11:00.')
    expect(overlap(lab, aMeeting({ title: 'Bo' }))).toBe('Overlaps Bo, every week, 10:00 to 11:00.')
  })

  it('ask to confirm a removal, naming the meeting, its cadence and its time', () => {
    expect(removalQuestion(aMeeting())).toBe('Remove Lab meeting, weekly, Monday 10:00 to 11:00?')
    const ana = aMeeting({
      title: 'Ana',
      cadence: Cadence.biWeekly(Week.a),
      weekday: Weekday.thursday,
    })
    expect(removalQuestion(ana)).toBe('Remove Ana, bi-weekly, week A, Thursday 10:00 to 11:00?')
  })

  it('name a time block by its title, or as a time block', () => {
    expect(labelOf(aTimeBlock())).toBe('Time block')
    expect(labelOf(aTimeBlock({ title: 'Teaching' }))).toBe('Teaching')
    expect(labelOf(aMeeting())).toBe('Lab meeting')
    expect(nameOf(aTimeBlock())).toBe('a time block')
    expect(nameOf(aTimeBlock({ title: 'Teaching' }))).toBe('the time block Teaching')
    expect(nameOf(aMeeting())).toBe('Lab meeting')
    expect(removalQuestion(aTimeBlock({ title: 'Teaching' }))).toBe(
      'Remove the time block Teaching, weekly, Wednesday 14:00 to 16:00?',
    )
    expect(overlap(aMeeting(), aTimeBlock())).toBe(
      'Overlaps a time block, every week, 14:00 to 16:00.',
    )
  })

  it('say who takes part in a meeting, and ask before a participant leaves', () => {
    expect(withParticipants([])).toBe('')
    expect(withParticipants(['Ana'])).toBe('with Ana')
    expect(withParticipants(['Ana', 'Bo', 'Chloé'])).toBe('with Ana, Bo and Chloé')
    expect(participantRemovalQuestion('Ana', 2)).toBe(
      'Remove Ana from the participants, and from 2 meetings?',
    )
    expect(participantRemovalQuestion('Ana', 1)).toBe(
      'Remove Ana from the participants, and from 1 meeting?',
    )
  })

  it('ask to confirm a replacement by a schedule file', () => {
    expect(replacementQuestion({ meetings: 2, timeBlocks: 1, participants: 0 }, 'a.json')).toBe(
      'Replace the 2 meetings and 1 time block of the schedule with those of a.json?',
    )
    expect(replacementQuestion({ meetings: 0, timeBlocks: 3, participants: 0 }, 'a.json')).toBe(
      'Replace the 0 meetings and 3 time blocks of the schedule with those of a.json?',
    )
    expect(replacementQuestion({ meetings: 2, timeBlocks: 1, participants: 3 }, 'a.json')).toBe(
      'Replace the 2 meetings, 1 time block and 3 participants of the schedule with those of a.json?',
    )
    expect(replacementQuestion({ meetings: 1, timeBlocks: 0, participants: 0 }, 'a.json')).toBe(
      'Replace the 1 meeting of the schedule with those of a.json?',
    )
    expect(replacementQuestion({ meetings: 3, timeBlocks: 0, participants: 0 }, 'a.json')).toBe(
      'Replace the 3 meetings of the schedule with those of a.json?',
    )
  })

  it('write weeks and durations', () => {
    expect(Cadence.all.map(cadenceChoice)).toEqual(['Both weeks', 'Week A', 'Week B'])
    expect(newBookingHeading(false, Cadence.biWeekly(Week.a))).toBe('New meeting in week A')
    expect(newBookingHeading(true, Cadence.weekly)).toBe('New time block in both weeks')
    expect([1, 4, 6, 9].map((quarters) => durationWritten(Duration.ofQuarters(quarters)))).toEqual([
      '15 min',
      '1 h',
      '1 h 30',
      '2 h 15',
    ])
  })

  it('say what the browser keeps', () => {
    expect(notKept()).toBe(
      'This browser does not keep the schedule: closing the page loses it. Download it to keep a copy.',
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
    expect(unknownVersion(5)).toBe(
      'it is a schedule file of version 5, and this system reads versions 1 to 4.',
    )
    expect(missingField(part, 'title')).toBe('meeting 2 has no title.')
    expect(unknownField(part, 'room')).toBe(
      'meeting 2 has a field room, which a schedule file does not have.',
    )
    expect(valueNotAllowed(part, 'weekday', 'sunday')).toBe(
      'meeting 2 cannot have "sunday" as its weekday.',
    )
    expect(bookingBroken(part, 'A meeting needs a title.')).toBe(
      'meeting 2: A meeting needs a title.',
    )
    expect(bookingsOverlap('meeting 1', part, 'Overlaps Ana.')).toBe(
      'meeting 1 and meeting 2 overlap. Overlaps Ana.',
    )
  })
})
