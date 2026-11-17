import type { Schedule } from '../domain/schedule.ts'
import { scheduleFromContent } from './schedule-file.ts'

/** A schedule of `schedules/`, built into the page and offered to every reader (ADR 0012). */
export interface SharedSchedule {
  /** Its name: the name of its file, without `.json`. */
  readonly name: string
  readonly schedule: Schedule
}

/** The name of a shared schedule: the last part of its path, without `.json`. */
function nameOf(path: string): string {
  const file = path.slice(path.lastIndexOf('/') + 1)
  return file.endsWith('.json') ? file.slice(0, -'.json'.length) : file
}

/**
 * The shared schedules the files hold, by name, A to Z. Throws a TypeError naming the file and the
 * reason, for a file that is not a schedule file the system reads: the build refuses it.
 */
export function sharedSchedulesFrom(
  files: Readonly<Record<string, unknown>>,
): readonly SharedSchedule[] {
  return Object.entries(files)
    .map(([path, content]) => {
      const read = scheduleFromContent(content)
      if (read.isRefused) {
        throw new TypeError(`${path} is refused: ${read.reason}`)
      }
      return { name: nameOf(path), schedule: read.schedule }
    })
    .sort((one, other) => one.name.localeCompare(other.name))
}
