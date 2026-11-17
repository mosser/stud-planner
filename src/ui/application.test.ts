// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Cadence, Week } from '../domain/cadence.ts'
import { Duration } from '../domain/duration.ts'
import { aMeeting, at } from '../domain/meeting.fixture.ts'
import { Schedule } from '../domain/schedule.ts'
import { TimeBlock } from '../domain/time-block.ts'
import { Weekday } from '../domain/weekday.ts'
import { scheduleFileOf } from '../io/schedule-file.ts'
import { type ApplicationContext, mountApplication } from './application.ts'
import type { Tab } from './gestures.ts'

const inWeekA = Cadence.biWeekly(Week.a)
/** Monday 10:00 to 11:00, weekly. */
const lab = aMeeting()
/** Tuesday 10:00 to 11:00, week A. */
const ana = aMeeting({ title: 'Ana', weekday: Weekday.tuesday, cadence: inWeekA })

/** Each day column 100 pixels wide, Monday first; each quarter 10 pixels high from 08:00. */
function point(weekday: Weekday, time: string): { clientX: number; clientY: number } {
  const quarter = (at(time).minutes - 8 * 60) / 15
  return { clientX: Weekday.all.indexOf(weekday) * 100 + 50, clientY: quarter * 10 + 5 }
}

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const rank = Weekday.all.findIndex((weekday) => weekday.key === this.dataset.weekday)
    return { left: rank * 100, right: rank * 100 + 100, top: 0, height: 400 } as DOMRect
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

/** The page mounted, on week A unless told otherwise, or as it opens. */
function mounted(
  schedule: Schedule,
  changes: Partial<ApplicationContext> = {},
  shown: Tab | 'as opened' = 'a',
) {
  const root = document.createElement('div')
  document.body.append(root)
  const keep = vi.fn(async () => true)
  const keepLock = vi.fn(async () => true)
  const ask = vi.fn(async () => true)
  const save = vi.fn()
  const context = {
    version: '1.2.3',
    restored: { schedule, wasSetAside: false, isLocked: false },
    store: { isKept: true, keep, keepLock },
    sharedSchedules: [],
    save,
    ask,
    ...changes,
  }
  const application = mountApplication(root, context)
  if (shown !== 'as opened') {
    ;(root.querySelector(`[data-tab="${shown}"]`) as HTMLElement).click()
  }
  return { root, application, keep, keepLock, ask: context.ask, save }
}

function press(target: Element, at_: { clientX: number; clientY: number }): void {
  target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, ...at_ }))
}
function moveTo(at_: { clientX: number; clientY: number }): void {
  document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, ...at_ }))
}
function release(at_: { clientX: number; clientY: number }): void {
  document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, ...at_ }))
}

const day = (root: HTMLElement, weekday: Weekday) =>
  root.querySelector(`.day[data-weekday="${weekday.key}"]`) as HTMLElement
const bookingElement = (root: HTMLElement, rank: number) =>
  root.querySelector(`[data-booking="${rank}"]`) as HTMLElement
const dialog = () => document.querySelector('dialog.booking-dialog') as HTMLDialogElement
const titles = (root: HTMLElement) =>
  [...root.querySelectorAll('.booking-title')].map((title) => title.textContent)
const describeMeetings = (schedule: Schedule) =>
  schedule.meetings.map(
    (meeting) => `${meeting.title} ${meeting.weekday.name} ${meeting.start}-${meeting.end}`,
  )

