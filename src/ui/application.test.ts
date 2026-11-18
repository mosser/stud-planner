// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Cadence, Week } from '../domain/cadence.ts'
import { Category } from '../domain/category.ts'
import { Duration } from '../domain/duration.ts'
import { aMeeting, at } from '../domain/meeting.fixture.ts'
import { Participant } from '../domain/participant.ts'
import { Presence } from '../domain/presence.ts'
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
  const download = vi.fn()
  const context = {
    version: '1.2.3',
    restored: { schedule, wasSetAside: false, isLocked: false },
    store: { isKept: true, keep, keepLock },
    download,
    ask,
    ...changes,
  }
  const application = mountApplication(root, context)
  if (shown !== 'as opened') {
    ;(root.querySelector(`[data-tab="${shown}"]`) as HTMLElement).click()
  }
  return { root, application, keep, keepLock, ask: context.ask, download }
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

/** Types the title, chooses the first category when the dialog asks for one, and submits. */
function typeTitle(title: string): void {
  const input = dialog().querySelector('[name="title"]') as HTMLInputElement
  input.value = title
  const category = dialog().querySelector<HTMLSelectElement>('[name="category"]')
  if (category !== null && category.value === '') {
    category.value = '0'
  }
  input.dispatchEvent(new Event('input', { bubbles: true }))
  dialog().querySelector('form')?.requestSubmit()
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('the screen', () => {
  it('opens on the overview, its tab first, with a masthead and the version', () => {
    const { root, application } = mounted(new Schedule([lab, ana]), {}, 'as opened')
    expect(application.tab).toBe('overview')
    expect(root.querySelector('.masthead h1')?.textContent).toBe('Supervision Planner')
    expect(root.querySelector('.masthead h1 svg.icon')).not.toBeNull()
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

  it('adds a meeting held in the week of the tab, with no weeks to choose', () => {
    const { root, application } = mounted(new Schedule())
    ;(root.querySelector('[data-tab="b"]') as HTMLElement).click()
    press(day(root, Weekday.tuesday), point(Weekday.tuesday, '08:00'))
    release(point(Weekday.tuesday, '08:00'))
    expect(dialog().querySelector('h2')?.textContent).toBe('New meeting in week B')
    expect(dialog().querySelector('[name="cadence"]')).toBeNull()
    typeTitle('Bo')
    expect(application.schedule.meetings[0]?.cadence).toBe(Cadence.biWeekly(Week.b))
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
    expect(dialog().querySelector('h2')?.textContent).toBe('New meeting in both weeks')
    expect(dialog().querySelector('[name="cadence"]')).toBeNull()
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
    expect(dialog().querySelector('h2')?.textContent).toBe('New time block in both weeks')
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
      expect(root.querySelector('.grid + .under-grid .adding')).not.toBeNull()
      expect(root.querySelector('.grid + .under-grid [data-filter]')).not.toBeNull()
      expect(root.querySelector('.under-grid label.filter')?.firstChild?.textContent).toBe(
        'Filter by ',
      )
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

describe('downloading and uploading', () => {
  function uploadFile(root: HTMLElement, text: string, name = 'week.json'): void {
    const input = root.querySelector('[data-file]') as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [new File([text], name)], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }

  it('downloads the schedule file', () => {
    const { root, download } = mounted(new Schedule([lab]))
    const button = root.querySelector('[data-action="download"]') as HTMLElement
    expect(button.getAttribute('aria-label')).toBe('Download')
    expect(button.getAttribute('title')).toBe('Download')
    expect(button.querySelector('svg.action-icon')).not.toBeNull()
    button.click()
    expect(download).toHaveBeenCalledWith(
      scheduleFileOf(new Schedule([lab])),
      'stud-planner-schedule.json',
    )
  })

  it('opens the choice of a file on Upload', () => {
    const { root } = mounted(new Schedule())
    const input = root.querySelector('[data-file]') as HTMLInputElement
    const chosen = vi.spyOn(input, 'click')
    ;(root.querySelector('[data-action="upload"]') as HTMLElement).click()
    expect(chosen).toHaveBeenCalled()
  })

  it('takes a schedule file at once when the schedule is empty', async () => {
    const { root, application, ask } = mounted(new Schedule())
    uploadFile(root, scheduleFileOf(new Schedule([lab, ana])))
    await vi.waitFor(() => expect(application.schedule.meetings).toHaveLength(2))
    expect(ask).not.toHaveBeenCalled()
  })

  it('asks before a schedule file replaces the meetings of the schedule', async () => {
    const { root, application, ask } = mounted(new Schedule([lab]))
    uploadFile(root, scheduleFileOf(new Schedule([ana])))
    await vi.waitFor(() => expect(application.schedule.meetings[0]?.title).toBe('Ana'))
    expect(ask).toHaveBeenCalledWith(
      'Replace the 1 meeting of the schedule with those of week.json?',
      'Replace',
    )
  })

  it('refuses a file that is not a schedule file, and keeps the schedule', async () => {
    const { root, application } = mounted(new Schedule([lab]))
    uploadFile(root, 'not a schedule')
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
    expect(lockButton(root).getAttribute('aria-pressed')).toBe('true')
    expect(lockButton(root).getAttribute('title')).toBe('Unlock')
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
    expect(root.querySelector('.adding')).toBeNull()
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

describe('the participants on the page', () => {
  const zoe = new Participant('Zoé')
  const withZoe = aMeeting({ title: 'Zoé', weekday: Weekday.thursday, participants: [zoe] })

  it('are managed in their dialog, opened from the toolbar', () => {
    const { root, application } = mounted(new Schedule())
    ;(root.querySelector('[data-action="participants"]') as HTMLElement).click()
    const panel = document.querySelector('dialog.participants-dialog') as HTMLElement
    const field = panel.querySelector('input[name="new"]') as HTMLInputElement
    field.value = 'Zoé'
    panel
      .querySelector('form.add-participant')
      ?.dispatchEvent(new Event('submit', { cancelable: true }))
    expect(application.schedule.participants.map((participant) => participant.name)).toEqual([
      'Zoé',
    ])
    expect(root.querySelector('[data-filter]')).not.toBeNull()
  })

  function single(root: HTMLElement, value: string): void {
    const filter = root.querySelector('[data-filter]') as HTMLSelectElement
    filter.value = value
    filter.dispatchEvent(new Event('change', { bubbles: true }))
  }

  it('single out the meetings of the one chosen under the grid', () => {
    const { root } = mounted(new Schedule([lab, withZoe], [], [zoe]), {}, 'overview')
    const filter = root.querySelector('[data-filter]') as HTMLSelectElement
    expect([...filter.options].map((option) => option.textContent)).toEqual([
      'Everyone',
      'Master',
      'PhD',
      'Project',
      'Lab',
      'Zoé',
    ])
    single(root, 'participant:Zoé')
    expect((root.querySelector('[data-filter]') as HTMLSelectElement).value).toBe('participant:Zoé')
    expect(bookingElement(root, 0).classList.contains('dimmed')).toBe(true)
    expect(bookingElement(root, 1).classList.contains('dimmed')).toBe(false)
    single(root, '')
    expect(root.querySelectorAll('.dimmed')).toHaveLength(0)
  })

  it('are not listed when the schedule has none, its categories still are', () => {
    const { root } = mounted(new Schedule([lab]))
    const filter = root.querySelector('[data-filter]') as HTMLSelectElement
    expect(filter.querySelector('optgroup[label="Participants"]')).toBeNull()
    expect(filter.querySelectorAll('optgroup[label="Categories"] option')).toHaveLength(4)
  })

  it('are added from the dialog of a meeting, with the meeting', () => {
    const { root, application } = mounted(new Schedule())
    press(day(root, Weekday.monday), point(Weekday.monday, '08:00'))
    release(point(Weekday.monday, '08:00'))
    const field = dialog().querySelector('input[name="participant-search"]') as HTMLInputElement
    field.value = 'Zoé'
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    typeTitle('Thesis')
    expect(application.schedule.participants.map((participant) => participant.name)).toEqual([
      'Zoé',
    ])
    expect(application.schedule.meetings[0]?.participants).toEqual(
      application.schedule.participants,
    )
  })

  it('are shown read only while the schedule is locked', () => {
    const { root } = mounted(new Schedule([], [], [zoe]))
    ;(root.querySelector('[data-action="lock"]') as HTMLElement).click()
    ;(root.querySelector('[data-action="participants"]') as HTMLElement).click()
    expect(document.querySelector('dialog.participants-dialog form.add-participant')).toBeNull()
  })
})

describe('the categories on the page', () => {
  const phd = Category.named('PhD')
  const ofPhd = aMeeting({ title: 'Thesis', weekday: Weekday.friday, category: phd })

  it('tag each meeting that has one, and single out its meetings', () => {
    const { root } = mounted(new Schedule([lab, ofPhd]), {}, 'overview')
    expect(bookingElement(root, 1).querySelector('.category-tag')?.textContent).toBe('PhD')
    expect(bookingElement(root, 0).querySelector('.category-tag')).toBeNull()
    const filter = root.querySelector('[data-filter]') as HTMLSelectElement
    filter.value = 'category:PhD'
    filter.dispatchEvent(new Event('change', { bubbles: true }))
    expect(bookingElement(root, 0).classList.contains('dimmed')).toBe(true)
    expect(bookingElement(root, 1).classList.contains('dimmed')).toBe(false)
  })
})

describe('on campus or remote', () => {
  const toggle = (root: HTMLElement, week: string, weekday: string) =>
    root.querySelector(
      `[data-presence-week="${week}"][data-presence-weekday="${weekday}"]`,
    ) as HTMLButtonElement

  it('goes, for a day of the week of the tab, from not said to on campus, remote, and back', () => {
    const { root, application } = mounted(new Schedule())
    expect(toggle(root, 'A', 'monday').getAttribute('aria-label')).toBe(
      'Monday: on campus or remote, not said',
    )
    toggle(root, 'A', 'monday').click()
    expect(application.schedule.presenceOn(Week.a, Weekday.monday)).toBe(Presence.onCampus)
    expect(toggle(root, 'A', 'monday').getAttribute('aria-label')).toBe('Monday: on campus')
    toggle(root, 'A', 'monday').click()
    expect(application.schedule.presenceOn(Week.a, Weekday.monday)).toBe(Presence.remote)
    toggle(root, 'A', 'monday').click()
    expect(application.schedule.presenceOn(Week.a, Weekday.monday)).toBeUndefined()
    expect(application.schedule.presenceOn(Week.b, Weekday.monday)).toBeUndefined()
  })

  it('is one toggle on the overview while both weeks say the same, changing both', () => {
    const { root, application } = mounted(new Schedule(), {}, 'overview')
    expect(root.querySelectorAll('[data-presence-weekday="friday"]')).toHaveLength(1)
    toggle(root, 'both', 'friday').click()
    expect(application.schedule.presenceOn(Week.a, Weekday.friday)).toBe(Presence.onCampus)
    expect(application.schedule.presenceOn(Week.b, Weekday.friday)).toBe(Presence.onCampus)
    expect(toggle(root, 'both', 'friday').getAttribute('aria-label')).toBe('Friday: on campus')
    expect(toggle(root, 'both', 'friday').querySelector('.presence-week')).toBeNull()
  })

  it('is two toggles on the overview when the weeks differ, each marked with its letter', () => {
    const remoteInB = new Schedule().afterSettingPresence(Week.b, Weekday.friday, Presence.remote)
    const { root, application } = mounted(remoteInB, {}, 'overview')
    expect(toggle(root, 'B', 'friday').getAttribute('aria-label')).toBe('Friday, week B: remote')
    expect(toggle(root, 'A', 'friday').querySelector('.presence-week')?.textContent).toBe('A')
    toggle(root, 'A', 'friday').click()
    expect(application.schedule.presenceOn(Week.a, Weekday.friday)).toBe(Presence.onCampus)
    expect(application.schedule.presenceOn(Week.b, Weekday.friday)).toBe(Presence.remote)
  })

  it('does not change while the schedule is locked', () => {
    const { root, application } = mounted(new Schedule())
    ;(root.querySelector('[data-action="lock"]') as HTMLElement).click()
    expect(toggle(root, 'A', 'monday').disabled).toBe(true)
    toggle(root, 'A', 'monday').click()
    expect(application.schedule.presences).toEqual([])
  })
})
