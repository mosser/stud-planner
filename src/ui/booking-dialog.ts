import type { Booking, Timing } from '../domain/booking.ts'
import { Cadence } from '../domain/cadence.ts'
import { Category } from '../domain/category.ts'
import { theDay } from '../domain/day.ts'
import { Duration } from '../domain/duration.ts'
import {
  aTimeBlock,
  cadenceChoice,
  durationWritten,
  labelOf,
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
import { drawPicker } from './picker.ts'

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
  /**
   * Called with the booking as Done leaves it, never one that overlaps another, and the
   * participants it names for the first time, to be added to the schedule with it.
   */
  readonly onDone: (booking: Booking, newcomers: readonly Participant[]) => void
  /** Called when the Organizer asks to remove the booking changed. */
  readonly onRemove?: (booking: Booking) => void
}

/** What the fields of the dialog make: a booking, or why they make none. */
type Outcome =
  | { readonly booking: Booking; readonly finding: undefined }
  | { readonly booking: undefined; readonly finding: string | undefined }

/** Who a meeting of the dialog is with, as it is picked: its student, and its other participants. */
interface Picked {
  readonly student: Participant[]
  readonly participants: Participant[]
}

/** A title that stands in while the Organizer has typed none, to check the time of a meeting. */
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
    return booking.isTimeBlock ? (booking.title ?? aTimeBlock) : labelOf(booking)
  }
  return newBookingHeading(given.kind === 'time-block', given.proposal.cadence)
}

function meetingOf(given: BookingDialogOptions): Meeting | undefined {
  return given.booking instanceof Meeting ? given.booking : undefined
}

/** What a meeting is about, asked first: it decides what else the meeting needs. */
function categoryField(given: BookingDialogOptions): Markup | string {
  if (given.kind !== 'meeting') {
    return ''
  }
  return html`<label>Category <select name="category">
    <option value="">Choose a category</option>
    ${Category.all.map((category, rank) => html`<option value="${rank}">${category.name}</option>`)}
  </select></label>`
}

/** The title of a time block, which may have none. */
function timeBlockTitle(given: BookingDialogOptions): Markup | string {
  if (given.kind !== 'time-block') {
    return ''
  }
  return html`<label>Title <input name="title" value="${given.booking?.title ?? ''}" autocomplete="off"></label>`
}

