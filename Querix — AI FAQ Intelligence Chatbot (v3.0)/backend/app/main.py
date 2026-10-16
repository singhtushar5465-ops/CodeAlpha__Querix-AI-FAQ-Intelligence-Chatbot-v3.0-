import os
import json
import csv
import io
import uuid
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Request, Response, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, EmailStr

from backend.app.database import (
    init_db, get_user_by_email, get_user_by_id, create_user,
    update_user_tokens, upgrade_user_plan, topup_user_tokens,
    get_token_ledger, save_chat_message, get_chat_history,
    save_feedback, log_query, get_admin_metrics, delete_user_account, get_db,
    record_transaction
)
from backend.app.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user_from_request
)
from backend.app.nlp_engine import QuerixNLPEngine

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FAQS_PATH = os.path.join(BASE_DIR, "faqs.json")

# Initialize App and NLP Engine
app = FastAPI(title="Querix AI FAQ Intelligence API", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

nlp_engine = QuerixNLPEngine(FAQS_PATH)

# In-memory guest session tracking: guest_id -> question_count
guest_sessions: Dict[str, int] = {}

# Pydantic Schemas
class ChatRequest(BaseModel):
    query: str
    topic: Optional[str] = "All"
    is_voice: bool = False
    session_id: Optional[str] = None
    guest_id: Optional[str] = None

class SignUpRequest(BaseModel):
    email: str
    password: str
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UpgradeRequest(BaseModel):
    plan: str
    billing_period: Optional[str] = "monthly"
    payment_method: Optional[str] = "UPI"
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None
    payment_details: Optional[Dict[str, Any]] = None
    amount: Optional[float] = None

class TopupRequest(BaseModel):
    payment_method: Optional[str] = "UPI"
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None
    payment_details: Optional[Dict[str, Any]] = None
    amount: Optional[float] = 99.0

class FeedbackRequest(BaseModel):
    faq_id: Optional[str] = None
    query: str
    rating: int

# Helper dependency to resolve user
def get_user_optional(request: Request) -> Optional[Dict[str, Any]]:
    payload = get_current_user_from_request(request)
    if payload and "sub" in payload:
        return get_user_by_id(payload["sub"])
    return None

# Endpoints

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "Querix AI FAQ Intelligence",
        "version": "3.0",
        "faqs_loaded": len(nlp_engine.faqs)
    }

@app.get("/api/faqs")
def get_faqs_overview():
    topics = list(set(faq["topic"] for faq in nlp_engine.faqs))
    topics.sort()
    # Starters for UI
    starters = [
        {"topic": "Returns & Refunds", "question": "how do I get my money back?"},
        {"topic": "Product Help", "question": "How do I initiate a voice conversation with Jarvix?"},
        {"topic": "Billing & Plans", "question": "What subscription plans does Querix offer?"},
        {"topic": "Technical Support", "question": "What is the confidence threshold and how does it work?"},
        {"topic": "Shipping & Orders", "question": "How do I track my order shipment status?"},
        {"topic": "Account & Security", "question": "How does Querix protect my account credentials and passwords?"}
    ]
    return {
        "topics": ["All"] + topics,
        "starter_questions": starters,
        "total_faqs": len(nlp_engine.faqs)
    }

@app.post("/api/auth/signup")
def signup(req: SignUpRequest, response: Response):
    existing = get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    hashed = hash_password(req.password)
    user = create_user(req.email, hashed, req.name)
    token = create_access_token({"sub": user["id"], "email": user["email"]})
    
    # Set httpOnly cookie
    response.set_cookie(key="querix_session", value=token, httponly=True, max_age=86400 * 7, samesite="lax")
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "avatar": user["avatar"],
            "plan": user["plan"],
            "token_limit": user["token_limit"],
            "tokens_used": user["tokens_used"]
        }
    }

@app.post("/api/auth/login")
def login(req: LoginRequest, response: Response):
    user = get_user_by_email(req.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    token = create_access_token({"sub": user["id"], "email": user["email"]})
    response.set_cookie(key="querix_session", value=token, httponly=True, max_age=86400 * 7, samesite="lax")
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "avatar": user["avatar"],
            "plan": user["plan"],
            "token_limit": user["token_limit"],
            "tokens_used": user["tokens_used"]
        }
    }

@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie("querix_session")
    return {"message": "Logged out successfully."}

