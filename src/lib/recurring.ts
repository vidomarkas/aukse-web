import type { Frequency } from "../types"

const UNIT: Record<Frequency, [string, string]> = {
  daily: ["day", "days"],
  weekly: ["week", "weeks"],
  monthly: ["month", "months"],
  yearly: ["year", "years"],
}

function ordinal(n: number) {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"
  return `${n}${suffix}`
}

/** "Every month on the 5th", "Every 2 weeks on Monday", "Every year on 5 Nov", "Every day". */
export function describeSchedule(frequency: Frequency, interval: number, startDate: string) {
  const start = new Date(`${startDate.slice(0, 10)}T00:00:00Z`)
  const every = interval === 1 ? `Every ${UNIT[frequency][0]}` : `Every ${interval} ${UNIT[frequency][1]}`
  switch (frequency) {
    case "daily":
      return every
    case "weekly":
      return `${every} on ${start.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" })}`
    case "monthly":
      return start.getUTCDate() >= 29
        ? `${every} on the ${ordinal(start.getUTCDate())} (or the last day)`
        : `${every} on the ${ordinal(start.getUTCDate())}`
    case "yearly":
      return `${every} on ${start.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}`
  }
}

/** "Today", "Tomorrow", "in 5 days", or "Mon 2 Dec" further out; past dates read "2 days ago". */
export function relativeDay(date: string, today = new Date()) {
  const target = Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10))
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const days = Math.round((target - now) / 86_400_000)
  if (days === 0) return "Today"
  if (days === 1) return "Tomorrow"
  if (days === -1) return "Yesterday"
  if (days < 0) return `${-days} days ago`
  if (days < 7) return `in ${days} days`
  return new Date(target).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
}
