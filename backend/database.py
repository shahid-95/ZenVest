"""
FinTrack - SQLite Database Layer
All data stored in fintrack.db (auto-created on first run).
No installation needed — Python ships with SQLite.

Every transaction / budget / goal row belongs to a user (user_id),
so each account only ever sees its own data.
"""

import sqlite3
from datetime import datetime
from contextlib import contextmanager

DB_PATH = "fintrack.db"


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # rows behave like dicts
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    """Create tables if they don't exist. Safe to call multiple times."""
    with get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                username      TEXT NOT NULL UNIQUE,
                email         TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at    TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS transactions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                type        TEXT NOT NULL CHECK(type IN ('income','expense')),
                category    TEXT NOT NULL,
                amount      REAL NOT NULL,
                description TEXT NOT NULL,
                date        TEXT NOT NULL,
                created_at  TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS budgets (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                category TEXT NOT NULL,
                month    TEXT NOT NULL,
                "limit"  REAL NOT NULL,
                UNIQUE(user_id, category, month)
            );

            CREATE TABLE IF NOT EXISTS goals (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name      TEXT NOT NULL,
                target    REAL NOT NULL,
                saved     REAL NOT NULL DEFAULT 0,
                deadline  TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );
        """)
        _migrate_legacy_schema(conn)


def _migrate_legacy_schema(conn):
    """
    If this DB was created before auth existed, transactions/budgets/goals
    won't have a user_id column. Add it (nullable) so old rows don't crash
    queries; they simply won't show up for any account until reassigned.
    """
    for table in ("transactions", "budgets", "goals"):
        cols = [r["name"] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()]
        if "user_id" not in cols:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN user_id INTEGER")


# ── Users ─────────────────────────────────────────────────

def create_user(username: str, email: str, password_hash: str):
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?,?,?)",
            (username, email, password_hash),
        )
        user_id = cur.lastrowid
        # New accounts start empty — no demo data. (Seeding every signup with the
        # same fake transactions made different accounts look like they were
        # sharing data, even though each row is correctly scoped to user_id.)
        return {"id": user_id, "username": username, "email": email}


def get_user_by_username(username: str):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
        return _row_to_dict(row)


def get_user_by_email(email: str):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        return _row_to_dict(row)


def get_user_by_id(user_id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
        return _row_to_dict(row)


# ── Transactions ───────────────────────────────────────────

def _row_to_dict(row):
    return dict(row) if row else None

def get_transactions(user_id: int, month=None, type=None):
    with get_conn() as conn:
        query = "SELECT * FROM transactions WHERE user_id = ?"
        params = [user_id]
        if month:
            query += " AND strftime('%Y-%m', date) = ?"
            params.append(month)
        if type:
            query += " AND type = ?"
            params.append(type)
        query += " ORDER BY date DESC, id DESC"
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

def add_transaction(user_id: int, data: dict):
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO transactions (user_id, type, category, amount, description, date) "
            "VALUES (:user_id,:type,:category,:amount,:description,:date)",
            {**data, "user_id": user_id}
        )
        return {**data, "id": cur.lastrowid}

def update_transaction(user_id: int, tx_id: int, data: dict):
    if not data:
        return None
    fields = ", ".join(f"{k}=?" for k in data)
    values = list(data.values()) + [tx_id, user_id]
    with get_conn() as conn:
        conn.execute(f"UPDATE transactions SET {fields} WHERE id=? AND user_id=?", values)
        row = conn.execute(
            "SELECT * FROM transactions WHERE id=? AND user_id=?", (tx_id, user_id)
        ).fetchone()
        return _row_to_dict(row)

def delete_transaction(user_id: int, tx_id: int):
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM transactions WHERE id=? AND user_id=?", (tx_id, user_id))
        return cur.rowcount > 0


# ── Summary ────────────────────────────────────────────────

def get_summary(user_id: int, month=None):
    with get_conn() as conn:
        where = "WHERE user_id = ?"
        params = [user_id]
        if month:
            where += " AND strftime('%Y-%m', date) = ?"
            params.append(month)

        row = conn.execute(f"""
            SELECT
                COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS expenses
            FROM transactions {where}
        """, params).fetchone()

        income = row["income"]
        expenses = row["expenses"]
        return {
            "income": income,
            "expenses": expenses,
            "balance": income - expenses,
            "savings_rate": round((income - expenses) / income * 100, 1) if income > 0 else 0,
        }


# ── Analytics ──────────────────────────────────────────────

def get_monthly_analytics(user_id: int):
    """Last 6 months income vs expense for bar/line chart."""
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT
                strftime('%Y-%m', date) AS month,
                COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS expenses
            FROM transactions
            WHERE user_id = ?
            GROUP BY month
            ORDER BY month DESC
            LIMIT 6
        """, (user_id,)).fetchall()
        # Reverse so oldest → newest (for chart left to right)
        return [dict(r) for r in reversed(rows)]

