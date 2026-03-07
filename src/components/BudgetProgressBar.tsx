type Props = {
  name: string
  icon?: string
  color?: string
  spent: number
  limit: number
  currency: string
  period: string
}

export default function BudgetProgressBar({ name, icon, color, spent, limit, currency, period }: Props) {
  const percentage = Math.min(Math.round((spent / limit) * 100), 100)
  const remaining = limit - spent
  const isOverBudget = spent > limit

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {icon && <span>{icon}</span>}
          <span className="font-medium text-gray-900">{name}</span>
          <span className="text-xs text-gray-400">{period}</span>
        </div>
        <span className={`text-xs font-medium ${isOverBudget ? "text-red-600" : "text-gray-500"}`}>
          {spent.toFixed(2)} / {limit.toFixed(2)} {currency}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isOverBudget ? "bg-red-500" : percentage > 80 ? "bg-amber-400" : "bg-green-500"
          }`}
          style={{ width: `${percentage}%`, backgroundColor: !isOverBudget && percentage <= 80 ? color : undefined }}
        />
      </div>
      <p className="text-xs text-gray-400">
        {isOverBudget
          ? `${Math.abs(remaining).toFixed(2)} ${currency} over budget`
          : `${remaining.toFixed(2)} ${currency} remaining`}
      </p>
    </div>
  )
}