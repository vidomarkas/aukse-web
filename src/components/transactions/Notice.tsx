/** A short message at the bottom of the screen, e.g. after moving a transaction to another category. */
export default function Notice({ notice }: { notice: { text: string; error?: boolean } | null }) {
  if (!notice) return null
  return (
    <div
      role="status"
      className={`fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-40 max-w-[90vw] truncate rounded-full px-5 py-2.5 text-sm font-medium shadow-lg ${
        notice.error ? "bg-[#d4532b] text-white" : "bg-ink text-white"
      }`}
    >
      {notice.text}
    </div>
  )
}
