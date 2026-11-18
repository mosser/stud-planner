// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { aMeeting } from '../domain/meeting.fixture.ts'
import { Participant } from '../domain/participant.ts'
import { Schedule } from '../domain/schedule.ts'
import { Weekday } from '../domain/weekday.ts'
import { openParticipantsDialog } from './participants-dialog.ts'

const ana = new Participant('Ana')
const bo = new Participant('Bo')

afterEach(() => {
  document.body.innerHTML = ''
})

function opened(start: Schedule, changes: { isReadOnly?: boolean; confirm?: boolean } = {}) {
  let schedule = start
  const ask = vi.fn(async () => changes.confirm ?? true)
  const dialog = openParticipantsDialog(document, {
    schedule: () => schedule,
    change: (changed) => {
      schedule = changed
    },
    ask,
    isReadOnly: changes.isReadOnly ?? false,
  })
  return { dialog, ask, schedule: () => schedule }
}

const names = (dialog: HTMLElement) =>
  [...dialog.querySelectorAll<HTMLInputElement>('input[name="name"]')].map((field) => field.value)
const finding = (dialog: HTMLElement) => dialog.querySelector('.finding')?.textContent
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

function addNamed(dialog: HTMLElement, name: string): void {
  const field = dialog.querySelector('input[name="new"]') as HTMLInputElement
  field.value = name
  dialog
    .querySelector('form.add-participant')
    ?.dispatchEvent(new Event('submit', { cancelable: true }))
}

describe('the participants dialog', () => {
  it('lists the participants, and how many meetings each takes part in', () => {
    const { dialog } = opened(new Schedule([aMeeting({ participants: [ana] })], [], [ana, bo]))
    expect(names(dialog)).toEqual(['Ana', 'Bo'])
    expect(
      [...dialog.querySelectorAll('.participant-meetings')].map((each) => each.textContent),
    ).toEqual(['1 meeting', 'no meeting'])
  })

  it('lists the participants A to Z, whatever order they were added in', () => {
    const { dialog, schedule } = opened(new Schedule([], [], [bo, ana]))
    expect(names(dialog)).toEqual(['Ana', 'Bo'])
    const field = dialog.querySelector('input[data-participant="1"]') as HTMLInputElement
    field.value = 'Anaïs'
    field.dispatchEvent(new Event('change', { bubbles: true }))
    expect(schedule().participants.map((participant) => participant.name)).toEqual(['Bo', 'Anaïs'])
  })

  it('adds a participant by name, and says why a name is refused', () => {
    const { dialog, schedule } = opened(new Schedule([], [], [ana]))
    addNamed(dialog, ' Bo ')
    expect(schedule().participants.map((participant) => participant.name)).toEqual(['Ana', 'Bo'])
    expect(names(dialog)).toEqual(['Ana', 'Bo'])
    expect((dialog.querySelector('input[name="new"]') as HTMLInputElement).value).toBe('')
    addNamed(dialog, 'ana')
    expect(finding(dialog)).toBe('There is already a participant named ana.')
    expect(schedule().participants).toHaveLength(2)
  })

  it('renames a participant in place', () => {
    const { dialog, schedule } = opened(
      new Schedule([aMeeting({ participants: [ana] })], [], [ana]),
    )
    const field = dialog.querySelector('input[data-participant="0"]') as HTMLInputElement
    field.value = 'Anaïs'
    field.dispatchEvent(new Event('change', { bubbles: true }))
    expect(schedule().meetings[0]?.participants[0]?.name).toBe('Anaïs')
  })

  it('asks before removing a participant who takes part in meetings', async () => {
    const start = new Schedule(
      [
        aMeeting({ participants: [ana] }),
        aMeeting({ title: 'Ana again', weekday: Weekday.friday, participants: [ana] }),
      ],
      [],
      [ana, bo],
    )
    const declined = opened(start, { confirm: false })
    ;(declined.dialog.querySelector('[data-remove-participant="0"]') as HTMLElement).click()
    await flush()
    expect(declined.ask).toHaveBeenCalledWith(
      'Remove Ana from the participants, and from 2 meetings?',
      'Remove',
    )
    expect(declined.schedule().participants).toHaveLength(2)
    document.body.innerHTML = ''
    const confirmed = opened(start)
    ;(confirmed.dialog.querySelector('[data-remove-participant="1"]') as HTMLElement).click()
    await flush()
    expect(confirmed.ask).not.toHaveBeenCalled()
    expect(confirmed.schedule().participants).toEqual([ana])
  })

  it('only shows the participants of a locked schedule', () => {
    const { dialog } = opened(new Schedule([], [], [ana]), { isReadOnly: true })
    expect((dialog.querySelector('input[name="name"]') as HTMLInputElement).disabled).toBe(true)
    expect(dialog.querySelector('form.add-participant')).toBeNull()
    expect(dialog.querySelector('[data-remove-participant]')).toBeNull()
    ;(dialog.querySelector('[data-action="close"]') as HTMLElement).click()
    expect(dialog.isConnected).toBe(false)
  })
})
