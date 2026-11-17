import './style.css'
import { mountApplication } from './ui/application.ts'

const root = document.getElementById('app')
if (root === null) {
  throw new TypeError('The page has no element to mount the application on')
}
mountApplication(root, { version: __VERSION__ })
