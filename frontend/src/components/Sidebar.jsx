import React, { useState, useEffect } from 'react'
import { LayoutDashboard, ArrowLeftRight, Target, Flag, Bell, LogOut, Sun, Moon, Menu, X } from 'lucide-react'

const NAV = [
  { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'budgets',      label: 'Budgets',      icon: Target },
  { id: 'goals',        label: 'Goals',        icon: Flag }, 
  { id: 'alerts',       label: 'Alerts',       icon: Bell },
]

export default function Sidebar({ page, onNav, alertCount = 0, user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Local standalone theme state controller
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })

  // Dynamic Class Trigger
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  const handleNavClick = (id) => {
    onNav(id)
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-white dark:bg-[#141820] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-50 transition-colors duration-200">
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <span className="font-bold text-slate-900 dark:text-white text-lg">
            ZEN<span className="text-indigo-600 dark:text-indigo-400">VEST</span>
          </span>
        </div>
        
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Main Sidebar Layout */}
      <aside className={`
        fixed left-0 top-0 h-full w-56 bg-white dark:bg-[#141820] border-r border-slate-200 dark:border-slate-800 flex flex-col z-40 transition-all duration-300
        md:translate-x-0 ${isOpen ? 'translate-x-0 pt-16 md:pt-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        <div className="hidden md:block px-5 py-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="font-display font-bold text-slate-900 dark:text-white text-xl">
              ZEN<span className="text-indigo-600 dark:text-indigo-400">VEST</span>
            </span>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Personal Finance</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = page === id
            return (
              <button
                key={id}
                onClick={() => handleNavClick(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                  active
                    ? 'bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 dark:border-indigo-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={17} />
                {label}
                {id === 'alerts' && alertCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {alertCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          
          {/* Theme Mode Toggle Button (FAILSAFE & INDEPENDENT) */}
          <button
            onClick={() => setDark(!dark)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <div className="flex items-center gap-3">
              {dark ? <Sun size={17} className="text-amber-500" /> : <Moon size={17} className="text-slate-600" />}
              <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${dark ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 ${dark ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>

          {/* User Details & Logout */}
          {user && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/50">
              <div className="flex items-center gap-2 px-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600/10 dark:bg-indigo-600/20 border border-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold shrink-0">
                  {user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </div>
                <span className="text-slate-700 dark:text-slate-300 text-sm truncate font-medium">
                  {user.name || user.username || user.email}
                </span>
              </div>
              
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}