import { useState } from "react"

export function inviteLink(token: string) {
  return `${window.location.origin}/invite/${token}`
}

/** Copies text and shows a tick for two seconds. */
export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  async function copy(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied((current) => (current === text ? null : current)), 2000)
  }
  return { copied, copy }
}
