// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mountApplication } from './application.ts'

describe('the application', () => {
  it('names its version in the footer', () => {
    const root = document.createElement('div')
    mountApplication(root, { version: '1.2.3' })
    expect(root.querySelector('.site-footer')?.textContent).toBe('stud-planner v1.2.3')
  })

  it('has a masthead and a screen to show', () => {
    const root = document.createElement('div')
    mountApplication(root, { version: '1.2.3' })
    expect(root.querySelector('.masthead h1')?.textContent).toBe('Stud Planner')
    expect(root.querySelector('main.screen')).not.toBeNull()
  })
})
