from fastapi import APIRouter, Depends, Header, HTTPException, UploadFile, File
from supabase import create_client, Client
import os
import jwt
import time
import redis
from .tasks import process_agent_pipeline
from .models import (
    NutritionLogCreate, WorkoutLogCreate, CardioLogCreate, 
    BodyMetricsLogCreate, ProductivityLogCreate, NoteCreate
)

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

redis_client = redis.Redis.from_url(os.environ.get("REDIS_URL", "redis://localhost:6379/0"))

def trigger_agent_debounce(user_id: str):
    # Set the current time as the last log time
    redis_client.set(f"last_log_{user_id}", str(time.time()))
    # Queue the task to run in 60 seconds
    process_agent_pipeline.apply_async(args=[user_id], countdown=60)


router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

def get_user_context(authorization: str = Header(...)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    token = authorization.split(" ")[1]
    
    # We extract user_id from the JWT to explicitly insert it, 
    # since we didn't specify DEFAULT auth.uid() in the SQL schema.
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Create an authenticated Supabase client for this request
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    client.postgrest.auth(token)
    
    return {"client": client, "user_id": user_id}

@router.post("/api/logs/nutrition")
def create_nutrition_log(log: NutritionLogCreate, ctx: dict = Depends(get_user_context)):
    data = log.model_dump(exclude_unset=True)
    data["user_id"] = ctx["user_id"]
    res = ctx["client"].table("nutrition_logs").insert(data).execute()
    trigger_agent_debounce(ctx["user_id"])
    return {"success": True, "data": res.data}

@router.post("/api/logs/workout")
def create_workout_log(log: WorkoutLogCreate, ctx: dict = Depends(get_user_context)):
    data = log.model_dump(exclude_unset=True)
    data["user_id"] = ctx["user_id"]
    res = ctx["client"].table("workout_logs").insert(data).execute()
    trigger_agent_debounce(ctx["user_id"])
    return {"success": True, "data": res.data}

@router.post("/api/logs/cardio")
def create_cardio_log(log: CardioLogCreate, ctx: dict = Depends(get_user_context)):
    data = log.model_dump(exclude_unset=True)
    data["user_id"] = ctx["user_id"]
    res = ctx["client"].table("cardio_logs").insert(data).execute()
    trigger_agent_debounce(ctx["user_id"])
    return {"success": True, "data": res.data}

@router.post("/api/logs/body-metrics")
def create_body_metrics_log(log: BodyMetricsLogCreate, ctx: dict = Depends(get_user_context)):
    data = log.model_dump(exclude_unset=True)
    data["user_id"] = ctx["user_id"]
    res = ctx["client"].table("body_metrics_logs").insert(data).execute()
    trigger_agent_debounce(ctx["user_id"])
    return {"success": True, "data": res.data}

@router.post("/api/logs/productivity")
def create_productivity_log(log: ProductivityLogCreate, ctx: dict = Depends(get_user_context)):
    data = log.model_dump(exclude_unset=True)
    data["user_id"] = ctx["user_id"]
    res = ctx["client"].table("productivity_logs").insert(data).execute()
    trigger_agent_debounce(ctx["user_id"])
    return {"success": True, "data": res.data}

@router.post("/api/notes")
def create_note(note: NoteCreate, ctx: dict = Depends(get_user_context)):
    data = note.model_dump(exclude_unset=True)
    data["user_id"] = ctx["user_id"]
    res = ctx["client"].table("notes").insert(data).execute()
    # Notes might trigger a different knowledge agent pipeline later, but using same for now
    trigger_agent_debounce(ctx["user_id"])
    return {"success": True, "data": res.data}

@router.post("/api/logs/csv-import")
def import_csv(file: UploadFile = File(...), ctx: dict = Depends(get_user_context)):
    import csv
    import io
    content = file.file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))
    # Naive CSV import assuming the columns map to nutrition logs for the MVP
    rows = []
    for row in reader:
        row["user_id"] = ctx["user_id"]
        rows.append(row)
    
    if rows:
        res = ctx["client"].table("nutrition_logs").insert(rows).execute()
        trigger_agent_debounce(ctx["user_id"])
        return {"success": True, "imported": len(rows), "data": res.data}
    return {"success": True, "imported": 0}

from pydantic import BaseModel
class QuickAddRequest(BaseModel):
    text: str

@router.post("/api/logs/quick-add")
def quick_add_nutrition(req: QuickAddRequest, ctx: dict = Depends(get_user_context)):
    from .agents import IngestionAgent
    parsed = IngestionAgent.parse_natural_language(req.text)
    # Return parsed data for user confirmation in the UI
    return {"success": True, "parsed_data": parsed, "status": "needs_confirmation"}

