import { participantRemovalQuestion } from '../domain/findings.ts'
import { byName, type Participant } from '../domain/participant.ts'
import type { Schedule } from '../domain/schedule.ts'
import { closeDialog, dialogOn, showDialog } from './dialog.ts'
import { html, type Markup } from './html.ts'

/** What the participants dialog works on. */
export interface ParticipantsDialogOptions {
  /** The schedule as it is now: the dialog reads it again after each change. */
  readonly schedule: () => Schedule
  /** Takes a changed schedule: kept, and shown on the page. */
  readonly change: (schedule: Schedule) => void
  /** Asks the Organizer to confirm. */
  readonly ask: (question: string, confirm: string) => Promise<boolean>
  /** Whether the schedule is locked: the participants are shown, and nothing is changed. */
  readonly isReadOnly: boolean
}

function meetingsWritten(count: number): string {
  if (count === 0) {
    return 'no meeting'
  }
  return count === 1 ? '1 meeting' : `${count} meetings`
}

function rowOf(
  schedule: Schedule,
  participant: Participant,
  rank: number,
  isReadOnly: boolean,
): Markup {
  const remove = isReadOnly
    ? ''
    : html`<button type="button" class="remove-participant" data-remove-participant="${rank}"
        aria-label="Remove ${participant.name}" title="Remove">×</button>`
  return html`<li>
    <input name="name" data-participant="${rank}" value="${participant.name}" autocomplete="off"
      aria-label="Name of ${participant.name}" ${isReadOnly ? 'disabled' : ''}>
    <span class="participant-meetings">${meetingsWritten(schedule.meetingsOf(participant).length)}</span>
    ${remove}
  </li>`
}

/** The participants of the schedule, A to Z, each by its rank in the schedule. */
function listOf(schedule: Schedule, isReadOnly: boolean): string {
  return html`${byName(schedule.participants).map((participant) =>
    rowOf(schedule, participant, schedule.participants.indexOf(participant), isReadOnly),
  )}`.text
}

function markupOf(given: ParticipantsDialogOptions): Markup {
  const adding = given.isReadOnly
    ? ''
    : html`<form class="add-participant">
        <input name="new" placeholder="Name" autocomplete="off" aria-label="Name of a new participant">
        <button type="submit">Add</button>
      </form>`
  return html`<div class="participants-panel">
    <h2>Participants</h2>
    <ul class="participant-list"></ul>
    ${adding}
    <p class="finding" role="alert"></p>
    <div class="dialog-actions">
      <button type="button" class="primary" data-action="close">Close</button>
    </div>
  </div>`
}

/**
 * Opens the participants of the schedule: each one renamed in place, or removed, once confirmed
 * when they take part in meetings; and a new one added by name.
 */
export function openParticipantsDialog(
  page: Document,
  given: ParticipantsDialogOptions,
): HTMLDialogElement {
  const dialog = dialogOn(page, 'participants-dialog', markupOf(given).text)
  const list = dialog.querySelector('.participant-list') as HTMLElement
  const finding = dialog.querySelector('.finding') as HTMLElement
  const show = (said = '') => {
    list.innerHTML = listOf(given.schedule(), given.isReadOnly)
    finding.textContent = said
  }
  /** Changes the schedule as `make` says, or shows why it cannot. */
  const attempt = (make: (schedule: Schedule) => Schedule): boolean => {
    try {
      given.change(make(given.schedule()))
      show()
      return true
    } catch (error) {
      show((error as Error).message)
      return false
    }
  }
  const participantAt = (rank: string | undefined) =>
    rank === undefined ? undefined : given.schedule().participants[Number(rank)]

  dialog.querySelector('form.add-participant')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const field = (event.target as HTMLFormElement).elements.namedItem('new') as HTMLInputElement
    if (attempt((schedule) => schedule.afterAddingParticipant(field.value))) {
      field.value = ''
    }
    field.focus()
  })
  list.addEventListener('change', (event) => {
    const field = event.target as HTMLInputElement
    const participant = participantAt(field.dataset.participant)
    if (participant !== undefined && field.value.trim() !== participant.name) {
      attempt((schedule) => schedule.afterRenaming(participant, field.value))
    }
  })
  list.addEventListener('click', (event) => {
    const mark = (event.target as Element).closest<HTMLElement>('[data-remove-participant]')
    const participant = participantAt(mark?.dataset.removeParticipant)
    if (participant === undefined) {
      return
    }
    const theirs = given.schedule().meetingsOf(participant)
    const oneToOne = theirs.filter((meeting) => meeting.student === participant).length
    const count = theirs.length
    const question = participantRemovalQuestion(participant.name, count, oneToOne)
    void (count === 0 ? Promise.resolve(true) : given.ask(question, 'Remove')).then(
      (isConfirmed) => {
        if (isConfirmed) {
          attempt((schedule) => schedule.afterRemovingParticipant(participant))
        }
      },
    )
  })
  dialog
    .querySelector('[data-action="close"]')
    ?.addEventListener('click', () => closeDialog(dialog))
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault()
    closeDialog(dialog)
  })
  show()
  showDialog(dialog)
  dialog
    .querySelector<HTMLElement>(given.isReadOnly ? '[data-action="close"]' : 'input[name="new"]')
    ?.focus()
  return dialog
}
