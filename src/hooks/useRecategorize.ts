import { useRef, useState } from "react"
import { useUpdateTransaction } from "./useTransactions"
import type { Category, Transaction } from "../types"

/**
 * Changes a transaction's category in one step, from the list. Keeps a short confirmation
 * ("Moved Lidl to Food & Drink"), because on a category's page the row disappears once moved.
 */
export function useRecategorize(categories: Category[] | undefined) {
  const updateTransaction = useUpdateTransaction()
  const [savingId, setSavingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  function show(text: string, error = false) {
    clearTimeout(timer.current)
    setNotice({ text, error })
    timer.current = setTimeout(() => setNotice(null), 4000)
  }

  async function change(tx: Transaction, categoryId: string) {
    if (categoryId === tx.categoryId) return
    const name = categories?.find((c) => c.id === categoryId)?.name ?? "the new category"
    const what = tx.description?.trim() || "Transaction"
    setSavingId(tx.id)
    try {
      // Only the category is sent; the API leaves everything else as it is.
      await updateTransaction.mutateAsync({ id: tx.id, categoryId })
      show(`Moved "${what}" to ${name}`)
    } catch {
      show(`Couldn't change the category of "${what}". Please try again.`, true)
    } finally {
      setSavingId(null)
    }
  }

  return { change, savingId, notice }
}
