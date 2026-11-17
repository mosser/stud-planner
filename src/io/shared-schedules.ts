import { type SharedSchedule, sharedSchedulesFrom } from './shared-schedule.ts'

/** The schedules of `schedules/`, inlined when the page is built: nothing is fetched (ADR 0012). */
export const sharedSchedules: readonly SharedSchedule[] = sharedSchedulesFrom(
  import.meta.glob('../../schedules/*.json', { eager: true, import: 'default' }),
)