function typeTitle(title: string): void {
  const input = dialog().querySelector('[name="title"]') as HTMLInputElement
  input.value = title
  input.dispatchEvent(new Event('input', { bubbles: true }))
  dialog().querySelector('form')?.requestSubmit()
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('the screen', () => {
  it('opens on the overview, its tab first, with a masthead and the version', () => {
    const { root, application } = mounted(new Schedule([lab, ana]), {}, 'as opened')
    expect(application.tab).toBe('overview')
    expect(root.querySelector('.masthead h1')?.textContent).toBe('Stud Planner')
    expect(root.querySelector('.site-footer')?.textContent).toBe('stud-planner v1.2.3')
    expect(root.querySelector('[aria-selected="true"]')?.textContent).toBe('Overview')
    const order = [...root.querySelectorAll('[role="tab"]')].map((each) => each.textContent)
    expect(order).toEqual(['Overview', 'Week A', 'Week B'])
    expect(titles(root)).toEqual(['Lab meeting', 'Ana'])
  })

  it('shows one tab at a time', () => {
    const { root, application } = mounted(new Schedule([lab, ana]))
    ;(root.querySelector('[data-tab="b"]') as HTMLElement).click()
    expect(application.tab).toBe('b')
    expect(titles(root)).toEqual(['Lab meeting'])
    ;(root.querySelector('[data-tab="overview"]') as HTMLElement).click()
    expect(root.querySelector('[role="tabpanel"]')?.getAttribute('aria-label')).toBe('Overview')
    expect(root.querySelector<HTMLElement>('.booking.week-a')?.style.gridRow).toBe('9 / span 4')
  })
})

describe('adding a meeting', () => {
  it('marks the meeting by pressing a free slot and dragging down, then asks its title', () => {
    const { root, application, keep } = mounted(new Schedule([lab]))
    press(day(root, Weekday.wednesday), point(Weekday.wednesday, '09:00'))
    moveTo(point(Weekday.wednesday, '10:15'))
    expect(root.querySelector('.preview')?.getAttribute('style')).toContain('5 / span 6')
    release(point(Weekday.wednesday, '10:15'))
    expect(root.querySelector('.preview')).toBeNull()
    typeTitle('Ana')
    expect(describeMeetings(application.schedule)).toEqual([
      'Lab meeting Monday 10:00-11:00',
      'Ana Wednesday 09:00-10:30',
    ])
    expect(application.schedule.meetings[1]?.cadence).toBe(inWeekA)
    expect(keep).toHaveBeenCalledWith(application.schedule)
  })

  it('marks one hour from a press without a drag, stopping before a taken slot', () => {
    const { root, application } = mounted(new Schedule([lab]))
    press(day(root, Weekday.monday), point(Weekday.monday, '09:30'))
    release(point(Weekday.monday, '09:30'))
    typeTitle('Bo')
    expect(describeMeetings(application.schedule)[1]).toBe('Bo Monday 09:30-10:00')
  })

  it('offers only the cadences held in the week of the tab', () => {
    const { root, application } = mounted(new Schedule())
    ;(root.querySelector('[data-tab="b"]') as HTMLElement).click()
    press(day(root, Weekday.tuesday), point(Weekday.tuesday, '08:00'))
    release(point(Weekday.tuesday, '08:00'))
    const choices = [...dialog().querySelectorAll('[name="cadence"] option')].map(
      (option) => option.textContent,
    )
    expect(choices).toEqual(['Weekly', 'Bi-weekly, week B'])
    const cadence = dialog().querySelector('[name="cadence"]') as HTMLSelectElement
    cadence.value = '0'
    cadence.dispatchEvent(new Event('change', { bubbles: true }))
    typeTitle('Bo')
    expect(application.schedule.meetings[0]?.cadence).toBe(Cadence.weekly)
  })

  it('adds a weekly meeting from the overview, held in both weeks', () => {
    const { root, application } = mounted(new Schedule([ana]))
    ;(root.querySelector('[data-tab="overview"]') as HTMLElement).click()
    expect(root.querySelector('[aria-checked="true"]')?.textContent).toBe('Meeting')
    press(day(root, Weekday.tuesday), point(Weekday.tuesday, '10:00'))
    release(point(Weekday.tuesday, '10:00'))
    expect(dialog()).toBeNull()
    press(day(root, Weekday.monday), point(Weekday.monday, '08:00'))
    moveTo(point(Weekday.monday, '09:15'))
    release(point(Weekday.monday, '09:15'))
    expect(dialog().querySelector('h2')?.textContent).toBe('New meeting')
    const choices = [...dialog().querySelectorAll('[name="cadence"] option')].map(
      (option) => option.textContent,
    )
    expect(choices).toEqual(['Weekly'])
    typeTitle('Seminar')
    expect(describeMeetings(application.schedule)[1]).toBe('Seminar Monday 08:00-09:30')
    expect(application.schedule.meetings[1]?.cadence).toBe(Cadence.weekly)
  })

  it('adds a weekly time block from the overview once the switch says so', () => {
    const { root, application } = mounted(new Schedule())
    ;(root.querySelector('[data-tab="overview"]') as HTMLElement).click()
    ;(root.querySelector('[data-adding="time-block"]') as HTMLElement).click()
    press(day(root, Weekday.friday), point(Weekday.friday, '08:00'))
    release(point(Weekday.friday, '08:00'))
    expect(dialog().querySelector('h2')?.textContent).toBe('New time block')
    dialog().querySelector('form')?.requestSubmit()
    const [block] = application.schedule.timeBlocks
    expect([block?.title, block?.cadence, block?.end.toString()]).toEqual([
      undefined,
      Cadence.weekly,
      '09:00',
    ])
  })

  it('shows the switch under the grid, on every tab', () => {
    const { root } = mounted(new Schedule())
    for (const tab of ['a', 'b', 'overview']) {
      ;(root.querySelector(`[data-tab="${tab}"]`) as HTMLElement).click()
      expect(root.querySelector('.grid + .adding')).not.toBeNull()
    }
  })

  it('adds a time block from a week once the switch says so', () => {
    const { root, application } = mounted(new Schedule([lab]))
    const chosen = () => root.querySelector('[aria-checked="true"]')?.textContent
    expect(chosen()).toBe('Meeting')
    ;(root.querySelector('[data-adding="time-block"]') as HTMLElement).click()
    expect(chosen()).toBe('Time block')
    press(day(root, Weekday.monday), point(Weekday.monday, '08:00'))
    moveTo(point(Weekday.monday, '09:45'))
    expect(root.querySelector('.preview')?.classList.contains('time-block')).toBe(true)
    release(point(Weekday.monday, '09:45'))
    expect(dialog().querySelector('[name="note"]')).toBeNull()
    typeTitle('Teaching')
    const [block] = application.schedule.timeBlocks
    expect([block?.title, block?.cadence, block?.end.toString()]).toEqual([
      'Teaching',
      inWeekA,
      '10:00',
    ])
    expect(root.querySelector('.booking.time-block .booking-title')?.textContent).toBe('Teaching')
    ;(root.querySelector('[data-tab="b"]') as HTMLElement).click()
    expect(chosen()).toBe('Time block')
  })

  it('refuses a meeting moved onto a time block, and names it', () => {
    const block = new TimeBlock({
      title: 'Teaching',
      cadence: Cadence.weekly,
      weekday: Weekday.tuesday,
      start: at('10:00'),
      duration: Duration.ofQuarters(8),
    })
    const { root, application } = mounted(new Schedule([lab], [block]))
    press(bookingElement(root, 0), point(Weekday.monday, '10:00'))
    moveTo(point(Weekday.tuesday, '11:00'))
    release(point(Weekday.tuesday, '11:00'))
    expect(application.schedule.meetings[0]?.weekday).toBe(Weekday.monday)
    expect(root.querySelector('.refusal')?.textContent).toBe(
      'Overlaps the time block Teaching, every week, 10:00 to 12:00.',
    )
  })

  it('moves, and removes once confirmed, a time block', async () => {
    const block = new TimeBlock({
      cadence: inWeekA,
      weekday: Weekday.friday,
      start: at('14:00'),
      duration: Duration.ofQuarters(4),
    })
    const { root, application, ask } = mounted(new Schedule([], [block]))
    press(bookingElement(root, 0), point(Weekday.friday, '14:00'))
    moveTo(point(Weekday.friday, '15:00'))
    release(point(Weekday.friday, '15:00'))
    expect(application.schedule.timeBlocks[0]?.start.toString()).toBe('15:00')
    ;(root.querySelector('[data-remove="0"]') as HTMLElement).click()
    await flush()
    expect(ask).toHaveBeenCalledWith(
      'Remove a time block, bi-weekly, week A, Friday 15:00 to 16:00?',
      'Remove',
    )
    expect(application.schedule.isEmpty).toBe(true)
  })
})

describe('moving and resizing a meeting', () => {
  it('moves a meeting to the slot it is dragged to, held where it was pressed', () => {
    const { root, application } = mounted(new Schedule([lab]))
    press(bookingElement(root, 0), point(Weekday.monday, '10:30'))
    expect(bookingElement(root, 0).classList.contains('dragging')).toBe(true)
    moveTo(point(Weekday.thursday, '14:30'))
    release(point(Weekday.thursday, '14:30'))
    expect(describeMeetings(application.schedule)).toEqual(['Lab meeting Thursday 14:00-15:00'])
  })

  it('refuses a drop that would overlap another meeting, and says why', () => {
    const { root, application } = mounted(new Schedule([lab, ana]))
    press(bookingElement(root, 0), point(Weekday.monday, '10:00'))
    moveTo(point(Weekday.tuesday, '10:30'))
    expect(root.querySelector('.preview.refused')).not.toBeNull()
    release(point(Weekday.tuesday, '10:30'))
    expect(describeMeetings(application.schedule)[0]).toBe('Lab meeting Monday 10:00-11:00')
    expect(root.querySelector('.refusal')?.textContent).toBe(
      'Overlaps Ana, week A, 10:00 to 11:00.',
    )
  })

  it('resizes a meeting by its lower edge', () => {
    const { root, application } = mounted(new Schedule([lab]))
    press(root.querySelector('[data-resize="0"]') as Element, point(Weekday.monday, '10:45'))
    moveTo(point(Weekday.monday, '12:15'))
    release(point(Weekday.monday, '12:15'))
    expect(describeMeetings(application.schedule)).toEqual(['Lab meeting Monday 10:00-12:30'])
  })

  it('puts the meeting back on Escape', () => {
    const { root, application } = mounted(new Schedule([lab]))
    press(bookingElement(root, 0), point(Weekday.monday, '10:00'))
    moveTo(point(Weekday.friday, '15:00'))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    release(point(Weekday.friday, '15:00'))
    expect(describeMeetings(application.schedule)).toEqual(['Lab meeting Monday 10:00-11:00'])
    expect(root.querySelector('.preview')).toBeNull()
  })

  it('opens the dialog of a meeting clicked without a drag', () => {
    const { root, application } = mounted(new Schedule([lab]))
    press(bookingElement(root, 0), point(Weekday.monday, '10:00'))
    release(point(Weekday.monday, '10:00'))
    expect(dialog().querySelector('h2')?.textContent).toBe('Lab meeting')
    typeTitle('Lab')
    expect(application.schedule.meetings[0]?.title).toBe('Lab')
  })

  it('opens the dialog of a meeting from the keyboard', () => {
    const { root } = mounted(new Schedule([lab]))
    bookingElement(root, 0).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    )
    expect(dialog()).not.toBeNull()
  })
})