function noteField(given: BookingDialogOptions): Markup | string {
  if (given.kind !== 'meeting') {
    return ''
  }
  return html`<label>Note <textarea name="note" rows="2">${meetingOf(given)?.note ?? ''}</textarea></label>`
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

function markupOf(given: BookingDialogOptions): Markup {
  return html`<form method="dialog">
    <h2>${headingOf(given)}</h2>
    <fieldset ${given.isReadOnly === true ? 'disabled' : ''}>
    ${categoryField(given)}
    <div class="who"></div>
    ${timeBlockTitle(given)}
    ${weeksField(given)}
    <label>Weekday <select name="weekday">${options(Weekday.all, (weekday) => weekday.name)}</select></label>
    <label>Start <select name="start">${options(theDay.quarters, String)}</select></label>
    <label>Duration <select name="duration">${options(durations, durationWritten)}</select></label>
    ${noteField(given)}
    </fieldset>
    <p class="finding" role="alert"></p>
    <div class="dialog-actions">${actionsOf(given)}</div>
  </form>`
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
  const category = form.elements.namedItem('category') as HTMLSelectElement | null
  const current = meetingOf(given)?.category
  if (category !== null) {
    category.value = current === undefined ? '' : String(Category.all.indexOf(current))
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

/**
 * What a booking of these fields would take, to check its time before it is complete: the time
 * block itself, or a meeting standing in for the one being made.
 */
function probeOf(form: HTMLFormElement, given: BookingDialogOptions, timing: Timing): Booking {
  if (given.kind === 'time-block') {
    return new TimeBlock({ ...timing, title: textOf(form, 'title') })
  }
  return new Meeting({ ...timing, title: standInTitle })
}

/**
 * The meeting the fields make, once complete: its category chosen, and its student when
 * one-to-one, its title otherwise. Absent while incomplete.
 */
function meetingFrom(form: HTMLFormElement, timing: Timing, picked: Picked): Meeting | undefined {
  const category = chosen(form, 'category', Category.all)
  const [student] = picked.student
  const title = textOf(form, 'title').trim()
  const isComplete = category?.isOneToOne ? student !== undefined : title !== ''
  if (category === undefined || !isComplete) {
    return undefined
  }
  return new Meeting({
    ...timing,
    category,
    title: category.isOneToOne ? undefined : title,
    student: category.isOneToOne ? student : undefined,
    participants: picked.participants,
    note: textOf(form, 'note'),
  })
}

/**
 * What the fields make: the booking, unless it breaks one of its rules or overlaps another booking
 * of the schedule, which the finding then says, or is a meeting still incomplete.
 */
function outcomeOf(form: HTMLFormElement, given: BookingDialogOptions, picked: Picked): Outcome {
  const timing = timingOf(form, given)
  if (timing === undefined) {
    return { booking: undefined, finding: undefined }
  }
  try {
    const probe = probeOf(form, given, timing)
    const other = given.schedule.overlapOf(probe, given.booking)
    if (other !== undefined) {
      return { booking: undefined, finding: overlap(probe, other) }
    }
    const booking = given.kind === 'time-block' ? probe : meetingFrom(form, timing, picked)
    return booking === undefined
      ? { booking: undefined, finding: undefined }
      : { booking, finding: undefined }
  } catch (error) {
    return { booking: undefined, finding: (error as Error).message }
  }
}

/**
 * Draws who a meeting is with, as its category asks: a one-to-one meeting its student and its
 * co-supervisors; any other its title and its participants; nothing before a category is chosen.
 */
function drawWho(
  form: HTMLFormElement,
  given: BookingDialogOptions,
  picked: Picked,
  update: () => void,
): void {
  const who = form.querySelector<HTMLElement>('.who')
  if (who === null) {
    return
  }
  const category = chosen(form, 'category', Category.all)
  const title =
    textOf(form, 'title') ||
    (meetingOf(given)?.student === undefined ? (meetingOf(given)?.title ?? '') : '')
  const isReadOnly = given.isReadOnly === true
  const finding = form.querySelector('.finding') as HTMLElement
  const common = {
    schedule: given.schedule,
    isReadOnly,
    onChange: update,
    onRefused: (reason: string) => {
      finding.textContent = reason
    },
  }
  if (category === undefined) {
    who.innerHTML = ''
    return
  }
  if (category.isOneToOne) {
    who.innerHTML = '<div class="student"></div><div class="others"></div>'
    drawPicker(who.querySelector('.student') as HTMLElement, {
      ...common,
      legend: 'Student',
      picked: picked.student,
      limit: 1,
      elsewhere: () => picked.participants,
    })
    drawPicker(who.querySelector('.others') as HTMLElement, {
      ...common,
      legend: 'Co-supervisors',
      picked: picked.participants,
      elsewhere: () => picked.student,
    })
    return
  }
  who.innerHTML = html`<label>Title <input name="title" value="${title}" autocomplete="off"></label>
    <div class="others"></div>`.text
  drawPicker(who.querySelector('.others') as HTMLElement, {
    ...common,
    legend: 'Participants',
    picked: picked.participants,
    elsewhere: () => [],
  })
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
  const meeting = meetingOf(given)
  const picked: Picked = {
    student: meeting?.student === undefined ? [] : [meeting.student],
    participants: [...(meeting?.participants ?? [])],
  }
  const update = (): Outcome => {
    const outcome = outcomeOf(form, given, picked)
    finding.textContent = outcome.finding ?? ''
    if (done !== null) {
      done.disabled = outcome.booking === undefined
    }
    return outcome
  }
  choose(form, given)
  drawWho(form, given, picked, update)
  form.addEventListener('input', update)
  form.addEventListener('change', (event) => {
    if ((event.target as Element).matches('select[name="category"]')) {
      drawWho(form, given, picked, update)
    }
    update()
  })
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const { booking } = update()
    if (booking !== undefined && given.isReadOnly !== true) {
      closeDialog(dialog)
      const newcomers =
        booking instanceof Meeting
          ? booking.everyone.filter(
              (participant) => !given.schedule.participants.includes(participant),
            )
          : []
      given.onDone(booking, newcomers)
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
  const first =
    given.isReadOnly === true
      ? '[data-action="cancel"]'
      : 'select[name="category"], input[name="title"]'
  form.querySelector<HTMLElement>(first)?.focus()
  return dialog
}
