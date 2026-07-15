/** Format number as Indian Rupee string: 55000 → ₹55,000 */
export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Current month as "YYYY-MM" */
export function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

/** "2025-06" → "June 2025" */
export function formatMonth(ym) {
  if (!ym) return ''
  const [y, m] = ym.split('-')
  return new Date(y, m - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
}

/** "2025-06-15" → "15 Jun 2025" */
export function formatDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

/** Pie/bar chart colour palette */
export const CHART_COLORS = [
  '#6366f1', '#22d3ee', '#f59e0b', '#10b981',
  '#f43f5e', '#a78bfa', '#34d399', '#fb923c',
  '#38bdf8', '#e879f9',
]

/** Category → emoji */
export const CATEGORY_ICONS = {
  Food: '🍔',
  Transport: '🚗',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Health: '💊',
  Utilities: '💡',
  Education: '📚',
  Salary: '💼',
  Freelance: '💻',
  Investment: '📈',
  Rent: '🏠',
  Other: '📦',
}

export const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Entertainment', 'Shopping',
  'Health', 'Utilities', 'Education', 'Rent', 'Other',
]

export const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Investment', 'Business', 'Other',
]
