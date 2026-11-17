import { Cadence } from '../domain/cadence.ts'
import { theDay } from '../domain/day.ts'
import { Duration } from '../domain/duration.ts'
import { cadenceChoice, durationWritten, overlap } from '../domain/findings.ts'
import { Meeting } from '../domain/meeting.ts'
import type { Schedule } from '../domain/schedule.ts'
import { Weekday } from '../domain/weekday.ts'
import { closeDialog, dialogOn, showDialog } from './dialog.ts'
import type { Span } from './gestures.ts'
import { html, type Markup } from './html.ts'

/** What the meeting dialog opens with: a meeting of the schedule, or where a new one goes. */
export interface MeetingDialogOptions {
  readonly schedule: Schedule
  /** The meeting changed; absent for a new meeting. */
  readonly meeting?: Meeting | undefined
  /** Where a new meeting goes, and the cadence offered. */
  readonly proposal: Span & { readonly cadence: Cadence }
  /** The cadences the meeting may have; every cadence when absent. */
  readonly cadences?: readonly Cadence[] | undefined
  /** Called with the meeting as Done leaves it: never one that overlaps another. */
  readonly onDone: (meeting: Meeting) => void
  /** Called when the Organizer asks to remove the meeting changed. */
  readonly onRemove?: (meeting: Meeting) => void
}

/** What the fields of the dialog make: a meeting, or why they make none. */
type Outcome =
  | { readonly meeting: Meeting; readonly finding: undefined }
  | { readonly meeting: undefined; readonly finding: string | undefined }

/** A title that stands in while the Organizer has typed none, to check everything else. */
const standInTitle = 'Meeting'

/** The cadences the dialog offers. */
function cadencesOf(given: MeetingDialogOptions): readonly Cadence[] {
  return given.cadences ?? Cadence.all
}

/** The options of a list, each valued by its rank; which is chosen is set by `choose`. */
function options<T>(values: readonly T[], label: (value: T) => string): Markup {
  return html`${values.map((value, rank) => html`<option value="${rank}">${label(value)}</option>`)}`
}

const durations = Array.from({ length: theDay.quarterCount }, (_unused, rank) =>
  Duration.ofQuarters(rank + 1),
)

function markupOf(given: MeetingDialogOptions): Markup {
  const { meeting } = given
  return html`<form method="dialog">
    <h2>${meeting === undefined ? 'New meeting' : meeting.title}</h2>
    <label>Title <input name="title" value="${meeting?.title ?? ''}" autocomplete="off"></label>
    <label>Cadence <select name="cadence">${options(cadencesOf(given), cadenceChoice)}</select></label>
    <label>Weekday <select name="weekday">${options(Weekday.all, (weekday) => weekday.name)}</select></label>
    <label>Start <select name="start">${options(theDay.quarters, String)}</select></label>
    <label>Duration <select name="duration">${options(durations, durationWritten)}</select></label>
    <label>Note <textarea name="note" rows="2">${meeting?.note ?? ''}</textarea></label>
    <p class="finding" role="alert"></p>
    <div class="dialog-actions">
      ${meeting === undefined ? '' : html`<button type="button" class="danger" data-action="remove">Remove</button>`}
      <button type="button" data-action="cancel">Cancel</button>
      <button type="submit" class="primary" data-action="done">Done</button>
    </div>
  </form>`
}

/** Chooses in each list of the dialog what the meeting, or the new one, has. */
function choose(form: HTMLFormElement, given: MeetingDialogOptions): void {
  const shown = given.meeting ?? given.proposal
  const ranks: Record<string, number> = {
    cadence: cadencesOf(given).indexOf(shown.cadence),
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
}

function chosen<T>(form: HTMLFormElement, name: string, values: readonly T[]): T | undefined {
  const field = form.elements.namedItem(name) as HTMLSelectElement | null
  return values[Number(field?.value)]
}

function textOf(form: HTMLFormElement, name: string): string {
  const field = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null
  return field?.value ?? ''
}

/**
 * What the fields make: the meeting, unless it has no title, breaks a rule of a meeting, or
 * overlaps another meeting of the schedule, which the finding then says.
 */
function outcomeOf(form: HTMLFormElement, given: MeetingDialogOptions): Outcome {
  const title = textOf(form, 'title')
  const cadence = chosen(form, 'cadence', cadencesOf(given))
  const weekday = chosen(form, 'weekday', Weekday.all)
  const start = chosen(form, 'start', theDay.quarters)
  const duration = chosen(form, 'duration', durations)
  if (cadence === undefined || weekday === undefined || start === undefined || !duration) {
    return { meeting: undefined, finding: undefined }
  }
  const description = { cadence, weekday, start, duration, note: textOf(form, 'note') }
  let candidate: Meeting
  try {
    candidate = new Meeting({ ...description, title: title.trim() || standInTitle })
  } catch (error) {
    return { meeting: undefined, finding: (error as Error).message }
  }
  const other = given.schedule.overlapOf(candidate, given.meeting)
  if (other !== undefined) {
    return { meeting: undefined, finding: overlap(candidate, other) }
  }
  if (title.trim() === '') {
    return { meeting: undefined, finding: undefined }
  }
  return { meeting: candidate, finding: undefined }
}

/**
 * Opens the meeting dialog on the page. Done is refused while the fields make no meeting, and the
 * dialog says why; Cancel, Escape or a click outside the dialog change nothing.
 */
export function openMeetingDialog(page: Document, given: MeetingDialogOptions): HTMLDialogElement {
  const dialog = dialogOn(page, 'meeting-dialog', markupOf(given).text)
  const form = dialog.querySelector('form') as HTMLFormElement
  const finding = dialog.querySelector('.finding') as HTMLElement
  const done = dialog.querySelector('[data-action="done"]') as HTMLButtonElement
  const update = (): Outcome => {
    const outcome = outcomeOf(form, given)
    finding.textContent = outcome.finding ?? ''
    done.disabled = outcome.meeting === undefined
    return outcome
  }
  choose(form, given)
  form.addEventListener('input', update)
  form.addEventListener('change', update)
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const { meeting } = update()
    if (meeting !== undefined) {
      closeDialog(dialog)
      given.onDone(meeting)
    }
  })
  dialog
    .querySelector('[data-action="cancel"]')
    ?.addEventListener('click', () => closeDialog(dialog))
  dialog.querySelector('[data-action="remove"]')?.addEventListener('click', () => {
    closeDialog(dialog)
    if (given.meeting !== undefined) {
      given.onRemove?.(given.meeting)
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
  update()
  showDialog(dialog)
  form.querySelector<HTMLInputElement>('input[name="title"]')?.focus()
  return dialog
}
