/** Shows a dialog as modal, or open where the browser has no modal dialogs. */
export function showDialog(dialog: HTMLDialogElement): void {
  if (typeof dialog.showModal === 'function') {
    try {
      dialog.showModal()
      return
    } catch {
      // A dialog not attached, or a browser that refuses: it is shown open instead.
    }
  }
  dialog.setAttribute('open', '')
}

/** Closes a dialog and takes it off the page. */
export function closeDialog(dialog: HTMLDialogElement): void {
  if (typeof dialog.close === 'function') {
    dialog.close()
  }
  dialog.remove()
}

/** Creates a dialog on the page, from markup the system built. */
export function dialogOn(page: Document, className: string, markup: string): HTMLDialogElement {
  const dialog = page.createElement('dialog')
  dialog.className = className
  dialog.innerHTML = markup
  page.body.append(dialog)
  return dialog
}
