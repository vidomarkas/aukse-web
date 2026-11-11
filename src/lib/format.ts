/** Formats money like the marketing site: `€1,840` for whole amounts, `€42.10` otherwise. */
export function formatMoney(amount: number, currency = "EUR", options: { whole?: boolean } = {}) {
  const isWhole = options.whole ?? Number.isInteger(Math.round(amount * 100) / 100)
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  }).format(amount)
}

/** "YYYY-MM" for the month containing `date` (local time). */
export function toMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function shiftMonth(key: string, delta: number) {
  const [year, month] = key.split("-").map(Number)
  return toMonthKey(new Date(year, month - 1 + delta, 1))
}

export function monthName(key: string, options: Intl.DateTimeFormatOptions = { month: "long" }) {
  const [year, month] = key.split("-").map(Number)
  return new Date(year, month - 1, 1).toLocaleString("en-GB", options)
}

/** Days left in the month, counting today. 0 for past months. */
export function daysLeftInMonth(key: string, today = new Date()) {
  if (key !== toMonthKey(today)) return 0
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  return lastDay - today.getDate() + 1
}

export function initials(name: string | null | undefined, fallback = "?") {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return fallback
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase()
}
