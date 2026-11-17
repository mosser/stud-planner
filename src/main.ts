import './style.css'
import { save } from './io/save.ts'
import { openTheBrowserScheduleStore } from './io/schedule-store.ts'
import { sharedSchedules } from './io/shared-schedules.ts'
import { mountApplication } from './ui/application.ts'
import { faviconOf } from './ui/icon.ts'

const root = document.getElementById('app')
if (root === null) {
  throw new TypeError('The page has no element to mount the application on')
}
/** The icon of the browser's tab, in the colours of the palette (ADR 0010). */
const style = getComputedStyle(document.documentElement)
const icon = document.createElement('link')
icon.rel = 'icon'
icon.href = faviconOf({
  frame: style.getPropertyValue('--color-primary').trim(),
  weekA: style.getPropertyValue('--color-week-a').trim(),
  weekB: style.getPropertyValue('--color-week-b').trim(),
})
document.head.append(icon)

const store = await openTheBrowserScheduleStore()
mountApplication(root, {
  version: __VERSION__,
  restored: await store.restore(),
  store,
  save: (fileText, fileName) => save(fileText, fileName, document),
  sharedSchedules,
})
