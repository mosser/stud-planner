// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { attachHoverCard, restingTime } from './hover-card.ts'

let root: HTMLElement

function booking(rank: number, label: string): HTMLElement {
  const element = document.createElement('div')
  element.className = 'booking'
  element.dataset.booking = String(rank)
  element.setAttribute('aria-label', label)
  element.innerHTML = '<span class="booking-title">Lab</span>'
  root.append(element)
  return element
}

function over(target: Element, given: { pointerType?: string; buttons?: number } = {}): void {
  target.dispatchEvent(
    new PointerEvent('pointerover', {
      bubbles: true,
      pointerType: given.pointerType ?? 'mouse',
      buttons: given.buttons ?? 0,
    }),
  )
}

function out(target: Element, into: Element | null): void {
  target.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, relatedTarget: into }))
}

const card = () => document.querySelector<HTMLElement>('.hover-card') as HTMLElement
const shownText = () => (card().hidden ? undefined : card().textContent)

beforeEach(() => {
  vi.useFakeTimers()
  root = document.createElement('div')
  document.body.append(root)
})

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('the description of a booking on hover', () => {
  it('shows once the pointer rests on the booking, as a screen reader names it', () => {
    attachHoverCard(root, document)
    const lab = booking(0, 'Lab meeting, tentative, weekly, Monday 10:00 to 11:00')
    over(lab.querySelector('.booking-title') as Element)
    expect(shownText()).toBeUndefined()
    vi.advanceTimersByTime(restingTime)
    expect(shownText()).toBe('Lab meeting, tentative, weekly, Monday 10:00 to 11:00')
    expect(card().getAttribute('aria-hidden')).toBe('true')
  })

  it('stays while the pointer moves within the booking, and goes when it leaves', () => {
    attachHoverCard(root, document)
    const lab = booking(0, 'Lab meeting')
    const title = lab.querySelector('.booking-title') as Element
    over(lab)
    vi.advanceTimersByTime(restingTime)
    out(lab, title)
    over(title)
    expect(shownText()).toBe('Lab meeting')
    out(title, root)
    expect(shownText()).toBeUndefined()
  })

  it('moves to the next booking the pointer rests on', () => {
    attachHoverCard(root, document)
    const lab = booking(0, 'Lab meeting')
    const ana = booking(1, 'Ana')
    over(lab)
    vi.advanceTimersByTime(restingTime)
    over(ana)
    expect(shownText()).toBeUndefined()
    vi.advanceTimersByTime(restingTime)
    expect(shownText()).toBe('Ana')
  })

  it('does not show for a touch, during a press, or once the pointer has left', () => {
    attachHoverCard(root, document)
    const lab = booking(0, 'Lab meeting')
    over(lab, { pointerType: 'touch' })
    over(lab, { buttons: 1 })
    vi.advanceTimersByTime(restingTime)
    expect(shownText()).toBeUndefined()
    over(lab)
    out(lab, null)
    vi.advanceTimersByTime(restingTime)
    expect(shownText()).toBeUndefined()
  })

  it('goes on a press, on Escape, on a scroll, and when the grid is drawn again', () => {
    const { hide } = attachHoverCard(root, document)
    const lab = booking(0, 'Lab meeting')
    const showIt = () => {
      over(root)
      over(lab)
      vi.advanceTimersByTime(restingTime)
      expect(shownText()).toBe('Lab meeting')
    }
    showIt()
    lab.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(shownText()).toBeUndefined()
    showIt()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(shownText()).toBeUndefined()
    showIt()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    expect(shownText()).toBe('Lab meeting')
    document.dispatchEvent(new Event('scroll'))
    expect(shownText()).toBeUndefined()
    showIt()
    hide()
    expect(shownText()).toBeUndefined()
  })

  it('does not show for a booking drawn over before it does', () => {
    attachHoverCard(root, document)
    const lab = booking(0, 'Lab meeting')
    over(lab)
    lab.remove()
    vi.advanceTimersByTime(restingTime)
    expect(shownText()).toBeUndefined()
  })

  it('is placed under the booking, or above it when there is no room under', () => {
    attachHoverCard(root, document)
    const lab = booking(0, 'Lab meeting')
    const at = (top: number, bottom: number) =>
      vi
        .spyOn(lab, 'getBoundingClientRect')
        .mockReturnValue({ top, bottom, left: 40, right: 140 } as DOMRect)
    vi.spyOn(card(), 'offsetHeight', 'get').mockReturnValue(30)
    at(100, 160)
    over(lab)
    vi.advanceTimersByTime(restingTime)
    expect([card().style.top, card().style.left]).toEqual(['164px', '40px'])
    out(lab, null)
    at(window.innerHeight - 20, window.innerHeight - 2)
    over(lab)
    vi.advanceTimersByTime(restingTime)
    expect(card().style.top).toBe(`${window.innerHeight - 54}px`)
  })
})
