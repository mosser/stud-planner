import type { Participant as ParticipantType } from '../domain/participant.ts'
import { Participant } from '../domain/participant.ts'
import type { Schedule } from '../domain/schedule.ts'
import { html } from './html.ts'

/** What a picker of participants is given. */
export interface PickerOptions {
  /** The schedule, whose participants are offered as one types. */
  readonly schedule: Schedule
  /** What the picker is for, as its legend says: Student, Co-supervisors, Participants. */
  readonly legend: string
  /** The participants picked: the picker changes this list in place. */
  readonly picked: ParticipantType[]
  /** How many it may pick at most: one for a student; any number when absent. */
  readonly limit?: number | undefined
  /** The participants picked elsewhere in the dialog, which this picker does not take again. */
  readonly elsewhere: () => readonly ParticipantType[]
  /** Whether the participants are only shown. */
  readonly isReadOnly: boolean
  /** Called once the participants picked change. */
  readonly onChange: () => void
  /** Called with why a name typed is refused. */
  readonly onRefused: (reason: string) => void
}

/** A number for each picker drawn, so that its list of names is its own. */
let pickersDrawn = 0

/**
 * A picker of participants: each picked shown as a chip, removed by its mark, and a field where a
 * name typed is picked among the participants of the schedule, offered as one types, by Enter or
 * Add; a name no participant has makes a new one, marked (new).
 */
export function drawPicker(element: HTMLElement, given: PickerOptions): void {
  pickersDrawn += 1
  const listId = `participant-names-${pickersDrawn}`
  const show = () => {
    const isFull = given.limit !== undefined && given.picked.length >= given.limit
    const chips = given.picked.map((participant, rank) => {
      const isNew = !given.schedule.participants.includes(participant)
      const unpick = given.isReadOnly
        ? ''
        : html`<button type="button" data-unpick="${rank}" aria-label="Remove ${participant.name}">×</button>`
      return html`<li class="chip ${isNew ? 'new' : ''}">${participant.name}${isNew ? ' (new)' : ''}${unpick}</li>`
    })
    const offered = given.schedule.participants.filter(
      (participant) =>
        !given.picked.includes(participant) && !given.elsewhere().includes(participant),
    )
    const field =
      given.isReadOnly || isFull
        ? ''
        : html`<div class="pick">
            <input name="participant-search" list="${listId}" autocomplete="off"
              placeholder="Type a name" aria-label="${given.legend}: add a name">
            <button type="button" data-action="pick">Add</button>
          </div>
          <datalist id="${listId}">${offered.map(
            (participant) => html`<option value="${participant.name}"></option>`,
          )}</datalist>`
    element.innerHTML = html`<fieldset class="participants">
      <legend>${given.legend}</legend>
      <ul class="chips">${chips}</ul>
      ${field}
    </fieldset>`.text
    attach()
  }
  const pickTyped = (typed: string): boolean => {
    const taken = [...given.picked, ...given.elsewhere()]
    if (typed.trim() === '' || taken.some((participant) => participant.isNamed(typed))) {
      return true
    }
    try {
      given.picked.push(given.schedule.participantNamed(typed) ?? new Participant(typed))
      return true
    } catch (error) {
      given.onRefused((error as Error).message)
      return false
    }
  }
  const attach = () => {
    const field = element.querySelector<HTMLInputElement>('input[name="participant-search"]')
    const pickFromField = () => {
      if (field !== null && pickTyped(field.value)) {
        show()
        given.onChange()
        element.querySelector<HTMLInputElement>('input[name="participant-search"]')?.focus()
      }
    }
    field?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        pickFromField()
      }
    })
    field?.addEventListener('input', (event) => {
      const kind = (event as InputEvent).inputType
      const isChosenFromTheList = !kind || kind === 'insertReplacementText'
      if (isChosenFromTheList && given.schedule.participantNamed(field.value) !== undefined) {
        pickFromField()
      }
    })
    element.querySelector('[data-action="pick"]')?.addEventListener('click', pickFromField)
    for (const mark of element.querySelectorAll<HTMLElement>('[data-unpick]')) {
      mark.addEventListener('click', () => {
        given.picked.splice(Number(mark.dataset.unpick), 1)
        show()
        given.onChange()
      })
    }
  }
  show()
}
