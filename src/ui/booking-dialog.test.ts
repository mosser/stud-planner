// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Cadence, Parity } from '../domain/cadence.ts'
import { Duration } from '../domain/duration.ts'
import { aMeeting, aTimeBlock, at } from '../domain/meeting.fixture.ts'
import { Schedule } from '../domain/schedule.ts'
import { Weekday } from '../domain/weekday.ts'
import { openBookingDialog } from './booking-dialog.ts'
import { askToConfirm } from './confirmation.ts'

const lab = aMeeting({ note: 'Room 201' })
const schedule = new Schedule([lab])
const proposal = {
  weekday: Weekday.tuesday,
  start: at('09:00'),
  duration: Duration.ofQuarters(4),
  cadence: Cadence.biWeekly(Parity.odd),
}

function field<T extends HTMLElement>(dialog: HTMLElement, name: string): T {
  return dialog.querySelector(`[name="${name}"]`) as T
}

function type(dialog: HTMLElement, name: string, value: string): void {
  const element = field<HTMLInputElement>(dialog, name)
  element.value = value
  element.dispatchEvent(new Event('input', { bubbles: true }))
}

function choose(dialog: HTMLElement, name: string, label: string): void {
  const select = field<HTMLSelectElement>(dialog, name)
  const option = [...select.options].find((each) => each.textContent === label)
  select.value = option?.value ?? ''
  select.dispatchEvent(new Event('change', { bubbles: true }))
}

const done = (dialog: HTMLElement) =>
  dialog.querySelector('[data-action="done"]') as HTMLButtonElement
const finding = (dialog: HTMLElement) => dialog.querySelector('.finding')?.textContent

afterEach(() => {
  document.body.innerHTML = ''
})

describe('the meeting dialog of a new meeting', () => {
  it('opens where the meeting goes, with the cadence offered and no title', () => {
    const dialog = openBookingDialog(document, {
      schedule,
      kind: 'meeting',
      proposal,
      onDone: vi.fn(),
    })
    expect(dialog.querySelector('h2')?.textContent).toBe('New meeting')
    const selected = (name: string) => {
      const select = field<HTMLSelectElement>(dialog, name)
      return select.options[select.selectedIndex]?.textContent
    }
    expect(['cadence', 'weekday', 'start', 'duration'].map(selected)).toEqual([
      'Bi-weekly, odd week',
      'Tuesday',
      '09:00',
      '1 h',
    ])
    expect(dialog.querySelector('[data-action="remove"]')).toBeNull()
  })

  it('refuses Done until the meeting has a title', () => {
    const onDone = vi.fn()
    const dialog = openBookingDialog(document, { schedule, kind: 'meeting', proposal, onDone })
    expect(done(dialog).disabled).toBe(true)
    expect(finding(dialog)).toBe('')
    type(dialog, 'title', ' Ana ')
    type(dialog, 'note', 'Room 3')
    expect(done(dialog).disabled).toBe(false)
    dialog.querySelector('form')?.requestSubmit()
    expect(onDone).toHaveBeenCalledTimes(1)
    const added = onDone.mock.calls[0]?.[0]
    expect([added.title, added.note, added.weekday]).toEqual(['Ana', 'Room 3', Weekday.tuesday])
    expect(dialog.isConnected).toBe(false)
  })

  it('refuses Done while the meeting would overlap another, and names it', () => {
    const dialog = openBookingDialog(document, {
      schedule,
      kind: 'meeting',
      proposal,
      onDone: vi.fn(),
    })
    type(dialog, 'title', 'Ana')
    choose(dialog, 'weekday', 'Monday')
    choose(dialog, 'start', '10:30')
    expect(done(dialog).disabled).toBe(true)
    expect(finding(dialog)).toBe('Overlaps Lab meeting, odd week, 10:00 to 11:00.')
    dialog.querySelector('form')?.requestSubmit()
    expect(dialog.isConnected).toBe(true)
  })

  it('refuses Done while the meeting would end after the day', () => {
    const dialog = openBookingDialog(document, {
      schedule,
      kind: 'meeting',
      proposal,
      onDone: vi.fn(),
    })
    choose(dialog, 'start', '17:30')
    expect(finding(dialog)).toBe('A meeting cannot end after 18:00.')
  })

  it('changes nothing on Cancel, Escape or a click outside', () => {
    const onDone = vi.fn()
    const cancelled = openBookingDialog(document, { schedule, kind: 'meeting', proposal, onDone })
    ;(cancelled.querySelector('[data-action="cancel"]') as HTMLElement).click()
    const escaped = openBookingDialog(document, { schedule, kind: 'meeting', proposal, onDone })
    escaped.dispatchEvent(new Event('cancel', { cancelable: true }))
    const outside = openBookingDialog(document, { schedule, kind: 'meeting', proposal, onDone })
    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect([cancelled, escaped, outside].map((dialog) => dialog.isConnected)).toEqual([
      false,
      false,
      false,
    ])
    expect(onDone).not.toHaveBeenCalled()
  })
})