@app.get("/api/auth/me")
def get_me(user: Optional[Dict[str, Any]] = Depends(get_user_optional)):
    if not user:
        return {"authenticated": False, "user": None}
    
    return {
        "authenticated": True,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "avatar": user["avatar"],
            "plan": user["plan"],
            "token_limit": user["token_limit"],
            "tokens_used": user["tokens_used"]
        }
    }

@app.post("/api/chat")
def handle_chat(req: ChatRequest, request: Request, user: Optional[Dict[str, Any]] = Depends(get_user_optional)):
    query = req.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    session_id = req.session_id or str(uuid.uuid4())
    is_guest = user is None
    guest_questions_left = 5

    # Guest Mode Validation (5 free questions)
    if is_guest:
        guest_id = req.guest_id or request.cookies.get("querix_guest_id") or str(uuid.uuid4())
        current_count = guest_sessions.get(guest_id, 0)
        
        if current_count >= 5:
            return {
                "blocked": True,
                "reason": "guest_limit",
                "message": "You have utilized your 5 free questions in Guest Mode! Create a free Querix account to unlock 10,000 monthly tokens instantly.",
                "guest_questions_left": 0
            }
        
        guest_sessions[guest_id] = current_count + 1
        guest_questions_left = max(0, 5 - guest_sessions[guest_id])
    else:
        # Authenticated User Token Validation
        if user["tokens_used"] >= user["token_limit"]:
            return {
                "blocked": True,
                "reason": "token_limit",
                "message": f"You have reached 100% of your {user['plan']} plan limit ({user['token_limit']:,} tokens). Upgrade to Pro or add a Top-Up pack to continue chatting without interruption.",
                "tokens_used": user["tokens_used"],
                "token_limit": user["token_limit"]
            }

    # NLP Matching Execution
    match_result = nlp_engine.match(query, topic_filter=req.topic)
    
    answer_text = match_result.get("answer") or match_result.get("message", "")
    tokens_consumed = QuerixNLPEngine.calculate_token_usage(query, answer_text, is_voice=req.is_voice)
    
    user_id = user["id"] if user else f"guest_{req.guest_id or 'anon'}"
    
    # Log query metrics
    log_query(
        query=query,
        matched=match_result.get("matched", False),
        confidence=match_result.get("confidence", 0.0),
        topic=match_result.get("topic"),
        user_id=user["id"] if user else None
    )

    # Save to history & update tokens
    if user:
        update_user_tokens(user["id"], tokens_consumed, query, query_type="voice" if req.is_voice else "text")
        save_chat_message(user["id"], session_id, "user", query)
        save_chat_message(
            user["id"], session_id, "assistant", answer_text,
            matched_faq_id=match_result.get("faq_id"),
            topic=match_result.get("topic"),
            confidence=match_result.get("confidence")
        )
        updated_user = get_user_by_id(user["id"])
        tokens_used = updated_user["tokens_used"]
        token_limit = updated_user["token_limit"]
    else:
        tokens_used = (5 - guest_questions_left) * 150
        token_limit = 750

    usage_percent = round((tokens_used / token_limit) * 100, 1) if token_limit > 0 else 0

    response_payload = {
        "blocked": False,
        "session_id": session_id,
        "matched": match_result.get("matched", False),
        "faq_id": match_result.get("faq_id"),
        "topic": match_result.get("topic"),
        "matched_question": match_result.get("matched_question"),
        "answer": answer_text,
        "confidence": match_result.get("confidence", 0.0),
        "intent": match_result.get("intent"),
        "related_questions": match_result.get("related_questions", []),
        "suggested_questions": match_result.get("suggested_questions", []),
        "contact_support": match_result.get("contact_support", False),
        "tokens_consumed": tokens_consumed,
        "tokens_used": tokens_used,
        "token_limit": token_limit,
        "usage_percent": usage_percent,
        "is_guest": is_guest,
        "guest_questions_left": guest_questions_left
    }

    return response_payload

@app.get("/api/usage")
def get_usage(user: Optional[Dict[str, Any]] = Depends(get_user_optional)):
    if not user:
        return {
            "is_guest": True,
            "guest_questions_used": 0,
            "guest_limit": 5,
            "tokens_used": 0,
            "token_limit": 10000,
            "usage_percent": 0.0,
            "plan": "Guest",
            "ledger": []
        }
    
    ledger = get_token_ledger(user["id"])
    usage_percent = round((user["tokens_used"] / user["token_limit"]) * 100, 1) if user["token_limit"] > 0 else 0
    
    return {
        "is_guest": False,
        "plan": user["plan"],
        "tokens_used": user["tokens_used"],
        "token_limit": user["token_limit"],
        "usage_percent": usage_percent,
        "ledger": ledger
    }

