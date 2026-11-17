import { Cadence, type Parity } from '../domain/cadence.ts'
import { theDay } from '../domain/day.ts'
import {
  fileRefused,
  notKept,
  overlap,
  removalQuestion,
  replacementQuestion,
  setAside,
} from '../domain/findings.ts'
import type { Meeting } from '../domain/meeting.ts'
import type { Schedule } from '../domain/schedule.ts'
import { readScheduleFile, scheduleFileName, scheduleFileOf } from '../io/schedule-file.ts'
import type { Restored, ScheduleStore } from '../io/schedule-store.ts'
import { askToConfirm } from './confirmation.ts'
import {
  cadenceOffered,
  cadencesAddedIn,
  meetingMoved,
  meetingResized,
  type Slot,
  type Span,
  spanDragged,
  spanPressed,
  type Tab,
  tabs,
} from './gestures.ts'
import { cadenceClass, gridOf, rowsOf, slotAt } from './grid.ts'
import { html } from './html.ts'
import { openMeetingDialog } from './meeting-dialog.ts'

/** What the page needs from its surroundings to be mounted. */
export interface ApplicationContext {
  /** The version of the system, shown in the footer. */
  readonly version: string
  /** The schedule the browser gave back when the page opened. */
  readonly restored: Restored
  /** Where every change of the schedule is kept (ADR 0006). */
  readonly store: Pick<ScheduleStore, 'isKept' | 'keep'>
  /** Hands the text of a file to the browser, to be saved under its name (ADR 0007). */
  readonly save: (fileText: string, fileName: string) => void
  /** Asks the Organizer to confirm; by default, in a dialog of the page. */
  readonly ask?: ((question: string, confirm: string) => Promise<boolean>) | undefined
}

/** The page once mounted: what it shows, for the tests. */
export interface Application {
  readonly schedule: Schedule
  readonly tab: Tab
}

const tabNames: Record<Tab, string> = { odd: 'Odd week', even: 'Even week', overview: 'Overview' }

/** A drag in progress on the grid; it has moved once the pointer left the slot pressed. */
type Drag =
  | {
      readonly kind: 'add'
      readonly pressed: Slot
      readonly parity: Parity
      span: Span
      hasMoved: boolean
    }
  | {
      readonly kind: 'move' | 'resize'
      readonly pressed: Slot
      readonly meeting: Meeting
      readonly heldAt: number
      candidate: Meeting
      hasMoved: boolean
    }

function isSameSlot(one: Slot, other: Slot): boolean {
  return one.weekday === other.weekday && one.quarter === other.quarter
}

