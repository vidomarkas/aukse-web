import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import DashboardPage from "./pages/dashboard/DashboardPage"
import TransactionsPage from "./pages/dashboard/TransactionsPage"
import CategoriesPage from "./pages/dashboard/CategoriesPage"
import BudgetsPage from "./pages/dashboard/BudgetsPage"



export default function App() {
  return (
    <BrowserRouter>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />

        </Routes>
      </SignedIn>
    </BrowserRouter>
  )
}