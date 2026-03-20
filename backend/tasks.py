import time
import json
import logging
from .celery_worker import celery_app
from .database import supabase
import requests
import os
import redis

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
redis_client = redis.Redis.from_url(os.environ.get("REDIS_URL", "redis://localhost:6379/0"))

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, max_retries=3)
def process_agent_pipeline(self, user_id: str):
    """
    This task is triggered after a user logs data. 
    It incorporates the 60s debounce pattern (handled loosely via task scheduling delay).
    Once it runs, it queries recent data for the user and invokes Ollama for analysis.
    """
    logger.info(f"Starting agent pipeline for user_id={user_id}")
    
    # 0. Debounce check
    last_log_str = redis_client.get(f"last_log_{user_id}")
    if last_log_str:
        last_log = float(last_log_str.decode("utf-8"))
        if time.time() - last_log < 59:
            logger.info("Debounce active: a newer log exists. Skipping this task execution.")
            return "Skipped"

    # Execute the actual real agents pipeline
    from .agents import run_agent_pipeline
    try:
        run_agent_pipeline(user_id)
        logger.info(f"Agent pipeline entirely completed for user_id={user_id}")
    except Exception as exc:
        logger.error(f"Agent pipeline failed: {exc}")
        raise self.retry(exc=exc, countdown=60)
