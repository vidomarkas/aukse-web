import { Fragment, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { Loader2, Repeat } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import type { Category, Transaction } from "../../types"
import { formatMoney, monthName } from "../../lib/format"

const TYPE_BADGE: Record<Transaction["type"], string> = {
  expense: "bg-coral-soft text-[#712b13]",
  income: "bg-sage text-[#27500a]",
  transfer: "bg-plum-soft text-plum",
}

/** "YYYY-MM" of a transaction. Dates are stored as plain dates (midnight UTC). */
function monthOf(tx: Transaction) {
  return tx.date.slice(0, 7)
}

function day(tx: Transaction) {
  return new Date(tx.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
}

function CategoryLink({ tx }: { tx: Transaction }) {
  if (!tx.category) return <span className="text-stone">No category</span>
  return (
    <Link
      to={`/categories/${tx.category.id}`}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 -mx-1 text-ink hover:bg-cream transition-colors"
      title={`All ${tx.category.name} transactions`}
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tx.category.color ?? "#9a9893" }} />
      <span className="truncate">{tx.category.name}</span>
    </Link>
  )
}

/** Income transactions get income categories, expenses get expense categories, transfers any. */
function categoriesFor(tx: Transaction, categories: Category[]) {
  const fitting = tx.type === "transfer" ? categories : categories.filter((c) => c.isIncome === (tx.type === "income"))
  // Keep the current category selectable even if it doesn't fit the type.
  return tx.category && !fitting.some((c) => c.id === tx.category!.id) ? [tx.category, ...fitting] : fitting
}

/** A chevron next to the category that changes it straight from the list. */
function CategoryPicker({
  tx,
  categories,
  saving,
  onChange,
}: {
  tx: Transaction
  categories: Category[]
  saving: boolean
  onChange: (categoryId: string) => void
}) {
  if (saving) return <Loader2 size={14} className="animate-spin text-stone shrink-0" aria-label="Saving category" />
  return (
    <Select value={tx.categoryId ?? ""} onValueChange={onChange}>
      <SelectTrigger
        aria-label={`Change category of ${tx.description?.trim() || "this transaction"}`}
        title="Change category"
        className="h-7 w-7 shrink-0 justify-center rounded-full border-0 p-0 shadow-none opacity-60 group-hover:opacity-100 hover:bg-cream focus-visible:opacity-100"
      />
      <SelectContent position="popper" align="start" className="max-h-72">
        {categoriesFor(tx, categories).map((c) => (
          <SelectItem key={c.id} value={c.id}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color ?? "#9a9893" }} />
            {c.icon && <span>{c.icon}</span>}
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Transactions, newest first, with a header row each time a new month starts.
 * `renderMonthSummary` returns the totals shown on each month header.
 */
export default function TransactionTable({
  transactions,
  renderMonthSummary,
  onEdit,
  onDelete,
  deleting,
  showCategory = true,
  categories,
  onChangeCategory,
  savingCategoryFor,
  onMakeRecurring,
}: {
  transactions: Transaction[]
  renderMonthSummary?: (month: string) => ReactNode
  onEdit: (tx: Transaction) => void
  onDelete: (tx: Transaction) => void
  deleting?: boolean
  showCategory?: boolean
  /** With these, each row gets a picker to change its category in place. */
  categories?: Category[]
  onChangeCategory?: (tx: Transaction, categoryId: string) => void
  savingCategoryFor?: string | null
  /** Adds a "Make recurring" action to transactions that aren't recurring yet. */
  onMakeRecurring?: (tx: Transaction) => void
}) {
  const picker = (tx: Transaction) =>
    categories && onChangeCategory ? (
      <CategoryPicker
        tx={tx}
        categories={categories}
        saving={savingCategoryFor === tx.id}
        onChange={(id) => onChangeCategory(tx, id)}
      />
    ) : null

  const columns = showCategory ? 5 : 4

  return (
    <div className="bg-white border border-line rounded-3xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[12px] font-medium text-stone border-b border-line">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Description</th>
              {showCategory && <th className="hidden sm:table-cell px-5 py-3 font-medium">Category</th>}
              <th className="px-5 py-3 font-medium text-right">Amount</th>
              <th className="px-5 py-3 font-medium text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, i) => {
              const startsMonth = i === 0 || monthOf(transactions[i - 1]) !== monthOf(tx)
              return (
                <Fragment key={tx.id}>
                  {startsMonth && (
                    <tr className="bg-cream">
                      <td colSpan={columns} className={`px-5 py-3 ${i > 0 ? "border-t-2 border-line" : ""}`}>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <span className="font-display text-lg font-semibold tracking-[-0.01em] text-ink">
                            {monthName(monthOf(tx), { month: "long", year: "numeric" })}
                          </span>
                          {renderMonthSummary?.(monthOf(tx))}
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr className={`group hover:bg-cream/60 ${startsMonth ? "" : "border-t border-line"}`}>
                    <td className="px-5 py-3 text-stone whitespace-nowrap tabular-nums">{day(tx)}</td>
                    <td className="px-5 py-3 max-w-[220px]">
                      <span className="flex items-center gap-1.5 text-ink min-w-0">
                        <span className="truncate">{tx.description?.trim() || "—"}</span>
                        {tx.recurringId && (
                          <Link to="/recurring" title="Recurring payment" aria-label="Recurring payment" className="shrink-0 text-gold hover:text-ink">
                            <Repeat size={13} strokeWidth={2.25} />
                          </Link>
                        )}
                      </span>
                      <span className="block text-xs text-stone truncate">
                        {tx.user?.name ?? tx.user?.email}
                        {tx.type !== "expense" && (
                          <span className={`ml-1.5 inline-block rounded-full px-1.5 py-px text-[11px] font-medium ${TYPE_BADGE[tx.type]}`}>
                            {tx.type === "income" ? "Income" : "Transfer"}
                          </span>
                        )}
                      </span>
                      {/* On phones the category column is hidden, so the link goes here. */}
                      {showCategory && (
                        <span className="sm:hidden flex items-center gap-1 text-xs mt-1">
                          <CategoryLink tx={tx} />
                          {picker(tx)}
                        </span>
                      )}
                    </td>
                    {showCategory && (
                      <td className="hidden sm:table-cell px-5 py-3 max-w-[220px]">
                        <div className="flex items-center gap-1 min-w-0">
                          <CategoryLink tx={tx} />
                          {picker(tx)}
                        </div>
                      </td>
                    )}
                    <td
                      className={`px-5 py-3 text-right font-medium whitespace-nowrap tabular-nums ${
                        tx.type === "income" ? "text-[#4f7a45]" : "text-ink"
                      }`}
                    >
                      {tx.type === "income" ? "+" : tx.type === "expense" ? "−" : ""}
                      {formatMoney(Number(tx.amount), tx.currency, { whole: false })}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      {onMakeRecurring && !tx.recurringId && (
                        <button
                          onClick={() => onMakeRecurring(tx)}
                          title="Make recurring"
                          aria-label={`Make ${tx.description?.trim() || "this transaction"} recurring`}
                          className="inline-flex align-middle mr-3 text-stone opacity-60 group-hover:opacity-100 hover:text-ink focus-visible:opacity-100"
                        >
                          <Repeat size={14} />
                        </button>
                      )}
                      <button onClick={() => onEdit(tx)} className="text-xs font-medium text-stone hover:text-ink mr-3">
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(tx)}
                        disabled={deleting}
                        className="text-xs font-medium text-stone hover:text-[#b54a22]"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                </Fragment>
              )
            })}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={columns} className="px-5 py-10 text-center text-stone">
                  No transactions yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
