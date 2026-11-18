import type { Booking, Timing } from '../domain/booking.ts'
import { Cadence } from '../domain/cadence.ts'
import { Category } from '../domain/category.ts'
import { theDay } from '../domain/day.ts'
import { Duration } from '../domain/duration.ts'
import {
  aTimeBlock,
  cadenceChoice,
  durationWritten,
  newBookingHeading,
  overlap,
} from '../domain/findings.ts'
import { Meeting } from '../domain/meeting.ts'
import type { Participant } from '../domain/participant.ts'
import type { Schedule } from '../domain/schedule.ts'
import { TimeBlock } from '../domain/time-block.ts'
import { Weekday } from '../domain/weekday.ts'
import { closeDialog, dialogOn, showDialog } from './dialog.ts'
import { html, type Markup } from './html.ts'

/** What a booking is: a meeting, or a time block. */
export type Kind = 'meeting' | 'time-block'

/** What the dialog opens with: a booking of the schedule, or where a new one goes. */
export interface BookingDialogOptions {
  readonly schedule: Schedule
  /** What the dialog adds, when it adds one; the kind of the booking changed otherwise. */
  readonly kind: Kind
  /** The booking changed; absent for a new booking. */
  readonly booking?: Booking | undefined
  /** Where a new booking goes, and the cadence offered. */
  readonly proposal: Timing
  /** Whether the booking is only shown, the schedule being locked: nothing can be changed. */
  readonly isReadOnly?: boolean | undefined
  /** Called with the booking as Done leaves it: never one that overlaps another. */
  readonly onDone: (booking: Booking) => void
  /** Called when the Organizer asks to remove the booking changed. */
  readonly onRemove?: (booking: Booking) => void
}

/** What the fields of the dialog make: a booking, or why they make none. */
type Outcome =
  | { readonly booking: Booking; readonly finding: undefined }
  | { readonly booking: undefined; readonly finding: string | undefined }

/** A title that stands in while the Organizer has typed none, to check everything else. */
const standInTitle = 'Meeting'

/** The options of a list, each valued by its rank; which is chosen is set by `choose`. */
function options<T>(values: readonly T[], label: (value: T) => string): Markup {
  return html`${values.map((value, rank) => html`<option value="${rank}">${label(value)}</option>`)}`
}

const durations = Array.from({ length: theDay.quarterCount }, (_unused, rank) =>
  Duration.ofQuarters(rank + 1),
)

function headingOf(given: BookingDialogOptions): string {
  const { booking } = given
  if (booking !== undefined) {
    return booking.title ?? aTimeBlock
  }
  return newBookingHeading(given.kind === 'time-block', given.proposal.cadence)
}

function noteField(given: BookingDialogOptions): Markup | string {
  if (given.kind !== 'meeting') {
    return ''
  }
  const note = given.booking instanceof Meeting ? given.booking.note : undefined
  return html`<label>Note <textarea name="note" rows="2">${note ?? ''}</textarea></label>`
}

/** What a meeting is about, among the categories configured; none to choose for a time block. */
function categoryField(given: BookingDialogOptions): Markup | string {
  if (given.kind !== 'meeting') {
    return ''
  }
  return html`<label>Category <select name="category">
    <option value="">Choose a category</option>
    ${Category.all.map((category, rank) => html`<option value="${rank}">${category.name}</option>`)}
  </select></label>`
}

/** The participants of the schedule, each to tick, for a meeting; none for a time block. */
function participantsField(given: BookingDialogOptions): Markup | string {
  const { participants } = given.schedule
  if (given.kind !== 'meeting' || participants.length === 0) {
    return ''
  }
  const meeting = given.booking instanceof Meeting ? given.booking : undefined
  return html`<fieldset class="participants">
    <legend>Participants</legend>
    ${participants.map(
      (participant, rank) => html`<label class="participant"><input type="checkbox"
        name="participant" value="${rank}" ${meeting?.hasParticipant(participant) ? 'checked' : ''}
        >${participant.name}</label>`,
    )}
  </fieldset>`
}

