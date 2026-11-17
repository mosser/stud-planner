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
 * The drawing of the icon, in a 24 by 24 box: a calendar page whose square is cut along its
 * diagonal, week A upper left and week B lower right, as the overview cuts shared time.
 */
function drawing(frame: string, weekA: string, weekB: string): string {
  return [
    `<rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke-width="2" ${frame}/>`,
    `<path d="M8 3v4M16 3v4" stroke-width="2" stroke-linecap="round" ${frame}/>`,
    `<path d="M7 10h10L7 18z" ${weekA}/>`,
    `<path d="M17 10v8H7z" ${weekB}/>`,
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
