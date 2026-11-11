/** A white section card with a small label above a title, matching the month chart. */
export default function DashboardCard({
  label,
  title,
  action,
  className = "",
  children,
}: {
  label?: string
  title: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={`bg-white border border-line rounded-3xl p-5 md:p-7 min-w-0 ${className}`}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          {label && <p className="text-[13px] font-medium text-stone mb-1">{label}</p>}
          <h2 className="font-display text-xl font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
