import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useLicenseStore } from './store/useLicenseStore'
import Layout from './components/Layout'
import LicenseModal from './components/LicenseModal'
import Dashboard from './pages/Dashboard'
import Equipment from './pages/Equipment'
import Clients from './pages/Clients'
import Contracts from './pages/Contracts'
import Invoices from './pages/Invoices'
import Expenses from './pages/Expenses'
import About from './pages/About'
import Employees from './pages/Employees'
import Banks from './pages/Banks'
import Custody from './pages/Custody'
import Purchases from './pages/Purchases'
import Drivers from './pages/Drivers'
import Salaries from './pages/Salaries'
import Payroll from './pages/Payroll'
import Settings from './pages/Settings'
import Reports from './pages/Reports'
import CustomerStatement from './pages/CustomerStatement'

function App() {
  const { license, isLoading, checkLicense } = useLicenseStore()

  React.useEffect(() => {
    checkLicense()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  const isExpired = license && license.days_remaining <= 0

  return (
    <Router>
      {isExpired && <LicenseModal />}
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/banks" element={<Banks />} />
          <Route path="/custody" element={<Custody />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/salaries" element={<Salaries />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/customer-statement" element={<CustomerStatement />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
