import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

# Initialize Celery app
celery_app = Celery(
    "agent_worker",
    broker=redis_url,
    backend=redis_url
)

# Optional configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Pre-load tasks
import backend.tasks
