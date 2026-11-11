import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import DashboardPage from "./pages/dashboard/DashboardPage"
import TransactionsPage from "./pages/dashboard/TransactionsPage"
import CategoriesPage from "./pages/dashboard/CategoriesPage"
import BudgetsPage from "./pages/dashboard/BudgetsPage"
import SettingsPage from "./pages/dashboard/SettingsPage"
import RecurringPage from "./pages/dashboard/RecurringPage"
import CategoryTransactionsPage from "./pages/dashboard/CategoryTransactionsPage"
import AcceptInvitePage from "./pages/AcceptInvitePage"
import { HouseholdProvider } from "./context/HouseholdContext"



export default function App() {
  return (
    <HouseholdProvider>
      <BrowserRouter>
        <Routes>
          {/* Public-ish route — invite preview works without sign-in */}
          <Route path="/invite/:token" element={<AcceptInvitePage />} />

          {/* All other routes require sign-in */}
          <Route
            path="*"
            element={
              <>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
                <SignedIn>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/transactions" element={<TransactionsPage />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/categories/:categoryId" element={<CategoryTransactionsPage />} />
                    <Route path="/budgets" element={<BudgetsPage />} />
                    <Route path="/recurring" element={<RecurringPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                </SignedIn>
              </>
            }
          />
        </Routes>
      </BrowserRouter>
    </HouseholdProvider>
  )
}