def get_category_breakdown(user_id: int, month=None):
    """Expense by category for pie chart."""
    with get_conn() as conn:
        where = "WHERE type='expense' AND user_id = ?"
        params = [user_id]
        if month:
            where += " AND strftime('%Y-%m', date) = ?"
            params.append(month)
        rows = conn.execute(f"""
            SELECT category, SUM(amount) AS total
            FROM transactions {where}
            GROUP BY category
            ORDER BY total DESC
        """, params).fetchall()
        return [dict(r) for r in rows]


# ── Budgets ────────────────────────────────────────────────

def get_budgets(user_id: int, month=None):
    if not month:
        month = datetime.now().strftime("%Y-%m")
    with get_conn() as conn:
        budgets = conn.execute(
            'SELECT * FROM budgets WHERE user_id=? AND month=? ORDER BY category', (user_id, month)
        ).fetchall()
        result = []
        for b in budgets:
            b = dict(b)
            spent = conn.execute("""
                SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
                WHERE user_id=? AND type='expense' AND category=?
                AND strftime('%Y-%m', date)=?
            """, (user_id, b["category"], month)).fetchone()["total"]
            b["spent"] = spent
            b["remaining"] = b["limit"] - spent
            b["percentage"] = round(spent / b["limit"] * 100, 1) if b["limit"] > 0 else 0
            result.append(b)
        return result

def add_budget(user_id: int, data: dict):
    with get_conn() as conn:
        cur = conn.execute(
            'INSERT OR REPLACE INTO budgets (user_id, category, month, "limit") '
            'VALUES (:user_id,:category,:month,:limit)',
            {**data, "user_id": user_id}
        )
        return {**data, "id": cur.lastrowid, "spent": 0, "remaining": data["limit"], "percentage": 0}

def update_budget(user_id: int, budget_id: int, data: dict):
    with get_conn() as conn:
        conn.execute(
            'UPDATE budgets SET "limit"=? WHERE id=? AND user_id=?',
            (data["limit"], budget_id, user_id)
        )
        row = conn.execute(
            "SELECT * FROM budgets WHERE id=? AND user_id=?", (budget_id, user_id)
        ).fetchone()
        return _row_to_dict(row)

def delete_budget(user_id: int, budget_id: int):
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM budgets WHERE id=? AND user_id=?", (budget_id, user_id))
        return cur.rowcount > 0


# ── Goals ─────────────────────────────────────────────────

def get_goals(user_id: int):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM goals WHERE user_id=? ORDER BY created_at DESC", (user_id,)
        ).fetchall()
        result = []
        for r in rows:
            g = dict(r)
            g["percentage"] = round(g["saved"] / g["target"] * 100, 1) if g["target"] > 0 else 0
            result.append(g)
        return result

def add_goal(user_id: int, data: dict):
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO goals (user_id, name, target, saved, deadline) "
            "VALUES (:user_id,:name,:target,:saved,:deadline)",
            {**data, "user_id": user_id}
        )
        return {**data, "id": cur.lastrowid, "percentage": 0}

def update_goal(user_id: int, goal_id: int, data: dict):
    if not data:
        return None
    fields = ", ".join(f"{k}=?" for k in data)
    values = list(data.values()) + [goal_id, user_id]
    with get_conn() as conn:
        conn.execute(f"UPDATE goals SET {fields} WHERE id=? AND user_id=?", values)
        row = conn.execute(
            "SELECT * FROM goals WHERE id=? AND user_id=?", (goal_id, user_id)
        ).fetchone()
        g = _row_to_dict(row)
        if g:
            g["percentage"] = round(g["saved"] / g["target"] * 100, 1) if g["target"] > 0 else 0
        return g

def delete_goal(user_id: int, goal_id: int):
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM goals WHERE id=? AND user_id=?", (goal_id, user_id))
        return cur.rowcount > 0


# ── Alerts ────────────────────────────────────────────────

def get_budget_alerts(user_id: int, month=None):
    budgets = get_budgets(user_id, month)
    alerts = []
    for b in budgets:
        if b["percentage"] >= 100:
            alerts.append({
                "type": "danger",
                "category": b["category"],
                "message": f"Budget exceeded! Spent ₹{b['spent']:,.0f} of ₹{b['limit']:,.0f}",
                "percentage": b["percentage"],
            })
        elif b["percentage"] >= 80:
            alerts.append({
                "type": "warning",
                "category": b["category"],
                "message": f"Approaching limit — {b['percentage']}% used (₹{b['remaining']:,.0f} left)",
                "percentage": b["percentage"],
            })
    return {"alerts": alerts, "count": len(alerts)}
