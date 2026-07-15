/** ZenVest API service — all fetch() calls in one place */

const BASE = '/api'
const TOKEN_KEY = 'fintrack_token'

// Fired when a request comes back 401 (expired/invalid token) so the app
// can drop back to the login screen. App-level code can listen for this.
function handleUnauthorized() {
  localStorage.removeItem(TOKEN_KEY)
  window.dispatchEvent(new Event('fintrack:unauthorized'))
}

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    handleUnauthorized()
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────
export const login = (username, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })

export const register = (username, email, password) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) })

export const getMe = () => request('/auth/me')

// ── Transactions ──────────────────────────────────────────
export const getTransactions = (month, type) => {
  const q = new URLSearchParams()
  if (month) q.set('month', month)
  if (type) q.set('type', type)
  return request(`/transactions?${q}`)
}
export const addTransaction    = (data) => request('/transactions', { method: 'POST', body: JSON.stringify(data) })
export const updateTransaction = (id, data) => request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteTransaction = (id) => request(`/transactions/${id}`, { method: 'DELETE' })

// ── Summary & Analytics ───────────────────────────────────
export const getSummary           = (month) => request(`/summary${month ? `?month=${month}` : ''}`)
export const getMonthlyAnalytics  = ()      => request('/analytics/monthly')
export const getCategoryBreakdown = (month) => request(`/analytics/categories${month ? `?month=${month}` : ''}`)

// ── Budgets ───────────────────────────────────────────────
export const getBudgets    = (month) => request(`/budgets${month ? `?month=${month}` : ''}`)
export const addBudget     = (data)  => request('/budgets', { method: 'POST', body: JSON.stringify(data) })
export const updateBudget  = (id, data) => request(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteBudget  = (id)    => request(`/budgets/${id}`, { method: 'DELETE' })

// ── Goals ─────────────────────────────────────────────────
export const getGoals    = ()       => request('/goals')
export const addGoal     = (data)   => request('/goals', { method: 'POST', body: JSON.stringify(data) })
export const updateGoal  = (id, data) => request(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteGoal  = (id)     => request(`/goals/${id}`, { method: 'DELETE' })

// ── Alerts ────────────────────────────────────────────────
export const getAlerts = (month) => request(`/alerts${month ? `?month=${month}` : ''}`)
