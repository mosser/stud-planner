// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Cadence, Parity } from '../domain/cadence.ts'
import { aMeeting, at } from '../domain/meeting.fixture.ts'
import { Schedule } from '../domain/schedule.ts'
import { Weekday } from '../domain/weekday.ts'
import { scheduleFileOf } from '../io/schedule-file.ts'
import { type ApplicationContext, mountApplication } from './application.ts'

const odd = Cadence.biWeekly(Parity.odd)
/** Monday 10:00 to 11:00, weekly. */
const lab = aMeeting()
/** Tuesday 10:00 to 11:00, odd week. */
const ana = aMeeting({ title: 'Ana', weekday: Weekday.tuesday, cadence: odd })

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

function mounted(schedule: Schedule, changes: Partial<ApplicationContext> = {}) {
  const root = document.createElement('div')
  document.body.append(root)
  const keep = vi.fn(async () => true)
  const ask = vi.fn(async () => true)
  const save = vi.fn()
  const context = {
    version: '1.2.3',
    restored: { schedule, wasSetAside: false },
    store: { isKept: true, keep },
    save,
    ask,
    ...changes,
  }
  const application = mountApplication(root, context)
  return { root, application, keep, ask: context.ask, save }
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
const meetingElement = (root: HTMLElement, rank: number) =>
  root.querySelector(`[data-meeting="${rank}"]`) as HTMLElement
const dialog = () => document.querySelector('dialog.meeting-dialog') as HTMLDialogElement
const titles = (root: HTMLElement) =>
  [...root.querySelectorAll('.meeting-title')].map((title) => title.textContent)
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
  it('shows the odd week first, a masthead and the version', () => {
    const { root, application } = mounted(new Schedule([lab, ana]))
    expect(application.tab).toBe('odd')
    expect(root.querySelector('.masthead h1')?.textContent).toBe('Stud Planner')
    expect(root.querySelector('.site-footer')?.textContent).toBe('stud-planner v1.2.3')
    expect(root.querySelector('[aria-selected="true"]')?.textContent).toBe('Odd week')
    expect(titles(root)).toEqual(['Lab meeting', 'Ana'])
  })

  it('shows one tab at a time', () => {
    const { root, application } = mounted(new Schedule([lab, ana]))
    ;(root.querySelector('[data-tab="even"]') as HTMLElement).click()
    expect(application.tab).toBe('even')
    expect(titles(root)).toEqual(['Lab meeting'])
    ;(root.querySelector('[data-tab="merged"]') as HTMLElement).click()
    expect(root.querySelector('[role="tabpanel"]')?.getAttribute('aria-label')).toBe('Merged')
    expect(root.querySelector<HTMLElement>('.meeting.odd')?.style.gridRow).toBe('9 / span 4')
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
    expect(application.schedule.meetings[1]?.cadence).toBe(odd)
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
    ;(root.querySelector('[data-tab="even"]') as HTMLElement).click()
    press(day(root, Weekday.tuesday), point(Weekday.tuesday, '08:00'))
    release(point(Weekday.tuesday, '08:00'))
    const choices = [...dialog().querySelectorAll('[name="cadence"] option')].map(
      (option) => option.textContent,
    )
    expect(choices).toEqual(['Weekly', 'Bi-weekly, even week'])
    const cadence = dialog().querySelector('[name="cadence"]') as HTMLSelectElement
    cadence.value = '0'
    cadence.dispatchEvent(new Event('change', { bubbles: true }))
    typeTitle('Bo')
    expect(application.schedule.meetings[0]?.cadence).toBe(Cadence.weekly)
  })

  it('adds nothing from the merged view', () => {
    const { root } = mounted(new Schedule([ana]))
    ;(root.querySelector('[data-tab="merged"]') as HTMLElement).click()
    press(day(root, Weekday.monday), point(Weekday.monday, '08:00'))
    release(point(Weekday.monday, '08:00'))
    expect(dialog()).toBeNull()
    const add = root.querySelector('[data-action="add"]') as HTMLButtonElement
    expect(add.disabled).toBe(true)
    add.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(dialog()).toBeNull()
  })

  it('adds from the toolbar at the first free hour of the week shown', () => {
    const { root, application } = mounted(new Schedule([aMeeting({ start: at('08:00') })]))
    ;(root.querySelector('[data-action="add"]') as HTMLElement).click()
    typeTitle('Ana')
    expect(describeMeetings(application.schedule)[1]).toBe('Ana Monday 09:00-10:00')
    expect(application.schedule.meetings[1]?.cadence).toBe(odd)
  })
})

