import { Schedule } from '../domain/schedule.ts'
import { contentOf, scheduleFromContent } from './schedule-file.ts'

/** The schedule the browser gave back when the page opened. */
export interface Restored {
  readonly schedule: Schedule
  /** Whether a kept schedule could not be read, and was set aside. */
  readonly wasSetAside: boolean
}

/**
 * The schedule kept by the browser (ADR 0006). Keeping it is best effort: when the browser
 * refuses, nothing is kept and everything else works.
 */
export interface ScheduleStore {
  /** Whether the browser keeps the schedule; when it does not, closing the page loses it. */
  readonly isKept: boolean
  /** The schedule kept, or an empty one when there is none. */
  restore(): Promise<Restored>
  /** Keeps the schedule, at once; gives whether the browser kept it. */
  keep(schedule: Schedule): Promise<boolean>
}

const databaseName = 'stud-planner'
const databaseVersion = 1
const storeName = 'schedule'
const scheduleKey = 'schedule'
const setAsideKey = 'set-aside'

function opened(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(databaseName, databaseVersion)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(failure(request.error))
    // Another page holds an older database open: rather than wait for it, keep nothing this time.
    request.onblocked = () => reject(new Error('The schedule is held open by another page'))
  })
}

function completed(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(failure(transaction.error))
    transaction.onabort = () => reject(failure(transaction.error))
  })
}

function result<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(failure(request.error))
  })
}

/** The error IndexedDB gives, or one saying it gave none. */
function failure(error: DOMException | null): Error {
  return error ?? new Error('The browser did not say why it failed')
}

/** A store that keeps nothing: the browser refuses, or gives no IndexedDB. */
const nothingKept: ScheduleStore = {
  isKept: false,
  restore: async () => ({ schedule: new Schedule(), wasSetAside: false }),
  keep: async () => false,
}

class IndexedScheduleStore implements ScheduleStore {
  readonly isKept = true
  private readonly database: IDBDatabase
  /** The last write asked for: each waits for the one before it to finish. */
  private queue: Promise<unknown> = Promise.resolve()

  constructor(database: IDBDatabase) {
    this.database = database
  }

  async restore(): Promise<Restored> {
    try {
      const transaction = this.database.transaction(storeName, 'readonly')
      const record: unknown = await result(transaction.objectStore(storeName).get(scheduleKey))
      if (record === undefined) {
        return { schedule: new Schedule(), wasSetAside: false }
      }
      const read = scheduleFromContent(record)
      if (!read.isRefused) {
        return { schedule: read.schedule, wasSetAside: false }
      }
      await this.setAside(record)
      return { schedule: new Schedule(), wasSetAside: true }
    } catch {
      return { schedule: new Schedule(), wasSetAside: false }
    }
  }

  /** Keeps aside a kept schedule that cannot be read, rather than deleting it. */
  private async setAside(record: unknown): Promise<void> {
    const transaction = this.database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    store.put(record, setAsideKey)
    store.delete(scheduleKey)
    await completed(transaction)
  }

  /** Keeps the schedule; writes are kept one after the other, in the order asked. */
  keep(schedule: Schedule): Promise<boolean> {
    const next = this.queue.then(() => this.write(schedule))
    this.queue = next
    return next
  }

  private async write(schedule: Schedule): Promise<boolean> {
    try {
      const transaction = this.database.transaction(storeName, 'readwrite')
      transaction.objectStore(storeName).put(contentOf(schedule), scheduleKey)
      await completed(transaction)
      return true
    } catch {
      return false
    }
  }
}

/**
 * Opens the store of the schedule in the browser's IndexedDB, `globalThis.indexedDB`, or one that
 * keeps nothing when the browser gives none or refuses it.
 */
export async function openScheduleStore(factory: IDBFactory | undefined): Promise<ScheduleStore> {
  if (factory === undefined) {
    return nothingKept
  }
  try {
    return new IndexedScheduleStore(await opened(factory))
  } catch {
    return nothingKept
  }
}
