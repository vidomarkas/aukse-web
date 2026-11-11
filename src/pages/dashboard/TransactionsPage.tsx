import { useState } from "react"
import Layout from "../../components/Layout"
import CreateHousehold from "../../components/CreateHousehold"
import TransactionTable from "../../components/transactions/TransactionTable"
import TransactionFormDialog from "../../components/transactions/TransactionFormDialog"
import Pagination from "../../components/transactions/Pagination"
import Notice from "../../components/transactions/Notice"
import { useCategories } from "../../hooks/useCategories"
import { useRecategorize } from "../../hooks/useRecategorize"
import { useHouseholds, useActiveHouseholdData } from "../../hooks/useHousehold"
import { useCurrentMonthStats, useDeleteTransaction, useTransactions } from "../../hooks/useTransactions"
import { formatMoney } from "../../lib/format"
import type { Transaction } from "../../types"

/** Totals on each month header: what was spent and earned in that month (all pages, not just this one). */
function MonthTotals({ householdId, month }: { householdId: string; month: string }) {
  const { data } = useCurrentMonthStats(householdId, month)
  if (!data) return null
  return (
    <span className="text-[13px] text-stone tabular-nums">
      <span className="text-ink font-medium">{formatMoney(data.spent, "EUR", { whole: false })}</span> spent
      {data.income > 0 && (
        <>
          {" · "}
          <span className="text-[#4f7a45] font-medium">{formatMoney(data.income, "EUR", { whole: false })}</span> in
        </>
      )}
    </span>
  )
}

export default function TransactionsPage() {
  const [page, setPage] = useState(1)
  const { isLoading: householdLoading } = useHouseholds()
  const household = useActiveHouseholdData()
  const { data, isLoading } = useTransactions(household?.id, page)
  const deleteTransaction = useDeleteTransaction()
  const { data: categories } = useCategories(household?.id)
  const recategorize = useRecategorize(categories)
  const [dialog, setDialog] = useState<{ editing: Transaction | null } | null>(null)

  async function handleDelete(tx: Transaction) {
    if (!confirm("Delete this transaction?")) return
    await deleteTransaction.mutateAsync(tx.id)
  }

  if (householdLoading) return <Layout><p className="text-stone">Loading…</p></Layout>
  if (!household) return <Layout><CreateHousehold /></Layout>

  return (
    <Layout>
      <header className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="flex items-center gap-2 text-[13px] font-medium text-stone mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            {household.name}
          </p>
          <h1 className="font-display text-5xl md:text-6xl font-semibold leading-[0.95] tracking-[-0.035em] text-ink">Transactions</h1>
        </div>
        <button
          onClick={() => setDialog({ editing: null })}
          className="shrink-0 bg-ink text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-ink-soft transition-colors"
        >
          Add transaction
        </button>
      </header>

      {isLoading ? (
        <p className="text-stone">Loading transactions…</p>
      ) : (
        <>
          <TransactionTable
            transactions={data?.data ?? []}
            renderMonthSummary={(month) => <MonthTotals householdId={household.id} month={month} />}
            onEdit={(tx) => setDialog({ editing: tx })}
            onDelete={handleDelete}
            deleting={deleteTransaction.isPending}
            categories={categories}
            onChangeCategory={recategorize.change}
            savingCategoryFor={recategorize.savingId}
          />
          {data && <Pagination meta={data.meta} onPage={setPage} />}
        </>
      )}

      <Notice notice={recategorize.notice} />

      {dialog && (
        <TransactionFormDialog
          key={dialog.editing?.id ?? "new"}
          open
          onOpenChange={(open) => !open && setDialog(null)}
          householdId={household.id}
          editing={dialog.editing}
        />
      )}
    </Layout>
  )
}
