import type { PaginatedResponse } from "../../types"

export default function Pagination({
  meta,
  onPage,
}: {
  meta: PaginatedResponse<unknown>["meta"]
  onPage: (page: number) => void
}) {
  if (meta.totalPages <= 1) return null
  const button =
    "rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-cream disabled:opacity-40 disabled:pointer-events-none"
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-stone">
      <span>
        Page {meta.page} of {meta.totalPages} · {meta.total} transactions
      </span>
      <div className="flex gap-2">
        <button className={button} onClick={() => onPage(Math.max(1, meta.page - 1))} disabled={meta.page === 1}>
          Previous
        </button>
        <button className={button} onClick={() => onPage(Math.min(meta.totalPages, meta.page + 1))} disabled={meta.page === meta.totalPages}>
          Next
        </button>
      </div>
    </div>
  )
}