describe('removing a meeting', () => {
  it('asks to confirm, naming the meeting, from its remove mark', async () => {
    const { root, application, ask } = mounted(new Schedule([lab]))
    ;(root.querySelector('[data-remove="0"]') as HTMLElement).click()
    await flush()
    expect(ask).toHaveBeenCalledWith('Remove Lab meeting, weekly, Monday 10:00 to 11:00?', 'Remove')
    expect(application.schedule.isEmpty).toBe(true)
  })

  it('changes nothing when the Organizer does not confirm', async () => {
    const { root, application } = mounted(new Schedule([lab]), { ask: vi.fn(async () => false) })
    bookingElement(root, 0).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }),
    )
    await flush()
    expect(application.schedule.meetings).toHaveLength(1)
  })

  it('asks from the dialog of the meeting', async () => {
    const { root, application, ask } = mounted(new Schedule([lab]))
    bookingElement(root, 0).dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    ;(dialog().querySelector('[data-action="remove"]') as HTMLElement).click()
    await flush()
    expect(ask).toHaveBeenCalledTimes(1)
    expect(application.schedule.isEmpty).toBe(true)
  })

  it('confirms in a dialog of the page by default', async () => {
    const { root, application } = mounted(new Schedule([lab]), { ask: undefined })
    ;(root.querySelector('[data-remove="0"]') as HTMLElement).click()
    document
      .querySelector('dialog.confirmation form')
      ?.dispatchEvent(new Event('submit', { cancelable: true }))
    await flush()
    expect(application.schedule.isEmpty).toBe(true)
  })
})