/** The participants ticked. */
function participantsTicked(form: HTMLFormElement, given: BookingDialogOptions): Participant[] {
  const ticked = [...form.querySelectorAll<HTMLInputElement>('input[name="participant"]')]
  return ticked
    .filter((box) => box.checked)
    .map((box) => given.schedule.participants[Number(box.value)])
    .filter((participant): participant is Participant => participant !== undefined)
}

/** The actions of the dialog: Close alone when read only; Remove, Cancel and Done otherwise. */
function actionsOf(given: BookingDialogOptions): Markup {
  if (given.isReadOnly === true) {
    return html`<button type="button" class="primary" data-action="cancel">Close</button>`
  }
  const remove =
    given.booking === undefined
      ? ''
      : html`<button type="button" class="danger" data-action="remove">Remove</button>`
  return html`${remove}
    <button type="button" data-action="cancel">Cancel</button>
    <button type="submit" class="primary" data-action="done">Done</button>`
}

function markupOf(given: BookingDialogOptions): Markup {
  const { booking } = given
  return html`<form method="dialog">
    <h2>${headingOf(given)}</h2>
    <fieldset ${given.isReadOnly === true ? 'disabled' : ''}>
    <label>Title <input name="title" value="${booking?.title ?? ''}" autocomplete="off"></label>
    ${weeksField(given)}
    <label>Weekday <select name="weekday">${options(Weekday.all, (weekday) => weekday.name)}</select></label>
    <label>Start <select name="start">${options(theDay.quarters, String)}</select></label>
    <label>Duration <select name="duration">${options(durations, durationWritten)}</select></label>
    ${categoryField(given)}
    ${participantsField(given)}
    ${noteField(given)}
    </fieldset>
    <p class="finding" role="alert"></p>
    <div class="dialog-actions">${actionsOf(given)}</div>
  </form>`
}

/**
 * The weeks a booking is held in, chosen when it is changed. A booking added is held in the weeks
 * of the tab it is added from, which its heading says: there is nothing to choose.
 */
function weeksField(given: BookingDialogOptions): Markup | string {
  if (given.booking === undefined) {
    return ''
  }
  return html`<label>Weeks <select name="cadence">${options(Cadence.all, cadenceChoice)}</select></label>`
}

/** Chooses in each list of the dialog what the booking, or the new one, has. */
function choose(form: HTMLFormElement, given: BookingDialogOptions): void {
  const shown = given.booking ?? given.proposal
  const ranks: Record<string, number> = {
    cadence: Cadence.all.indexOf(shown.cadence),
    weekday: Weekday.all.indexOf(shown.weekday),
    start: theDay.quarterAt(shown.start),
    duration: shown.duration.quarters - 1,
  }
  for (const [name, rank] of Object.entries(ranks)) {
    const field = form.elements.namedItem(name) as HTMLSelectElement | null
    if (field !== null) {
      field.value = String(rank)
    }
  }
  const meeting = given.booking instanceof Meeting ? given.booking : undefined
  const category = form.elements.namedItem('category') as HTMLSelectElement | null
  if (category !== null) {
    const rank = meeting?.category === undefined ? -1 : Category.all.indexOf(meeting.category)
    category.value = rank < 0 ? '' : String(rank)
  }
  for (const box of form.querySelectorAll<HTMLInputElement>('input[name="participant"]')) {
    const participant = given.schedule.participants[Number(box.value)]
    box.checked = participant !== undefined && meeting?.hasParticipant(participant) === true
  }
}

/** What a list of the dialog has chosen; nothing while it shows its heading, valued empty. */
function chosen<T>(form: HTMLFormElement, name: string, values: readonly T[]): T | undefined {
  const field = form.elements.namedItem(name) as HTMLSelectElement | null
  if (field === null || field.value === '') {
    return undefined
  }
  return values[Number(field.value)]
}

