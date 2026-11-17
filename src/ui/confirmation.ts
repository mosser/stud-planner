import { closeDialog, dialogOn, showDialog } from './dialog.ts'
import { html } from './html.ts'

/** Asks the Organizer a question; gives whether they confirm. Cancel and Escape do not. */
export function askToConfirm(page: Document, question: string, confirm: string): Promise<boolean> {
  const dialog = dialogOn(
    page,
    'confirmation',
    html`<form method="dialog">
      <p class="question">${question}</p>
      <div class="dialog-actions">
        <button type="button" data-answer="no">Cancel</button>
        <button type="submit" class="primary" data-answer="yes">${confirm}</button>
      </div>
    </form>`.text,
  )
  return new Promise((resolve) => {
    const answer = (isConfirmed: boolean) => {
      closeDialog(dialog)
      resolve(isConfirmed)
    }
    dialog.querySelector('form')?.addEventListener('submit', (event) => {
      event.preventDefault()
      answer(true)
    })
    dialog.querySelector('[data-answer="no"]')?.addEventListener('click', () => answer(false))
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault()
      answer(false)
    })
    showDialog(dialog)
    dialog.querySelector<HTMLButtonElement>('[data-answer="yes"]')?.focus()
  })
}
