import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import Layout from "../../components/Layout"
import CreateHousehold from "../../components/CreateHousehold"
import TransactionTable from "../../components/transactions/TransactionTable"
import TransactionFormDialog from "../../components/transactions/TransactionFormDialog"
import Pagination from "../../components/transactions/Pagination"
import Notice from "../../components/transactions/Notice"
import RecurringFormDialog from "../../components/recurring/RecurringFormDialog"
import { useCategories } from "../../hooks/useCategories"
import { useRecategorize } from "../../hooks/useRecategorize"
import { useHouseholds, useActiveHouseholdData } from "../../hooks/useHousehold"
import { useCategoryHistory, useDeleteTransaction, useTransactions, type CategoryHistory } from "../../hooks/useTransactions"
import { formatMoney, monthName, toMonthKey } from "../../lib/format"
import type { Transaction } from "../../types"

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-line rounded-2xl px-4 py-3">
      <p className="text-[12px] text-stone">{label}</p>
      <p className="font-display text-xl font-semibold tabular-nums text-ink">{value}</p>
    </div>
  )
}

/** The category's total for one month, on that month's header in the list. */
function CategoryMonthTotal({ history, month }: { history?: CategoryHistory; month: string }) {
  const entry = history?.months.find((m) => m.month === month)
  if (!entry) return null
  return (
    <span className="text-[13px] text-stone tabular-nums">
      <span className="text-ink font-medium">{formatMoney(entry.total, "EUR", { whole: false })}</span> · {entry.count}{" "}
      {entry.count === 1 ? "transaction" : "transactions"}
    </span>
  )
}

/** Every transaction in one category, newest first, with monthly totals. Reached by clicking a category. */
export default function CategoryTransactionsPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  // Start at page 1 again when moving to another category's page.
  const [paging, setPaging] = useState({ categoryId, page: 1 })
  const page = paging.categoryId === categoryId ? paging.page : 1
  const setPage = (next: number) => setPaging({ categoryId, page: next })
  const { isLoading: householdLoading } = useHouseholds()
  const household = useActiveHouseholdData()
  const { data: history, isError } = useCategoryHistory(household?.id, categoryId)
  const { data, isLoading } = useTransactions(household?.id, page, 20, { categoryId })
  const deleteTransaction = useDeleteTransaction()
  const { data: categories } = useCategories(household?.id)
  const recategorize = useRecategorize(categories)
  const [dialog, setDialog] = useState<{ editing: Transaction | null } | null>(null)
  const [makeRecurring, setMakeRecurring] = useState<Transaction | null>(null)

  async function handleDelete(tx: Transaction) {
    if (!confirm("Delete this transaction?")) return
    await deleteTransaction.mutateAsync(tx.id)
  }

  if (householdLoading) return <Layout><p className="text-stone">Loading…</p></Layout>
  if (!household) return <Layout><CreateHousehold /></Layout>

  const category = history?.category
  const months = history?.months ?? []
  const thisMonth = months.find((m) => m.month === toMonthKey())?.total ?? 0
  const allTime = months.reduce((sum, m) => sum + m.total, 0)
  const average = months.length ? allTime / months.length : 0

  return (
    <Layout>
      <Link to="/transactions" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone hover:text-ink mb-6">
        <ArrowLeft size={15} /> All transactions
      </Link>

      {isError ? (
        <p className="text-stone">This category doesn't exist in {household.name}.</p>
      ) : (
        <>
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <p className="flex items-center gap-2 text-[13px] font-medium text-stone mb-3">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: category?.color ?? "#9a9893" }} />
                {category?.isIncome ? "Income category" : "Category"}
              </p>
              <h1 className="font-display text-5xl md:text-6xl font-semibold leading-[0.95] tracking-[-0.035em] text-ink">
                {category?.icon && <span className="mr-3">{category.icon}</span>}
                {category?.name ?? "…"}
              </h1>
            </div>
            <button
              onClick={() => setDialog({ editing: null })}
              className="self-start md:self-auto shrink-0 bg-ink text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-ink-soft transition-colors"
            >
              Add to {category?.name ?? "category"}
            </button>
          </header>

          {months.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Stat label={monthName(toMonthKey(), { month: "long" })} value={formatMoney(thisMonth, "EUR", { whole: true })} />
              <Stat label="Monthly average" value={formatMoney(average, "EUR", { whole: true })} />
              <Stat label="All time" value={formatMoney(allTime, "EUR", { whole: true })} />
              <Stat label="Transactions" value={String(data?.meta.total ?? months.reduce((n, m) => n + m.count, 0))} />
            </div>
          )}

          {isLoading ? (
            <p className="text-stone">Loading transactions…</p>
          ) : (
            <>
              <TransactionTable
                transactions={data?.data ?? []}
                renderMonthSummary={(month) => <CategoryMonthTotal history={history} month={month} />}
                onEdit={(tx) => setDialog({ editing: tx })}
                onDelete={handleDelete}
                deleting={deleteTransaction.isPending}
                categories={categories}
                onChangeCategory={recategorize.change}
                savingCategoryFor={recategorize.savingId}
                onMakeRecurring={setMakeRecurring}
              />
              {data && <Pagination meta={data.meta} onPage={setPage} />}
            </>
          )}
        </>
      )}

      <Notice notice={recategorize.notice} />

      {makeRecurring && (
        <RecurringFormDialog
          key={makeRecurring.id}
          open
          onOpenChange={(open) => !open && setMakeRecurring(null)}
          householdId={household.id}
          fromTransaction={makeRecurring}
        />
      )}

      {dialog && (
        <TransactionFormDialog
          key={dialog.editing?.id ?? "new"}
          open
          onOpenChange={(open) => !open && setDialog(null)}
          householdId={household.id}
          editing={dialog.editing}
          defaultCategoryId={categoryId}
        />
      )}
    </Layout>
  )
}
