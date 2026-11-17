// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { save } from './save.ts'

describe('saving a file', () => {
  it('hands its text to the browser under its name, as JSON', async () => {
    const created = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:schedule')
    const revoked = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const clicked = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    save('{}', 'stud-planner-schedule.json', document)
    const blob = created.mock.calls[0]?.[0] as Blob
    expect(blob.type).toBe('application/json')
    expect(await blob.text()).toBe('{}')
    const link = clicked.mock.contexts[0] as HTMLAnchorElement
    expect(link.download).toBe('stud-planner-schedule.json')
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(revoked).toHaveBeenCalledWith('blob:schedule')
  })
})
