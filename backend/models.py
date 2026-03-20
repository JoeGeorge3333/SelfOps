from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class NutritionLogCreate(BaseModel):
    food_item: str
    calories: Optional[int] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    confidence_rating: Optional[int] = Field(None, ge=1, le=3)

class WorkoutLogCreate(BaseModel):
    workout_type: str
    exercise: str
    sets: Optional[int] = None
    reps: Optional[int] = None
    weight: Optional[float] = None

class CardioLogCreate(BaseModel):
    source: str # 'manual' or 'expo_sensor'
    steps: Optional[int] = None
    distance_miles: Optional[float] = None
    pace: Optional[str] = None

class BodyMetricsLogCreate(BaseModel):
    weight_lbs: Optional[float] = None
    water_intake_oz: Optional[int] = None

class ProductivityLogCreate(BaseModel):
    topics_studied: Optional[str] = None
    tools_used: Optional[str] = None
    notes: Optional[str] = None

class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = None
    tags: Optional[List[str]] = []
