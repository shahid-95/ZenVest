import React, { useState } from 'react'
import { Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Field, Input, Btn } from '../components/UI'

export default function Login() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login') 
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(username.trim(), password)
      } else {
        await register(username.trim(), email.trim(), password)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1117] flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-100 dark:border-indigo-500/30 flex items-center justify-center mb-3 shadow-sm">
            <Wallet className="text-indigo-600 dark:text-indigo-400" size={26} />
          </div>
          <span className="font-display font-bold text-slate-900 dark:text-white text-2xl">
            ZEN<span className="text-indigo-600 dark:text-indigo-400">VEST</span>
          </span>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Personal Finance</p>
        </div>

        {/* Auth Card */}
        <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md">
          {/* Tabs */}
          <div className="flex mb-6 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => { setMode('login'); setError('') }}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                mode === 'login' 
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError('') }}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                mode === 'register' 
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Username" className="text-slate-700 dark:text-slate-300">
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourname"
                autoComplete="username"
                required
                minLength={3}
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20"
              />
            </Field>

            {mode === 'register' && (
              <Field label="Email" className="text-slate-700 dark:text-slate-300">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                />
              </Field>
            )}

            <Field label="Password" className="text-slate-700 dark:text-slate-300">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20"
              />
            </Field>

            {error && (
              <p className="text-red-700 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Btn type="submit" className="w-full justify-center py-2.5" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
            </Btn>
          </form>
        </div>

        {/* Mode Toggle Link */}
        <p className="text-slate-500 dark:text-slate-400 text-xs text-center mt-6">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}