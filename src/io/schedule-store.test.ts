import { IDBFactory } from 'fake-indexeddb'
import { describe, expect, it } from 'vitest'
import { aMeeting } from '../domain/meeting.fixture.ts'
import { Schedule } from '../domain/schedule.ts'
import { contentOf } from './schedule-file.ts'
import { openScheduleStore } from './schedule-store.ts'

const schedule = new Schedule([aMeeting({ note: 'Room 201' })])

async function writeDirectly(factory: IDBFactory, value: unknown): Promise<void> {
  const request = factory.open('stud-planner', 1)
  request.onupgradeneeded = () => request.result.createObjectStore('schedule')
  const database = await new Promise<IDBDatabase>((resolve) => {
    request.onsuccess = () => resolve(request.result)
  })
  const transaction = database.transaction('schedule', 'readwrite')
  transaction.objectStore('schedule').put(value, 'schedule')
  await new Promise((resolve) => {
    transaction.oncomplete = resolve
  })
  database.close()
}

async function readDirectly(factory: IDBFactory, key: string): Promise<unknown> {
  const request = factory.open('stud-planner', 1)
  const database = await new Promise<IDBDatabase>((resolve) => {
    request.onsuccess = () => resolve(request.result)
  })
  const get = database.transaction('schedule').objectStore('schedule').get(key)
  return new Promise((resolve) => {
    get.onsuccess = () => resolve(get.result)
  })
}

describe('the kept schedule', () => {
  it('is empty when nothing is kept', async () => {
    const store = await openScheduleStore(new IDBFactory())
    expect(store.isKept).toBe(true)
    const restored = await store.restore()
    expect(restored.schedule.isEmpty).toBe(true)
    expect(restored.wasSetAside).toBe(false)
  })

  it('comes back as it was kept, in another session', async () => {
    const factory = new IDBFactory()
    const store = await openScheduleStore(factory)
    expect(await store.keep(new Schedule())).toBe(true)
    expect(await store.keep(schedule)).toBe(true)
    const restored = await (await openScheduleStore(factory)).restore()
    expect(contentOf(restored.schedule)).toEqual(contentOf(schedule))
  })

  it('is kept as the content of its schedule file', async () => {
    const factory = new IDBFactory()
    await (await openScheduleStore(factory)).keep(schedule)
    expect(await readDirectly(factory, 'schedule')).toEqual(contentOf(schedule))
  })

  it('is set aside, not deleted, when it cannot be read', async () => {
    const factory = new IDBFactory()
    await writeDirectly(factory, { format: 'something else' })
    const restored = await (await openScheduleStore(factory)).restore()
    expect(restored.schedule.isEmpty).toBe(true)
    expect(restored.wasSetAside).toBe(true)
    expect(await readDirectly(factory, 'set-aside')).toEqual({ format: 'something else' })
    expect(await readDirectly(factory, 'schedule')).toBeUndefined()
  })

  it('is not kept when the browser gives no IndexedDB, and everything else works', async () => {
    const store = await openScheduleStore(undefined)
    expect(store.isKept).toBe(false)
    expect(await store.keep(schedule)).toBe(false)
    expect((await store.restore()).schedule.isEmpty).toBe(true)
  })

  it('is not kept when the browser refuses IndexedDB', async () => {
    const refusing = {
      open: () => {
        throw new DOMException('refused', 'SecurityError')
      },
    } as unknown as IDBFactory
    expect((await openScheduleStore(refusing)).isKept).toBe(false)
  })

  it('says it was not kept when a write fails', async () => {
    const factory = new IDBFactory()
    const store = await openScheduleStore(factory)
    const database = (store as unknown as { database: IDBDatabase }).database
    database.close()
    expect(await store.keep(schedule)).toBe(false)
    expect((await store.restore()).schedule.isEmpty).toBe(true)
  })
})
