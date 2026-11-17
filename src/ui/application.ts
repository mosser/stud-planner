import { html } from './html.ts'

/** What the page needs from its surroundings to be mounted. */
export interface ApplicationContext {
  /** The version of the system, shown in the footer of every screen. */
  readonly version: string
}

/** The page: a masthead, the screen in use, and a footer naming the version. */
export function mountApplication(root: HTMLElement, context: ApplicationContext): void {
  root.innerHTML = html`
    <header class="masthead"><h1>Stud Planner</h1></header>
    <main class="screen"></main>
    <footer class="site-footer">stud-planner v${context.version}</footer>
  `.text
}
