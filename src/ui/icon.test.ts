// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { downloadIcon, faviconOf, iconMarkup, systemName, uploadIcon } from './icon.ts'

describe('the icon', () => {
  it('is drawn in the masthead with the classes of the palette roles', () => {
    const element = document.createElement('div')
    element.innerHTML = iconMarkup().text
    const svg = element.querySelector('svg.icon')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.querySelectorAll('.icon-frame')).toHaveLength(4)
    expect(svg?.querySelector('.icon-week-a')).not.toBeNull()
    expect(svg?.querySelector('.icon-week-b')).not.toBeNull()
  })

  it('is given to the tab of the browser in the colours given', () => {
    const address = faviconOf({ frame: 'maroon', weekA: 'blue', weekB: 'gold' })
    expect(address.startsWith('data:image/svg+xml,')).toBe(true)
    const svg = decodeURIComponent(address.slice('data:image/svg+xml,'.length))
    expect(svg).toContain('stroke="maroon"')
    expect(svg).toContain('fill="blue"')
    expect(svg).toContain('fill="gold"')
  })

  it('of Download points down into a tray, that of Upload up out of it', () => {
    expect(downloadIcon().text).toContain('M7 10l5 5 5-5')
    expect(uploadIcon().text).toContain('M7 9l5-5 5 5')
    expect(uploadIcon().text).toContain('stroke="currentColor"')
  })

  it('stands beside the name of the system', () => {
    expect(systemName).toBe('Supervision Planner')
  })
})
