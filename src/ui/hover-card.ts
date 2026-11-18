/** How long the pointer rests on a booking before its description shows, in milliseconds. */
export const restingTime = 300

/** The space between a booking and its description, in pixels. */
const gap = 4

/** What the description of the bookings answers to: hiding it, when the grid is drawn again. */
export interface HoverCard {
  /** Hides the description shown, and forgets the one about to show. */
  readonly hide: () => void
}

/**
 * Where the description of a booking goes: under it, or above it when there is no room under;
 * within the window, left to right.
 */
function place(card: HTMLElement, booking: Element, page: Document): void {
  const box = booking.getBoundingClientRect()
  const width = page.defaultView?.innerWidth ?? 0
  const height = page.defaultView?.innerHeight ?? 0
  const below = box.bottom + gap
  const fitsBelow = below + card.offsetHeight <= height
  const top = fitsBelow ? below : Math.max(box.top - gap - card.offsetHeight, 0)
  const left = Math.max(Math.min(box.left, width - card.offsetWidth - gap), gap)
  card.style.top = `${top}px`
  card.style.left = `${left}px`
}

/**
 * Shows the description of the booking the pointer rests on, in a card beside it: its title,
 * cadence, weekday, time and participants, as a screen reader names it. It shows in every browser,
 * which a `title` tooltip does not; never during a press or a drag, nor for a touch; and goes when
 * the pointer leaves the booking or presses, on Escape, on a scroll, and when the grid is drawn
 * again.
 */
export function attachHoverCard(root: HTMLElement, page: Document): HoverCard {
  const card = page.createElement('div')
  card.className = 'hover-card'
  card.hidden = true
  card.setAttribute('aria-hidden', 'true')
  page.body.append(card)
  let shown: Element | undefined
  let timer: ReturnType<typeof setTimeout> | undefined

  const hide = (): void => {
    clearTimeout(timer)
    timer = undefined
    shown = undefined
    card.hidden = true
  }

  const show = (booking: Element): void => {
    if (!booking.isConnected) {
      hide()
      return
    }
    card.textContent = booking.getAttribute('aria-label') ?? ''
    card.hidden = false
    place(card, booking, page)
  }

  root.addEventListener('pointerover', (event) => {
    const booking = (event.target as Element).closest('.booking[data-booking]')
    if (booking === shown) {
      return
    }
    hide()
    if (booking === null || event.pointerType === 'touch' || event.buttons !== 0) {
      return
    }
    shown = booking
    timer = setTimeout(() => show(booking), restingTime)
  })
  root.addEventListener('pointerout', (event) => {
    const into = event.relatedTarget as Node | null
    if (shown !== undefined && (into === null || !shown.contains(into))) {
      hide()
    }
  })
  root.addEventListener('pointerdown', hide, { capture: true })
  page.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hide()
    }
  })
  page.addEventListener('scroll', hide, { capture: true, passive: true })
  return { hide }
}
