import { describe, expect, it } from 'vitest'
import { aMeeting } from '../domain/meeting.fixture.ts'
import { Schedule } from '../domain/schedule.ts'
import { contentOf } from './schedule-file.ts'
import { sharedSchedulesFrom } from './shared-schedule.ts'
import { sharedSchedules } from './shared-schedules.ts'

const content = contentOf(new Schedule([aMeeting()]))

describe('the shared schedules', () => {
  it('are named after their file, and listed A to Z', () => {
    const shared = sharedSchedulesFrom({
      '../../schedules/Winter 2027.json': content,
      '../../schedules/Fall 2026.json': contentOf(new Schedule()),
    })
    expect(shared.map((each) => each.name)).toEqual(['Fall 2026', 'Winter 2027'])
    expect(shared[1]?.schedule.meetings[0]?.title).toBe('Lab meeting')
  })

  it('refuse a file that is not a schedule file, naming it', () => {
    expect(() => sharedSchedulesFrom({ 'schedules/broken.json': { format: 'other' } })).toThrow(
      'schedules/broken.json is refused: it is not a schedule file.',
    )
  })

  it('are those of the schedules folder, each one a schedule', () => {
    expect(Array.isArray(sharedSchedules)).toBe(true)
    for (const shared of sharedSchedules) {
      expect(shared.schedule).toBeInstanceOf(Schedule)
    }
  })
})
