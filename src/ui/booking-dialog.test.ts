// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Cadence, Week } from '../domain/cadence.ts'
import { Category } from '../domain/category.ts'
import { Duration } from '../domain/duration.ts'
import { aMeeting, aTimeBlock, at } from '../domain/meeting.fixture.ts'
import { Participant } from '../domain/participant.ts'
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
  cadence: Cadence.biWeekly(Week.a),
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
  it('opens where the meeting goes, held in the weeks its heading says, without a title', () => {
    const dialog = openBookingDialog(document, {
      schedule,
      kind: 'meeting',
      proposal,
      onDone: vi.fn(),
    })
    expect(dialog.querySelector('h2')?.textContent).toBe('New meeting in week A')
    expect(dialog.querySelector('[name="cadence"]')).toBeNull()
    const selected = (name: string) => {
      const select = field<HTMLSelectElement>(dialog, name)
      return select.options[select.selectedIndex]?.textContent
    }
    expect(['weekday', 'start', 'duration'].map(selected)).toEqual(['Tuesday', '09:00', '1 h'])
    expect(dialog.querySelector('[data-action="remove"]')).toBeNull()
  })

  it('asks for the category first, and nothing else about the meeting before it', () => {
    const dialog = openBookingDialog(document, {
      schedule,
      kind: 'meeting',
      proposal,
      onDone: vi.fn(),
    })
    expect(dialog.querySelector('[name="title"]')).toBeNull()
    expect(dialog.querySelector('fieldset.participants')).toBeNull()
    expect(done(dialog).disabled).toBe(true)
    expect(finding(dialog)).toBe('')
  })

  it('asks a titled meeting its title and its participants, and Done once titled', () => {
    const onDone = vi.fn()
    const dialog = openBookingDialog(document, { schedule, kind: 'meeting', proposal, onDone })
    choose(dialog, 'category', 'Project')
    expect(dialog.querySelector('fieldset.participants legend')?.textContent).toBe('Participants')
    expect(done(dialog).disabled).toBe(true)
    type(dialog, 'title', ' Thesis tool ')
    type(dialog, 'note', 'Room 3')
    expect(done(dialog).disabled).toBe(false)
    dialog.querySelector('form')?.requestSubmit()
    const added = onDone.mock.calls[0]?.[0]
    expect([added.title, added.note, added.weekday, added.category?.name]).toEqual([
      'Thesis tool',
      'Room 3',
      Weekday.tuesday,
      'Project',
    ])
    expect(dialog.isConnected).toBe(false)
  })

  it('asks a one-to-one meeting its student and its co-supervisors, and Done once it has one', () => {
    const onDone = vi.fn()
    const dialog = openBookingDialog(document, { schedule, kind: 'meeting', proposal, onDone })
    choose(dialog, 'category', 'PhD')
    expect(dialog.querySelector('[name="title"]')).toBeNull()
    const legends = [...dialog.querySelectorAll('fieldset.participants legend')].map(
      (legend) => legend.textContent,
    )
    expect(legends).toEqual(['Student', 'Co-supervisors'])
    expect(done(dialog).disabled).toBe(true)
    const student = dialog.querySelector(
      '.student input[name="participant-search"]',
    ) as HTMLInputElement
    student.value = 'Kalvin'
    student.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(dialog.querySelector('.student input[name="participant-search"]')).toBeNull()
    expect(done(dialog).disabled).toBe(false)
    dialog.querySelector('form')?.requestSubmit()
    const [added, newcomers] = onDone.mock.calls[0] ?? []
    expect([added.title, added.student?.name, added.category?.name]).toEqual([
      'Kalvin',
      'Kalvin',
      'PhD',
    ])
    expect(newcomers).toEqual([added.student])
  })

  it('refuses Done while the meeting would overlap another, and names it', () => {
    const dialog = openBookingDialog(document, {
      schedule,
      kind: 'meeting',
      proposal,
      onDone: vi.fn(),
    })
    choose(dialog, 'weekday', 'Monday')
    choose(dialog, 'start', '10:30')
    expect(done(dialog).disabled).toBe(true)
    expect(finding(dialog)).toBe('Overlaps Lab meeting, week A, 10:00 to 11:00.')
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
    expect(field<HTMLSelectElement>(dialog, 'category').value).toBe('')
    choose(dialog, 'category', 'Lab')
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

describe('the participants of a meeting in its dialog', () => {
  const ana = new Participant('Ana')
  const bo = new Participant('Bo')
  const withAna = aMeeting({ participants: [ana], category: Category.named('Lab') })
  const roster = new Schedule([withAna], [], [ana, bo])

  const chips = (dialog: HTMLElement) =>
    [...dialog.querySelectorAll('.chip')].map((chip) => chip.firstChild?.textContent)

  function typed(dialog: HTMLElement, name: string, how: 'Enter' | 'Add' = 'Enter'): void {
    const field = dialog.querySelector('input[name="participant-search"]') as HTMLInputElement
    field.value = name
    if (how === 'Enter') {
      field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    } else {
      ;(dialog.querySelector('[data-action="pick"]') as HTMLElement).click()
    }
  }

  function opened(onDone = vi.fn()) {
    const dialog = openBookingDialog(document, {
      schedule: roster,
      kind: 'meeting',
      booking: withAna,
      proposal: withAna.timing,
      onDone,
    })
    return dialog
  }

  it('are shown as chips, and picked by name among those of the schedule', () => {
    const onDone = vi.fn()
    const dialog = opened(onDone)
    expect(chips(dialog)).toEqual(['Ana'])
    const offered = [...dialog.querySelectorAll('datalist option')].map((option) =>
      option.getAttribute('value'),
    )
    expect(offered).toEqual(['Bo'])
    typed(dialog, ' bo')
    expect(chips(dialog)).toEqual(['Ana', 'Bo'])
    dialog.querySelector('form')?.requestSubmit()
    expect(onDone.mock.calls[0]?.[0].participants).toEqual([ana, bo])
    expect(onDone.mock.calls[0]?.[1]).toEqual([])
  })

  it('make a new participant of a name no one has, given with the meeting', () => {
    const onDone = vi.fn()
    const dialog = opened(onDone)
    typed(dialog, 'Zoé', 'Add')
    expect(dialog.querySelector('.chip.new')?.textContent).toContain('Zoé (new)')
    dialog.querySelector('form')?.requestSubmit()
    const [meeting, newcomers] = onDone.mock.calls[0] ?? []
    expect(newcomers.map((participant: Participant) => participant.name)).toEqual(['Zoé'])
    expect(meeting.participants[1]).toBe(newcomers[0])
  })

  it('lose a chip by its mark, and take no name twice', () => {
    const onDone = vi.fn()
    const dialog = opened(onDone)
    typed(dialog, 'ANA')
    expect(chips(dialog)).toEqual(['Ana'])
    ;(dialog.querySelector('[data-unpick="0"]') as HTMLElement).click()
    expect(chips(dialog)).toEqual([])
    dialog.querySelector('form')?.requestSubmit()
    expect(onDone.mock.calls[0]?.[0].participants).toEqual([])
  })

  it('are not asked of a time block, and only shown when read only', () => {
    const block = openBookingDialog(document, {
      schedule: roster,
      kind: 'time-block',
      proposal,
      onDone: vi.fn(),
    })
    expect(block.querySelector('fieldset.participants')).toBeNull()
    const shown = openBookingDialog(document, {
      schedule: roster,
      kind: 'meeting',
      booking: withAna,
      proposal: withAna.timing,
      isReadOnly: true,
      onDone: vi.fn(),
    })
    expect(chips(shown)).toEqual(['Ana'])
    expect(shown.querySelector('[data-unpick]')).toBeNull()
    expect(shown.querySelector('input[name="participant-search"]')).toBeNull()
  })
})

describe('the dialog of a time block', () => {
  it('adds a time block without a title, and has no note', () => {
    const onDone = vi.fn()
    const dialog = openBookingDialog(document, { schedule, kind: 'time-block', proposal, onDone })
    expect(dialog.querySelector('h2')?.textContent).toBe('New time block in week A')
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
    expect(finding(dialog)).toBe('Overlaps Lab meeting, week A, 10:00 to 11:00.')
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

describe('the dialog of a booking shown read only', () => {
  it('shows its fields disabled, and closes without a change', () => {
    const onDone = vi.fn()
    const dialog = openBookingDialog(document, {
      schedule,
      kind: 'meeting',
      booking: lab,
      proposal: lab.timing,
      isReadOnly: true,
      onDone,
    })
    expect(dialog.querySelector('fieldset')?.disabled).toBe(true)
    expect(dialog.querySelector('[data-action="done"]')).toBeNull()
    expect(dialog.querySelector('[data-action="remove"]')).toBeNull()
    dialog.querySelector('form')?.requestSubmit()
    expect(onDone).not.toHaveBeenCalled()
    ;(dialog.querySelector('[data-action="cancel"]') as HTMLElement).click()
    expect(dialog.isConnected).toBe(false)
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