describe('saving and loading', () => {
  function loadFile(root: HTMLElement, text: string, name = 'week.json'): void {
    const input = root.querySelector('[data-file]') as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [new File([text], name)], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }

  it('saves the schedule file', () => {
    const { root, save } = mounted(new Schedule([lab]))
    ;(root.querySelector('[data-action="save"]') as HTMLElement).click()
    expect(save).toHaveBeenCalledWith(
      scheduleFileOf(new Schedule([lab])),
      'stud-planner-schedule.json',
    )
  })

  it('opens the choice of a file on Load', () => {
    const { root } = mounted(new Schedule())
    const input = root.querySelector('[data-file]') as HTMLInputElement
    const chosen = vi.spyOn(input, 'click')
    ;(root.querySelector('[data-action="load"]') as HTMLElement).click()
    expect(chosen).toHaveBeenCalled()
  })

  it('takes a schedule file at once when the schedule is empty', async () => {
    const { root, application, ask } = mounted(new Schedule())
    loadFile(root, scheduleFileOf(new Schedule([lab, ana])))
    await vi.waitFor(() => expect(application.schedule.meetings).toHaveLength(2))
    expect(ask).not.toHaveBeenCalled()
  })

  it('asks before a schedule file replaces the meetings of the schedule', async () => {
    const { root, application, ask } = mounted(new Schedule([lab]))
    loadFile(root, scheduleFileOf(new Schedule([ana])))
    await vi.waitFor(() => expect(application.schedule.meetings[0]?.title).toBe('Ana'))
    expect(ask).toHaveBeenCalledWith(
      'Replace the 1 meeting of the schedule with those of week.json?',
      'Replace',
    )
  })

  it('refuses a file that is not a schedule file, and keeps the schedule', async () => {
    const { root, application } = mounted(new Schedule([lab]))
    loadFile(root, 'not a schedule')
    await vi.waitFor(() => expect(root.querySelector('.refusal')).not.toBeNull())
    expect(root.querySelector('.refusal')?.textContent).toBe(
      'week.json is refused: it is not a schedule file, nor JSON.',
    )
    expect(application.schedule.meetings).toEqual([lab])
  })
})

