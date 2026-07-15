"""
ZenVest Backend - FastAPI + SQLite
Auth: JWT bearer tokens, PBKDF2 password hashing (stdlib only).
Just run: uvicorn main:app --reload
"""

import re
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import Optional
import database as db
import auth

app = FastAPI(title="FinTrack API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "zenvest1.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB tables on startup
db.init_db()


# ── Pydantic Models ────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

    @field_validator("username")
    @classmethod
    def username_valid(cls, v):
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        return v

    @field_validator("email")
    @classmethod
    def email_valid(cls, v):
        v = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("Invalid email address")
        return v

    @field_validator("password")
    @classmethod
    def password_valid(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

class LoginRequest(BaseModel):
    username: str
    password: str

class TransactionCreate(BaseModel):
    type: str           # "income" | "expense"
    category: str
    amount: float
    description: str
    date: str           # ISO date string "2025-06-15"

class TransactionUpdate(BaseModel):
    type: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[str] = None

class BudgetCreate(BaseModel):
    category: str
    limit: float
    month: str          # "2025-06"

class BudgetUpdate(BaseModel):
    limit: float

class GoalCreate(BaseModel):
    name: str
    target: float
    saved: float = 0.0
    deadline: Optional[str] = None

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target: Optional[float] = None
    saved: Optional[float] = None
    deadline: Optional[str] = None


# ── Auth ──────────────────────────────────────────────────

@app.post("/api/auth/register", status_code=201)
def register(body: RegisterRequest):
    if db.get_user_by_username(body.username):
        raise HTTPException(status_code=409, detail="Username already taken")
    if db.get_user_by_email(body.email):
        raise HTTPException(status_code=409, detail="Email already registered")

    password_hash = auth.hash_password(body.password)
    user = db.create_user(body.username, body.email, password_hash)
    token = auth.create_token(user["id"], user["username"])
    return {"token": token, "user": user}


@app.post("/api/auth/login")
def login(body: LoginRequest):
    user = db.get_user_by_username(body.username)
    if not user or not auth.verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = auth.create_token(user["id"], user["username"])
    return {
        "token": token,
        "user": {"id": user["id"], "username": user["username"], "email": user["email"]},
    }


@app.get("/api/auth/me")
def me(current_user: dict = Depends(auth.get_current_user)):
    user = db.get_user_by_id(current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user["id"], "username": user["username"], "email": user["email"]}


# ── Transactions ───────────────────────────────────────────

@app.get("/api/transactions")
def get_transactions(month: Optional[str] = None, type: Optional[str] = None,
                      current_user: dict = Depends(auth.get_current_user)):
    return db.get_transactions(current_user["id"], month=month, type=type)

@app.post("/api/transactions", status_code=201)
def add_transaction(t: TransactionCreate, current_user: dict = Depends(auth.get_current_user)):
    return db.add_transaction(current_user["id"], t.dict())

@app.put("/api/transactions/{tx_id}")
def update_transaction(tx_id: int, t: TransactionUpdate,
                        current_user: dict = Depends(auth.get_current_user)):
    updated = db.update_transaction(current_user["id"], tx_id, t.dict(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return updated

@app.delete("/api/transactions/{tx_id}")
def delete_transaction(tx_id: int, current_user: dict = Depends(auth.get_current_user)):
    if not db.delete_transaction(current_user["id"], tx_id):
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"success": True}


# ── Summary / Analytics ────────────────────────────────────

@app.get("/api/summary")
def get_summary(month: Optional[str] = None, current_user: dict = Depends(auth.get_current_user)):
    """Total income, expenses, balance for the given month (or all time)."""
    return db.get_summary(current_user["id"], month)

@app.get("/api/analytics/monthly")
def get_monthly_analytics(current_user: dict = Depends(auth.get_current_user)):
    """Last 6 months income vs expense — for dashboard chart."""
    return db.get_monthly_analytics(current_user["id"])

@app.get("/api/analytics/categories")
def get_category_breakdown(month: Optional[str] = None,
                            current_user: dict = Depends(auth.get_current_user)):
    """Expense breakdown by category — for pie chart."""
    return db.get_category_breakdown(current_user["id"], month)


# ── Budgets ────────────────────────────────────────────────

@app.get("/api/budgets")
def get_budgets(month: Optional[str] = None, current_user: dict = Depends(auth.get_current_user)):
    return db.get_budgets(current_user["id"], month)

@app.post("/api/budgets", status_code=201)
def add_budget(b: BudgetCreate, current_user: dict = Depends(auth.get_current_user)):
    return db.add_budget(current_user["id"], b.dict())

@app.put("/api/budgets/{budget_id}")
def update_budget(budget_id: int, b: BudgetUpdate,
                   current_user: dict = Depends(auth.get_current_user)):
    updated = db.update_budget(current_user["id"], budget_id, b.dict())
    if not updated:
        raise HTTPException(status_code=404, detail="Budget not found")
    return updated

@app.delete("/api/budgets/{budget_id}")
def delete_budget(budget_id: int, current_user: dict = Depends(auth.get_current_user)):
    if not db.delete_budget(current_user["id"], budget_id):
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"success": True}


# ── Goals ─────────────────────────────────────────────────

@app.get("/api/goals")
def get_goals(current_user: dict = Depends(auth.get_current_user)):
    return db.get_goals(current_user["id"])

@app.post("/api/goals", status_code=201)
def add_goal(g: GoalCreate, current_user: dict = Depends(auth.get_current_user)):
    return db.add_goal(current_user["id"], g.dict())

@app.put("/api/goals/{goal_id}")
def update_goal(goal_id: int, g: GoalUpdate, current_user: dict = Depends(auth.get_current_user)):
    updated = db.update_goal(current_user["id"], goal_id, g.dict(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Goal not found")
    return updated

@app.delete("/api/goals/{goal_id}")
def delete_goal(goal_id: int, current_user: dict = Depends(auth.get_current_user)):
    if not db.delete_goal(current_user["id"], goal_id):
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"success": True}


# ── Alerts ────────────────────────────────────────────────

@app.get("/api/alerts")
def get_alerts(month: Optional[str] = None, current_user: dict = Depends(auth.get_current_user)):
    """Returns budget alerts where spending > 80% of limit."""
    return db.get_budget_alerts(current_user["id"], month)


@app.get("/")
def root():
    return {"status": "ZenVest API running 💰"}
