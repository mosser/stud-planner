import './style.css'
import { save } from './io/save.ts'
import { openTheBrowserScheduleStore } from './io/schedule-store.ts'
import { mountApplication } from './ui/application.ts'

const root = document.getElementById('app')
if (root === null) {
  throw new TypeError('The page has no element to mount the application on')
}
const store = await openTheBrowserScheduleStore()
mountApplication(root, {
  version: __VERSION__,
  restored: await store.restore(),
  store,
  save: (fileText, fileName) => save(fileText, fileName, document),
})