describe('keeping the schedule', () => {
  it('says closing the page loses the schedule when the browser does not keep it', () => {
    const { root } = mounted(new Schedule(), {
      store: { isKept: false, keep: async () => false, keepLock: async () => false },
    })
    expect(root.querySelector('[data-notice="not-kept"]')).not.toBeNull()
  })

  it('says so once a change could not be kept', async () => {
    const { root } = mounted(new Schedule([lab]), {
      store: { isKept: true, keep: async () => false, keepLock: async () => false },
      ask: async () => true,
    })
    ;(root.querySelector('[data-remove="0"]') as HTMLElement).click()
    await vi.waitFor(() => expect(root.querySelector('[data-notice="not-kept"]')).not.toBeNull())
  })

  it('says a kept schedule that could not be read is set aside', () => {
    const { root } = mounted(new Schedule(), {
      restored: { schedule: new Schedule(), wasSetAside: true, isLocked: false },
    })
    expect(root.querySelector('[data-notice="set-aside"]')).not.toBeNull()
  })
})

describe('the lock', () => {
  const lockButton = (root: HTMLElement) =>
    root.querySelector('[data-action="lock"]') as HTMLButtonElement

  it('locks and unlocks the schedule, and keeps whether it is locked', () => {
    const { root, application, keepLock } = mounted(new Schedule([lab]))
    expect(lockButton(root).getAttribute('aria-pressed')).toBe('false')
    lockButton(root).click()
    expect(application.isLocked).toBe(true)
    expect(lockButton(root).textContent).toBe('Locked')
    expect(keepLock).toHaveBeenLastCalledWith(true)
    lockButton(root).click()
    expect(application.isLocked).toBe(false)
    expect(keepLock).toHaveBeenLastCalledWith(false)
  })

  it('opens locked when the schedule was left locked', () => {
    const { application, root } = mounted(new Schedule([lab]), {
      restored: { schedule: new Schedule([lab]), wasSetAside: false, isLocked: true },
    })
    expect(application.isLocked).toBe(true)
    expect(root.querySelector('.grid.locked')).not.toBeNull()
  })

  it('blocks adding, moving, resizing and removing', async () => {
    const { root, application, ask } = mounted(new Schedule([lab]))
    lockButton(root).click()
    expect(root.querySelector('[data-remove]')).toBeNull()
    expect(root.querySelector('[data-resize]')).toBeNull()
    expect((root.querySelector('[data-adding="time-block"]') as HTMLButtonElement).disabled).toBe(
      true,
    )
    press(day(root, Weekday.friday), point(Weekday.friday, '08:00'))
    release(point(Weekday.friday, '08:00'))
    expect(dialog()).toBeNull()
    press(bookingElement(root, 0), point(Weekday.monday, '10:00'))
    moveTo(point(Weekday.tuesday, '14:00'))
    release(point(Weekday.tuesday, '14:00'))
    bookingElement(root, 0).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }),
    )
    await flush()
    expect(ask).not.toHaveBeenCalled()
    expect(application.schedule.meetings).toEqual([lab])
  })

  it('shows a booking clicked, read only', () => {
    const { root } = mounted(new Schedule([lab]))
    lockButton(root).click()
    bookingElement(root, 0).click()
    expect(dialog().querySelector('fieldset')?.disabled).toBe(true)
    const actions = [...dialog().querySelectorAll('.dialog-actions button')].map(
      (button) => button.textContent,
    )
    expect(actions).toEqual(['Close'])
  })
})

