import { describe, expect, it } from 'vitest'
import { Week } from './cadence.ts'
import { Presence } from './presence.ts'
import { Schedule } from './schedule.ts'
import { Weekday } from './weekday.ts'

describe('where the Organizer is on a day', () => {
  it('is on campus or remote, as the schedule file writes it', () => {
    expect(Presence.withKey('remote')).toBe(Presence.remote)
    expect(Presence.withKey('home')).toBeUndefined()
    expect(Presence.all.map((presence) => presence.name)).toEqual(['On campus', 'Remote'])
  })

  it('is said, or not, for each day of week A and of week B', () => {
    const schedule = new Schedule()
      .afterSettingPresence(Week.a, Weekday.monday, Presence.onCampus)
      .afterSettingPresence(Week.b, Weekday.monday, Presence.remote)
    expect(schedule.presenceOn(Week.a, Weekday.monday)).toBe(Presence.onCampus)
    expect(schedule.presenceOn(Week.b, Weekday.monday)).toBe(Presence.remote)
    expect(schedule.presenceOn(Week.a, Weekday.tuesday)).toBeUndefined()
  })

  it('is changed, or said no more', () => {
    const remote = new Schedule().afterSettingPresence(Week.a, Weekday.friday, Presence.remote)
    const changed = remote.afterSettingPresence(Week.a, Weekday.friday, Presence.onCampus)
    expect(changed.presenceOn(Week.a, Weekday.friday)).toBe(Presence.onCampus)
    expect(changed.presences).toHaveLength(1)
    expect(changed.afterSettingPresence(Week.a, Weekday.friday, undefined).presences).toEqual([])
  })

  it('is said once per day of a week', () => {
    const day = { week: Week.a, weekday: Weekday.monday, presence: Presence.remote }
    expect(() => new Schedule([], [], [], [day, day])).toThrow(
      'Monday of week A says twice where the Organizer is.',
    )
  })

  it('is kept through the changes of the bookings and the participants', () => {
    const schedule = new Schedule()
      .afterSettingPresence(Week.b, Weekday.thursday, Presence.onCampus)
      .afterAddingParticipant('Ana')
    expect(schedule.presenceOn(Week.b, Weekday.thursday)).toBe(Presence.onCampus)
  })
})
