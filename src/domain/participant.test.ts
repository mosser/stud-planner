import { describe, expect, it } from 'vitest'
import { Cadence, Week } from './cadence.ts'
import { aMeeting, at } from './meeting.fixture.ts'
import { Participant } from './participant.ts'
import { Schedule } from './schedule.ts'
import { Weekday } from './weekday.ts'

const ana = new Participant('Ana')
const bo = new Participant('Bo')

describe('a participant', () => {
  it('has a name, without leading or trailing spaces', () => {
    expect(new Participant('  Ana ').name).toBe('Ana')
    expect(() => new Participant('  ')).toThrow('A participant needs a name.')
  })

  it('is named so whatever the case', () => {
    expect(ana.isNamed(' ana')).toBe(true)
    expect(ana.isNamed('Anaïs')).toBe(false)
  })
})

describe('the participants of a meeting', () => {
  it('are none unless given, each once', () => {
    expect(aMeeting().participants).toEqual([])
    expect(aMeeting({ participants: [ana, bo] }).hasParticipant(bo)).toBe(true)
    expect(() => aMeeting({ participants: [ana, ana] })).toThrow('A meeting names Ana twice.')
  })

  it('are kept when the meeting moves', () => {
    const moved = aMeeting({ participants: [ana] }).afterMovingTo(Weekday.friday, at('14:00'))
    expect(moved.participants).toEqual([ana])
  })
})

describe('the participants of a schedule', () => {
  it('are added by name, no two with the same name', () => {
    const schedule = new Schedule().afterAddingParticipant('Ana').afterAddingParticipant('Bo')
    expect(schedule.participants.map((participant) => participant.name)).toEqual(['Ana', 'Bo'])
    expect(() => schedule.afterAddingParticipant(' ANA ')).toThrow(
      'There is already a participant named ANA.',
    )
    expect(schedule.participantNamed('bo')).toBe(schedule.participants[1])
    expect(schedule.isEmpty).toBe(false)
  })

  it('are the only people a meeting names', () => {
    expect(() => new Schedule([aMeeting({ participants: [ana] })])).toThrow(
      'Ana is not a participant of the schedule.',
    )
    expect(
      new Schedule([aMeeting({ participants: [ana] })], [], [ana]).meetingsOf(ana),
    ).toHaveLength(1)
  })

  it('are renamed in every meeting they take part in', () => {
    const lab = aMeeting({ participants: [ana, bo] })
    const schedule = new Schedule(
      [lab, aMeeting({ title: 'Bo', weekday: Weekday.friday })],
      [],
      [ana, bo],
    )
    const renamed = schedule.afterRenaming(ana, 'Anaïs')
    expect(renamed.participants.map((participant) => participant.name)).toEqual(['Anaïs', 'Bo'])
    expect(renamed.meetings[0]?.participants.map((participant) => participant.name)).toEqual([
      'Anaïs',
      'Bo',
    ])
    expect(renamed.meetings[1]).toBe(schedule.meetings[1])
    expect(() => schedule.afterRenaming(ana, 'bo')).toThrow(
      'There is already a participant named Bo.',
    )
  })

  it('leave every meeting they take part in when removed', () => {
    const schedule = new Schedule([aMeeting({ participants: [ana, bo] })], [], [ana, bo])
    const without = schedule.afterRemovingParticipant(ana)
    expect(without.participants).toEqual([bo])
    expect(without.meetings[0]?.participants).toEqual([bo])
    expect(() => without.afterRemovingParticipant(ana)).toThrow(RangeError)
  })

  it('are kept when bookings are added, changed or removed', () => {
    const lab = aMeeting({ participants: [ana] })
    const schedule = new Schedule([lab], [], [ana])
    const moved = schedule.afterReplacing(lab, lab.afterMovingTo(Weekday.friday, at('09:00')))
    expect(moved.participants).toEqual([ana])
    expect(moved.afterRemoving(moved.meetings[0] as never).participants).toEqual([ana])
  })

  it('are never in two meetings at once, no two meetings overlapping', () => {
    const inWeekA = aMeeting({ participants: [ana], cadence: Cadence.biWeekly(Week.a) })
    const schedule = new Schedule([inWeekA], [], [ana])
    expect(() => schedule.afterAdding(aMeeting({ title: 'Other', participants: [ana] }))).toThrow(
      'Overlaps Lab meeting, week A, 10:00 to 11:00.',
    )
  })
})