describe('the shared schedules', () => {
  const fall = { name: 'Fall 2026', schedule: new Schedule([ana]) }
  const winter = { name: 'Winter 2027', schedule: new Schedule([lab, ana]) }
  const chooser = (root: HTMLElement) => root.querySelector('[data-shared]') as HTMLSelectElement

  function choose(root: HTMLElement, rank: string): void {
    chooser(root).value = rank
    chooser(root).dispatchEvent(new Event('change', { bubbles: true }))
  }

  it('are not offered when there is none', () => {
    const { root } = mounted(new Schedule())
    expect(root.querySelector('[data-shared]')).toBeNull()
  })

  it('are listed by name in the masthead', () => {
    const { root } = mounted(new Schedule(), { sharedSchedules: [fall, winter] })
    const names = [...chooser(root).options].map((option) => option.textContent)
    expect(names).toEqual(['Shared schedules', 'Fall 2026', 'Winter 2027'])
    expect(chooser(root).closest('.masthead')).not.toBeNull()
  })

  it('replace an empty schedule at once, locked', async () => {
    const { root, application, ask } = mounted(new Schedule(), { sharedSchedules: [fall, winter] })
    choose(root, '1')
    await vi.waitFor(() => expect(application.schedule).toBe(winter.schedule))
    expect(application.isLocked).toBe(true)
    expect(ask).not.toHaveBeenCalled()
  })

  it('replace a schedule once confirmed, and nothing otherwise', async () => {
    const ask = vi.fn(async () => false)
    const { root, application } = mounted(new Schedule([lab]), {
      sharedSchedules: [fall, winter],
      ask,
    })
    choose(root, '0')
    await flush()
    expect(ask).toHaveBeenCalledWith(
      'Replace the 1 meeting of the schedule with those of Fall 2026?',
      'Replace',
    )
    expect(application.schedule.meetings).toEqual([lab])
    expect(application.isLocked).toBe(false)
    expect(chooser(root).value).toBe('')
  })

  it('ignore the line that names the list', () => {
    const { root, application } = mounted(new Schedule([lab]), { sharedSchedules: [fall] })
    choose(root, '')
    expect(application.schedule.meetings).toEqual([lab])
  })
})