function textOf(form: HTMLFormElement, name: string): string {
  const field = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null
  return field?.value ?? ''
}

function timingOf(form: HTMLFormElement, given: BookingDialogOptions): Timing | undefined {
  const cadence =
    given.booking === undefined ? given.proposal.cadence : chosen(form, 'cadence', Cadence.all)
  const weekday = chosen(form, 'weekday', Weekday.all)
  const start = chosen(form, 'start', theDay.quarters)
  const duration = chosen(form, 'duration', durations)
  if (cadence === undefined || weekday === undefined || start === undefined || !duration) {
    return undefined
  }
  return { cadence, weekday, start, duration }
}

/** The booking the fields make; a meeting without a title stands in with one to be checked. */
function candidateOf(form: HTMLFormElement, given: BookingDialogOptions, timing: Timing): Booking {
  const title = textOf(form, 'title')
  if (given.kind === 'time-block') {
    return new TimeBlock({ ...timing, title })
  }
  return new Meeting({
    ...timing,
    title: title.trim() || standInTitle,
    note: textOf(form, 'note'),
    participants: participantsTicked(form, given),
    category: chosen(form, 'category', Category.all),
  })
}

/**
 * What the fields make: the booking, unless it breaks one of its rules, overlaps another booking
 * of the schedule, which the finding then says, or is a meeting without a title.
 */
function outcomeOf(form: HTMLFormElement, given: BookingDialogOptions): Outcome {
  const timing = timingOf(form, given)
  if (timing === undefined) {
    return { booking: undefined, finding: undefined }
  }
  let candidate: Booking
  try {
    candidate = candidateOf(form, given, timing)
  } catch (error) {
    return { booking: undefined, finding: (error as Error).message }
  }
  const other = given.schedule.overlapOf(candidate, given.booking)
  if (other !== undefined) {
    return { booking: undefined, finding: overlap(candidate, other) }
  }
  const isIncomplete =
    textOf(form, 'title').trim() === '' || (candidate instanceof Meeting && !candidate.category)
  if (given.kind === 'meeting' && isIncomplete) {
    return { booking: undefined, finding: undefined }
  }
  return { booking: candidate, finding: undefined }
}

/**
 * Opens the dialog of a meeting or a time block on the page. Done is refused while the fields make
 * none, and the dialog says why; Cancel, Escape or a click outside the dialog change nothing.
 */
export function openBookingDialog(page: Document, given: BookingDialogOptions): HTMLDialogElement {
  const dialog = dialogOn(page, `booking-dialog ${given.kind}`, markupOf(given).text)
  const form = dialog.querySelector('form') as HTMLFormElement
  const finding = dialog.querySelector('.finding') as HTMLElement
  const done = dialog.querySelector<HTMLButtonElement>('[data-action="done"]')
  const update = (): Outcome => {
    const outcome = outcomeOf(form, given)
    finding.textContent = outcome.finding ?? ''
    if (done !== null) {
      done.disabled = outcome.booking === undefined
    }
    return outcome
  }
  choose(form, given)
  form.addEventListener('input', update)
  form.addEventListener('change', update)
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const { booking } = update()
    if (booking !== undefined && given.isReadOnly !== true) {
      closeDialog(dialog)
      given.onDone(booking)
    }
  })
  dialog
    .querySelector('[data-action="cancel"]')
    ?.addEventListener('click', () => closeDialog(dialog))
  dialog.querySelector('[data-action="remove"]')?.addEventListener('click', () => {
    closeDialog(dialog)
    if (given.booking !== undefined) {
      given.onRemove?.(given.booking)
    }
  })
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault()
    closeDialog(dialog)
  })
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      closeDialog(dialog)
    }
  })
  if (given.isReadOnly !== true) {
    update()
  }
  showDialog(dialog)
  const first = given.isReadOnly === true ? '[data-action="cancel"]' : 'input[name="title"]'
  form.querySelector<HTMLElement>(first)?.focus()
  return dialog
}
