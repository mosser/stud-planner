import { type Markup, raw } from './html.ts'

/** The name of the system, as the masthead and the browser's tab show it. */
export const systemName = 'Supervision Planner'

/** The colours the icon is drawn with: its frame, week A's half and week B's half. */
export interface IconColours {
  readonly frame: string
  readonly weekA: string
  readonly weekB: string
}

/**
 * The drawing of the icon, in a 24 by 24 box: a calendar page whose page is cut along its
 * diagonal, week A upper left and week B lower right, as the overview cuts shared time, the cut
 * drawn in the colour of the frame so that the two halves stand apart.
 */
function drawing(frame: string, weekA: string, weekB: string): string {
  return [
    `<path d="M4 9h16L4 21z" ${weekA}/>`,
    `<path d="M20 9v12H4z" ${weekB}/>`,
    `<path d="M20 9L4 21" stroke-width="1.5" ${frame}/>`,
    `<rect x="3" y="4" width="18" height="17" rx="2" fill="none" stroke-width="2" ${frame}/>`,
    `<path d="M3 9h18" stroke-width="2" ${frame}/>`,
    `<path d="M8 2v4M16 2v4" stroke-width="2" stroke-linecap="round" ${frame}/>`,
  ].join('')
}

/** The icon in the masthead: its colours are the roles of `src/style.css` (ADR 0010). */
export function iconMarkup(): Markup {
  const svg = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${drawing(
    'class="icon-frame"',
    'class="icon-week-a"',
    'class="icon-week-b"',
  )}</svg>`
  return raw(svg)
}

/** The icon as a file for the browser's tab, in the colours given: an SVG `data:` address. */
export function faviconOf(colours: IconColours): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${drawing(
    `stroke="${colours.frame}"`,
    `fill="${colours.weekA}"`,
    `fill="${colours.weekB}"`,
  )}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** A tray, and an arrow into it or out of it, drawn in the colour of the text around. */
function trayIcon(arrow: string): Markup {
  return raw(
    `<svg class="action-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>${arrow}</svg>`,
  )
}

/** The icon of Download: an arrow down into a tray. */
export function downloadIcon(): Markup {
  return trayIcon('<path d="M12 4v11M7 10l5 5 5-5"/>')
}

/** The icon of Upload: an arrow up out of a tray. */
export function uploadIcon(): Markup {
  return trayIcon('<path d="M12 15V4M7 9l5-5 5 5"/>')
}

/** The icon of the lock: a padlock, closed while the schedule is locked, open otherwise. */
export function lockIcon(isLocked: boolean): Markup {
  const shackle = isLocked ? 'M8 11V7a4 4 0 0 1 8 0v4' : 'M8 11V7a4 4 0 0 1 7.5-1.9'
  return raw(
    `<svg class="action-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="${shackle}"/></svg>`,
  )
}

/** The icon of the participants: two people. */
export function participantsIcon(): Markup {
  return raw(
    `<svg class="action-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2.1.7 3.5 2.8 3.5 5.7"/></svg>`,
  )
}
