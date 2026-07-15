import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Budgets from './pages/Budgets'
import Goals from './pages/Goals'
import Alerts from './pages/Alerts'
import Login from './pages/Login'
import { getAlerts } from './services/api'
import { currentMonth } from './utils'
import { useAuth } from './context/AuthContext'

const PAGES = {
  dashboard:    Dashboard,
  transactions: Transactions,
  budgets:      Budgets,
  goals:        Goals,
  alerts:       Alerts,
}

export default function App() {
  const { user, loading, logout } = useAuth()
  const [page, setPage]           = useState('dashboard')
  const [alertCount, setAlertCount] = useState(0)

  
  useEffect(() => {
    function handleUnauthorized() { logout() }
    window.addEventListener('fintrack:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('fintrack:unauthorized', handleUnauthorized)
  }, [logout])

  
  useEffect(() => {
    if (!user) return
    async function fetchAlerts() {
      try {
        const d = await getAlerts(currentMonth())
        setAlertCount(d.count)
      } catch {}
    }
    fetchAlerts()
  }, [page, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f1117] flex items-center justify-center transition-colors duration-200">
        <p className="text-slate-500 dark:text-slate-400 text-sm">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  const Page = PAGES[page] || Dashboard

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1117] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200">
      
      {/* Sidebar - Pure clean injection */}
      <Sidebar 
        page={page} 
        onNav={setPage} 
        alertCount={alertCount} 
        user={user} 
        onLogout={logout} 
      />

      {/* Main Content Viewport */}
      <main className="flex-1 pt-20 pb-6 px-4 md:pt-6 md:pb-6 md:px-6 md:ml-56 min-h-screen overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full">
          <Page />
        </div>
      </main>
    </div>
  )
}