@app.post("/api/billing/upgrade")
def upgrade_plan(req: UpgradeRequest, response: Response, user: Optional[Dict[str, Any]] = Depends(get_user_optional)):
    target_user = user

    # If guest, resolve or create account by customer_email
    if not target_user:
        if req.customer_email:
            existing = get_user_by_email(req.customer_email)
            if existing:
                target_user = existing
            else:
                name = req.customer_name or req.customer_email.split("@")[0].title()
                pwd_hash = hash_password("QuerixSecure2026!")
                target_user = create_user(req.customer_email, pwd_hash, name)
            
            # Issue JWT token for automatic session login
            token = create_access_token({"sub": target_user["id"], "email": target_user["email"]})
            response.set_cookie(
                key="querix_token",
                value=token,
                httponly=True,
                max_age=86400 * 30,
                samesite="lax"
            )
        else:
            raise HTTPException(status_code=401, detail="Please sign in or provide your email to complete subscription.")

    if req.plan not in ["Free", "Pro", "Business"]:
        raise HTTPException(status_code=400, detail="Invalid plan selected.")

    # Calculate actual price
    prices = {
        "Pro": {"monthly": 499.0, "yearly": 4990.0},
        "Business": {"monthly": 1999.0, "yearly": 19990.0}
    }
    amount = req.amount or prices.get(req.plan, {}).get(req.billing_period, 499.0)

    # Perform plan upgrade
    updated = upgrade_user_plan(target_user["id"], req.plan)

    # Generate invoice & transaction
    invoice_no = f"INV-2026-{uuid.uuid4().hex[:6].upper()}"
    txn_id = f"TXN_QX_{uuid.uuid4().hex[:8].upper()}"
    record_transaction(
        user_id=target_user["id"],
        plan=req.plan,
        amount=amount,
        payment_method=req.payment_method or "UPI",
        invoice_no=invoice_no
    )

    return {
        "success": True,
        "message": f"Successfully activated {req.plan} plan via {req.payment_method}!",
        "transaction_id": txn_id,
        "invoice_no": invoice_no,
        "amount_paid": amount,
        "payment_method": req.payment_method or "UPI",
        "billing_period": req.billing_period or "monthly",
        "user": {
            "id": updated["id"],
            "name": updated["name"],
            "email": updated["email"],
            "plan": updated["plan"],
            "token_limit": updated["token_limit"],
            "tokens_used": updated["tokens_used"]
        }
    }

@app.post("/api/billing/topup")
def topup_tokens(response: Response, req: Optional[TopupRequest] = None, user: Optional[Dict[str, Any]] = Depends(get_user_optional)):
    target_user = user
    if not target_user:
        if req and req.customer_email:
            existing = get_user_by_email(req.customer_email)
            if existing:
                target_user = existing
            else:
                name = req.customer_name or req.customer_email.split("@")[0].title()
                pwd_hash = hash_password("QuerixSecure2026!")
                target_user = create_user(req.customer_email, pwd_hash, name)
            if response:
                token = create_access_token({"sub": target_user["id"], "email": target_user["email"]})
                response.set_cookie(key="querix_token", value=token, httponly=True, max_age=86400 * 30, samesite="lax")
        else:
            raise HTTPException(status_code=401, detail="Please sign in to purchase token boosters.")

    updated = topup_user_tokens(target_user["id"], 100000)
    invoice_no = f"INV-2026-TOP-{uuid.uuid4().hex[:5].upper()}"
    txn_id = f"TXN_TOP_{uuid.uuid4().hex[:8].upper()}"
    payment_method = (req.payment_method if req else None) or "UPI"
    amount = (req.amount if req else None) or 99.0

    record_transaction(
        user_id=target_user["id"],
        plan="Topup_100k",
        amount=amount,
        payment_method=payment_method,
        invoice_no=invoice_no
    )

    return {
        "success": True,
        "message": "Added +100,000 tokens for ₹99!",
        "transaction_id": txn_id,
        "invoice_no": invoice_no,
        "amount_paid": amount,
        "payment_method": payment_method,
        "user": {
            "id": updated["id"],
            "name": updated["name"],
            "email": updated["email"],
            "token_limit": updated["token_limit"],
            "tokens_used": updated["tokens_used"],
            "plan": updated["plan"]
        }
    }