/** The page: a masthead, the tabs and their grid, and a footer naming the version. */
export function mountApplication(root: HTMLElement, context: ApplicationContext): Application {
  const page = root.ownerDocument
  const ask = context.ask ?? ((question, confirm) => askToConfirm(page, question, confirm))
  let schedule = context.restored.schedule
  let tab: Tab = 'odd'
  let isKept = context.store.isKept
  const isSetAside = context.restored.wasSetAside
  let refusal: string | undefined

  function notices() {
    const kept = isKept ? '' : html`<p class="notice" data-notice="not-kept">${notKept()}</p>`
    const aside = isSetAside
      ? html`<p class="notice" data-notice="set-aside">${setAside()}</p>`
      : ''
    const refused =
      refusal === undefined ? '' : html`<p class="notice refusal" role="alert">${refusal}</p>`
    return html`${kept}${aside}${refused}`
  }

  function render(): void {
    root.innerHTML = html`
      <header class="masthead"><h1>Stud Planner</h1></header>
      <main class="screen">
        ${notices()}
        <div class="toolbar">
          <div class="tabs" role="tablist">${tabs.map(
            (each) =>
              html`<button type="button" role="tab" data-tab="${each}"
                aria-selected="${each === tab ? 'true' : 'false'}">${tabNames[each]}</button>`,
          )}</div>
          <div class="actions">
            <button type="button" data-action="save">Save</button>
            <button type="button" data-action="load">Load</button>
            <input type="file" accept=".json,application/json" data-file hidden>
          </div>
        </div>
        <div class="grid" role="tabpanel" aria-label="${tabNames[tab]}">${gridOf(schedule, tab)}</div>
      </main>
      <footer class="site-footer">stud-planner v${context.version}</footer>
    `.text
  }

  /** Takes a changed schedule: kept at once, shown, and the last refusal forgotten. */
  function change(changed: Schedule): void {
    schedule = changed
    refusal = undefined
    render()
    void context.store.keep(changed).then((wasKept) => {
      if (!wasKept && isKept) {
        isKept = false
        render()
      }
    })
  }

  function refuse(reason: string): void {
    refusal = reason
    render()
  }

  function meetingOfRank(rank: string | undefined): Meeting | undefined {
    return schedule.meetings[Number(rank)]
  }

  /** Opens the dialog of a meeting added from the week of that parity: it is held in it. */
  function openNew(span: Span, parity: Parity): void {
    openMeetingDialog(page, {
      schedule,
      proposal: { ...span, cadence: Cadence.biWeekly(parity) },
      cadences: cadencesAddedIn(parity),
      onDone: (meeting) => change(schedule.afterAdding(meeting)),
    })
  }

  function openExisting(meeting: Meeting): void {
    openMeetingDialog(page, {
      schedule,
      meeting,
      proposal: { ...meeting, cadence: meeting.cadence },
      onDone: (changed) => change(schedule.afterReplacing(meeting, changed)),
      onRemove: (removed) => void remove(removed),
    })
  }

  async function remove(meeting: Meeting): Promise<void> {
    if (await ask(removalQuestion(meeting), 'Remove')) {
      change(schedule.afterRemoving(meeting))
    }
  }

  async function load(file: File): Promise<void> {
    const read = readScheduleFile(await file.text())
    if (read.isRefused) {
      refuse(fileRefused(file.name, read.reason))
      return
    }
    const question = replacementQuestion(schedule.meetings.length, file.name)
    if (schedule.isEmpty || (await ask(question, 'Replace'))) {
      change(read.schedule)
    }
  }

  root.addEventListener('click', (event) => {
    const target = event.target as Element
    const tabPressed = target.closest<HTMLElement>('[data-tab]')
    if (tabPressed !== null && tabs.includes(tabPressed.dataset.tab as Tab)) {
      tab = tabPressed.dataset.tab as Tab
      render()
      return
    }
    const removed = meetingOfRank(target.closest<HTMLElement>('[data-remove]')?.dataset.remove)
    if (removed !== undefined) {
      void remove(removed)
      return
    }
    const action = target.closest<HTMLElement>('[data-action]')?.dataset.action
    if (action === 'save') context.save(scheduleFileOf(schedule), scheduleFileName)
    if (action === 'load') root.querySelector<HTMLInputElement>('[data-file]')?.click()
  })

  root.addEventListener('change', (event) => {
    const input = event.target as HTMLInputElement
    const file = input.matches('[data-file]') ? input.files?.[0] : undefined
    if (file !== undefined) {
      input.value = ''
      void load(file)
    }
  })

  root.addEventListener('keydown', (event) => {
    const target = event.target as Element
    const meeting = meetingOfRank(target.closest<HTMLElement>('[data-meeting]')?.dataset.meeting)
    if (meeting === undefined || target.closest('[data-remove]') !== null) {
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openExisting(meeting)
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      void remove(meeting)
    }
  })

  attachDrags()

  /** Adding, moving and resizing a meeting by dragging on the grid (ADR 0004). */
  function attachDrags(): void {
    let drag: Drag | undefined

    const grid = () => root.querySelector('.grid') as Element
    const preview = () => root.querySelector<HTMLElement>('.preview')

    function show(weekdayKey: string, rows: string, classes: string): void {
      preview()?.remove()
      const column = root.querySelector(`.day[data-weekday="${weekdayKey}"]`)
      const element = page.createElement('div')
      element.className = `preview ${classes}`
      element.style.gridRow = rows
      column?.append(element)
    }

    function showDrag(current: Drag): void {
      if (current.kind === 'add') {
        const { span } = current
        show(span.weekday.key, rowsOf(span), current.parity.key)
        return
      }
      const isRefused = schedule.overlapOf(current.candidate, current.meeting) !== undefined
      show(
        current.candidate.weekday.key,
        rowsOf(current.candidate),
        `${cadenceClass(current.meeting)}${isRefused ? ' refused' : ''}`,
      )
    }

    function end(): void {
      drag = undefined
      preview()?.remove()
      root.querySelector('.dragging')?.classList.remove('dragging')
      page.removeEventListener('pointermove', onMove)
      page.removeEventListener('pointerup', onUp)
      page.removeEventListener('keydown', onEscape)
    }

    function onMove(event: PointerEvent): void {
      const slot = slotAt(grid(), event.clientX, event.clientY)
      if (drag === undefined || slot === undefined) {
        return
      }
      if (drag.kind === 'add') {
        drag.span = spanDragged(schedule, Cadence.biWeekly(drag.parity), drag.pressed, slot.quarter)
      } else if (drag.kind === 'move') {
        drag.candidate = meetingMoved(drag.meeting, drag.heldAt, slot)
      } else {
        drag.candidate = meetingResized(drag.meeting, slot)
      }
      drag.hasMoved ||= !isSameSlot(slot, drag.pressed)
      showDrag(drag)
    }

    function onUp(event: PointerEvent): void {
      onMove(event)
      const finished = drag
      end()
      if (finished === undefined) {
        return
      }
      if (finished.kind === 'add') {
        const span = finished.hasMoved
          ? finished.span
          : spanPressed(schedule, Cadence.biWeekly(finished.parity), finished.pressed)
        openNew(span, finished.parity)
        return
      }
      if (!finished.hasMoved && finished.kind === 'move') {
        openExisting(finished.meeting)
        return
      }
      apply(finished.meeting, finished.candidate)
    }

    function apply(meeting: Meeting, candidate: Meeting): void {
      const isUnchanged =
        candidate.weekday === meeting.weekday &&
        candidate.start.equals(meeting.start) &&
        candidate.duration.equals(meeting.duration)
      if (isUnchanged) {
        return
      }
      const other = schedule.overlapOf(candidate, meeting)
      if (other !== undefined) {
        refuse(overlap(candidate, other))
        return
      }
      change(schedule.afterReplacing(meeting, candidate))
    }

    function onEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        end()
      }
    }

    function begin(started: Drag, held?: Element): void {
      drag = started
      held?.classList.add('dragging')
      page.addEventListener('pointermove', onMove)
      page.addEventListener('pointerup', onUp)
      page.addEventListener('keydown', onEscape)
      if (started.kind === 'add') {
        showDrag(started)
      }
    }

    root.addEventListener('pointerdown', (event) => {
      const target = event.target as Element
      const slot = slotAt(grid(), event.clientX, event.clientY)
      if (event.button !== 0 || slot === undefined || target.closest('.day') === null) {
        return
      }
      if (target.closest('[data-remove]') !== null) {
        return
      }
      event.preventDefault()
      const resized = meetingOfRank(target.closest<HTMLElement>('[data-resize]')?.dataset.resize)
      const held = target.closest<HTMLElement>('[data-meeting]')
      const moved = meetingOfRank(held?.dataset.meeting)
      if (resized !== undefined) {
        const resize = { pressed: slot, meeting: resized, heldAt: 0, candidate: resized }
        begin({ kind: 'resize', ...resize, hasMoved: false })
        return
      }
      if (moved !== undefined) {
        const heldAt = slot.quarter - theDay.quarterAt(moved.start)
        const move = { pressed: slot, meeting: moved, heldAt, candidate: moved }
        begin({ kind: 'move', ...move, hasMoved: false }, held ?? undefined)
        return
      }
      const parity = cadenceOffered(schedule, tab, slot)?.parity
      if (parity !== undefined) {
        const span = spanDragged(schedule, Cadence.biWeekly(parity), slot, slot.quarter)
        begin({ kind: 'add', pressed: slot, parity, span, hasMoved: false })
      }
    })
  }

  render()
  return {
    get schedule() {
      return schedule
    },
    get tab() {
      return tab
    },
  }
}
