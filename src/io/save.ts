/**
 * Hands the text of a file to the browser, which writes it on the Organizer's computer under the
 * file name given. Nothing crosses a network (ADR 0007).
 */
export function save(fileText: string, fileName: string, page: globalThis.Document): void {
  const blob = new Blob([fileText], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = page.createElement('a')
  link.href = url
  // The HTML attribute that makes a link save its target under a name (ADR 0007).
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
