import { Link, useLocation } from "react-router-dom"
import { UserButton, useUser } from "@clerk/clerk-react"

const nav = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Transactions", href: "/transactions" },
  { label: "Categories", href: "/categories" },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const { user } = useUser()

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-56 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-900">
            <img src="/aukse-logo.svg" alt="aukse" className="h-8" />
          </h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t flex items-center gap-2">
          <UserButton />
          <span className="text-sm text-gray-600">{user?.firstName ?? user?.emailAddresses[0].emailAddress}</span>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}