@app.post("/api/billing/checkout")
def checkout(plan: str, billing_period: str = "monthly", user: Optional[Dict[str, Any]] = Depends(get_user_optional)):
    # Returns simulated Razorpay/Stripe session ID
    order_id = f"order_qx_{uuid.uuid4().hex[:12]}"
    prices = {
        "Pro": {"monthly": 499, "yearly": 4990},
        "Business": {"monthly": 1999, "yearly": 19990},
        "Topup": {"monthly": 99, "yearly": 99}
    }
    amount = prices.get(plan, {}).get(billing_period, 499)
    return {
        "order_id": order_id,
        "amount": amount,
        "currency": "INR",
        "gateway": "Razorpay & Stripe (Sandbox Enabled)",
        "customer_email": user["email"] if user else "guest@querix.ai",
        "status": "created"
    }

@app.post("/api/faq/upload")
async def upload_faq(file: UploadFile = File(...), user: Optional[Dict[str, Any]] = Depends(get_user_optional)):
    if user and user["plan"] == "Free":
        raise HTTPException(status_code=403, detail="Custom FAQ dataset uploads are reserved for Pro and Business plans.")
    
    content = await file.read()
    new_faqs = []
    
    filename = file.filename.lower()
    if filename.endswith(".json"):
        try:
            data = json.loads(content.decode("utf-8"))
            if isinstance(data, list):
                new_faqs = data
            else:
                raise ValueError("JSON must be a list of FAQ objects.")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON format: {str(e)}")
            
    elif filename.endswith(".csv"):
        try:
            stream = io.StringIO(content.decode("utf-8"))
            reader = csv.DictReader(stream)
            for row in reader:
                new_faqs.append({
                    "id": f"custom_{uuid.uuid4().hex[:8]}",
                    "topic": row.get("topic", "General"),
                    "question": row.get("question", ""),
                    "answer": row.get("answer", ""),
                    "keywords": [k.strip() for k in row.get("keywords", "").split(",") if k.strip()],
                    "intent": row.get("intent", "custom_faq")
                })
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Only .csv and .json files are supported.")

    # Retrain index
    nlp_engine.load_and_fit(extra_faqs=new_faqs)
    
    return {
        "success": True,
        "uploaded_count": len(new_faqs),
        "total_faqs_now": len(nlp_engine.faqs),
        "message": f"Successfully indexed {len(new_faqs)} custom FAQs. TF-IDF vector index retrained!"
    }

@app.get("/api/admin/analytics")
def get_analytics():
    return get_admin_metrics()

@app.post("/api/feedback")
def submit_feedback(req: FeedbackRequest, user: Optional[Dict[str, Any]] = Depends(get_user_optional)):
    save_feedback(
        faq_id=req.faq_id or "unknown",
        query=req.query,
        rating=req.rating,
        user_id=user["id"] if user else None
    )
    return {"success": True, "message": "Thank you for your feedback!"}

@app.get("/api/history")
def fetch_history(user: Optional[Dict[str, Any]] = Depends(get_user_optional)):
    if not user:
        return {"history": []}
    return {"history": get_chat_history(user["id"])}

@app.delete("/api/account")
def remove_account(user: Optional[Dict[str, Any]] = Depends(get_user_optional)):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    delete_user_account(user["id"])
    return {"success": True, "message": "Your account and all associated data have been permanently deleted."}

# Static Frontend Mounting
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "frontend"))
if os.path.exists(FRONTEND_DIR):
    NO_CACHE_HEADERS = {
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0"
    }

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"), headers=NO_CACHE_HEADERS)

    @app.get("/style.css")
    async def serve_css():
        return FileResponse(os.path.join(FRONTEND_DIR, "style.css"), media_type="text/css", headers=NO_CACHE_HEADERS)

    @app.get("/app.js")
    async def serve_js():
        return FileResponse(os.path.join(FRONTEND_DIR, "app.js"), media_type="application/javascript", headers=NO_CACHE_HEADERS)

    @app.get("/logo.png")
    async def serve_logo():
        return FileResponse(os.path.join(FRONTEND_DIR, "logo.png"), media_type="image/png")

    @app.get("/favicon.ico")
    async def serve_favicon_ico():
        return FileResponse(os.path.join(FRONTEND_DIR, "favicon.ico"), media_type="image/x-icon")

    @app.get("/favicon.png")
    async def serve_favicon_png():
        return FileResponse(os.path.join(FRONTEND_DIR, "favicon.png"), media_type="image/png")

    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")