describe('moving and resizing a meeting', () => {
  it('moves a meeting to the slot it is dragged to, held where it was pressed', () => {
    const { root, application } = mounted(new Schedule([lab]))
    press(meetingElement(root, 0), point(Weekday.monday, '10:30'))
    expect(meetingElement(root, 0).classList.contains('dragging')).toBe(true)
    moveTo(point(Weekday.thursday, '14:30'))
    release(point(Weekday.thursday, '14:30'))
    expect(describeMeetings(application.schedule)).toEqual(['Lab meeting Thursday 14:00-15:00'])
  })

  it('refuses a drop that would overlap another meeting, and says why', () => {
    const { root, application } = mounted(new Schedule([lab, ana]))
    press(meetingElement(root, 0), point(Weekday.monday, '10:00'))
    moveTo(point(Weekday.tuesday, '10:30'))
    expect(root.querySelector('.preview.refused')).not.toBeNull()
    release(point(Weekday.tuesday, '10:30'))
    expect(describeMeetings(application.schedule)[0]).toBe('Lab meeting Monday 10:00-11:00')
    expect(root.querySelector('.refusal')?.textContent).toBe(
      'Overlaps Ana, odd week, 10:00 to 11:00.',
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
    press(meetingElement(root, 0), point(Weekday.monday, '10:00'))
    moveTo(point(Weekday.friday, '15:00'))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    release(point(Weekday.friday, '15:00'))
    expect(describeMeetings(application.schedule)).toEqual(['Lab meeting Monday 10:00-11:00'])
    expect(root.querySelector('.preview')).toBeNull()
  })

  it('opens the dialog of a meeting clicked without a drag', () => {
    const { root, application } = mounted(new Schedule([lab]))
    press(meetingElement(root, 0), point(Weekday.monday, '10:00'))
    release(point(Weekday.monday, '10:00'))
    expect(dialog().querySelector('h2')?.textContent).toBe('Lab meeting')
    typeTitle('Lab')
    expect(application.schedule.meetings[0]?.title).toBe('Lab')
  })

  it('opens the dialog of a meeting from the keyboard', () => {
    const { root } = mounted(new Schedule([lab]))
    meetingElement(root, 0).dispatchEvent(
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
    meetingElement(root, 0).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }),
    )
    await flush()
    expect(application.schedule.meetings).toHaveLength(1)
  })

  it('asks from the dialog of the meeting', async () => {
    const { root, application, ask } = mounted(new Schedule([lab]))
    meetingElement(root, 0).dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
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
    const { root } = mounted(new Schedule(), { store: { isKept: false, keep: async () => false } })
    expect(root.querySelector('[data-notice="not-kept"]')).not.toBeNull()
  })

  it('says so once a change could not be kept', async () => {
    const { root } = mounted(new Schedule([lab]), {
      store: { isKept: true, keep: async () => false },
      ask: async () => true,
    })
    ;(root.querySelector('[data-remove="0"]') as HTMLElement).click()
    await vi.waitFor(() => expect(root.querySelector('[data-notice="not-kept"]')).not.toBeNull())
  })

  it('says a kept schedule that could not be read is set aside', () => {
    const { root } = mounted(new Schedule(), {
      restored: { schedule: new Schedule(), wasSetAside: true },
    })
    expect(root.querySelector('[data-notice="set-aside"]')).not.toBeNull()
  })
})