describe('the meeting dialog of a meeting of the schedule', () => {
  it('opens with the meeting, and does not count it as an overlap', () => {
    const onDone = vi.fn()
    const dialog = openBookingDialog(document, {
      schedule,
      kind: 'meeting',
      booking: lab,
      proposal: lab,
      onDone,
    })
    expect(dialog.querySelector('h2')?.textContent).toBe('Lab meeting')
    expect(field<HTMLTextAreaElement>(dialog, 'note').value).toBe('Room 201')
    choose(dialog, 'duration', '1 h 30')
    dialog.querySelector('form')?.requestSubmit()
    expect(onDone.mock.calls[0]?.[0].end.toString()).toBe('11:30')
  })

  it('asks to remove the meeting', () => {
    const onRemove = vi.fn()
    const dialog = openBookingDialog(document, {
      schedule,
      kind: 'meeting',
      booking: lab,
      proposal: lab,
      onDone: vi.fn(),
      onRemove,
    })
    ;(dialog.querySelector('[data-action="remove"]') as HTMLElement).click()
    expect(onRemove).toHaveBeenCalledWith(lab)
    expect(dialog.isConnected).toBe(false)
  })
})

describe('the dialog of a time block', () => {
  it('adds a time block without a title, and has no note', () => {
    const onDone = vi.fn()
    const dialog = openBookingDialog(document, { schedule, kind: 'time-block', proposal, onDone })
    expect(dialog.querySelector('h2')?.textContent).toBe('New time block')
    expect(dialog.querySelector('[name="note"]')).toBeNull()
    expect(done(dialog).disabled).toBe(false)
    dialog.querySelector('form')?.requestSubmit()
    const added = onDone.mock.calls[0]?.[0]
    expect([added.isTimeBlock, added.title, added.weekday]).toEqual([
      true,
      undefined,
      Weekday.tuesday,
    ])
  })

  it('refuses Done while the time block would overlap a meeting', () => {
    const dialog = openBookingDialog(document, {
      schedule,
      kind: 'time-block',
      proposal,
      onDone: vi.fn(),
    })
    choose(dialog, 'weekday', 'Monday')
    choose(dialog, 'start', '10:30')
    expect(finding(dialog)).toBe('Overlaps Lab meeting, odd week, 10:00 to 11:00.')
    expect(done(dialog).disabled).toBe(true)
  })

  it('opens with a time block of the schedule, headed by its title or as a time block', () => {
    const block = aTimeBlock()
    const withBlock = new Schedule([lab], [block])
    const onDone = vi.fn()
    const dialog = openBookingDialog(document, {
      schedule: withBlock,
      kind: 'time-block',
      booking: block,
      proposal: block.timing,
      onDone,
    })
    expect(dialog.querySelector('h2')?.textContent).toBe('Time block')
    type(dialog, 'title', 'Research')
    dialog.querySelector('form')?.requestSubmit()
    expect(onDone.mock.calls[0]?.[0].title).toBe('Research')
  })
})

describe('a confirmation', () => {
  it('asks the question, and gives whether the Organizer confirms', async () => {
    const confirmed = askToConfirm(document, 'Remove Lab?', 'Remove')
    const dialog = document.querySelector('dialog.confirmation') as HTMLElement
    expect(dialog.querySelector('.question')?.textContent).toBe('Remove Lab?')
    dialog.querySelector('form')?.requestSubmit()
    expect(await confirmed).toBe(true)
  })

  it('is not given on Cancel or Escape', async () => {
    const cancelled = askToConfirm(document, 'Remove Lab?', 'Remove')
    ;(document.querySelector('[data-answer="no"]') as HTMLElement).click()
    expect(await cancelled).toBe(false)
    const escaped = askToConfirm(document, 'Remove Lab?', 'Remove')
    document.querySelector('dialog')?.dispatchEvent(new Event('cancel', { cancelable: true }))
    expect(await escaped).toBe(false)
    expect(document.querySelector('dialog')).toBeNull()
  })
})
