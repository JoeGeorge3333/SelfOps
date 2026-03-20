import os
import requests
import json
import logging
from .database import supabase

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
MODEL_NAME = "llama3.2:3b"

logger = logging.getLogger(__name__)

class AgentTool:
    @staticmethod
    def call_ollama(prompt: str, json_format: bool = True) -> str:
        payload = {
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False
        }
        if json_format:
            payload["format"] = "json"
            
        try:
            res = requests.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload, timeout=60)
            res.raise_for_status()
            return res.json().get("response", "")
        except Exception as e:
            logger.error(f"Ollama call failed: {e}")
            return "{}"

    @staticmethod
    def safe_parse_json(text: str) -> dict:
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Fallback primitive parsing logic if model drifts
            logger.warning("Agent produced exact invalid JSON. Storing as raw text.")
            return {"error": "malformed_json", "raw_output": text}

class AnalysisAgent:
    @staticmethod
    def analyze(user_id: str, recent_data: dict) -> dict:
        prompt = f"""
        You are a life data analysis agent. Review the following recent data for the user:
        {json.dumps(recent_data)}
        
        Identify any behavioral trends, correlations (e.g., between sleep/cardio and productivity), 
        or anomalies in the data. Provide exactly one JSON object as your output, with these keys: 
        'trends' (list of strings), 'correlations' (list of strings), 'anomalies' (list of strings).
        """
        response_text = AgentTool.call_ollama(prompt, json_format=True)
        return AgentTool.safe_parse_json(response_text)

class SuggestionAgent:
    @staticmethod
    def suggest(analysis_result: dict) -> dict:
        prompt = f"""
        You are a highly actionable life coach agent. Based on these recent behavioral trends:
        {json.dumps(analysis_result)}
        
        Generate 3 very specific, actionable suggestions for the user to improve their physical or mental health today.
        Output exactly one JSON object with the key 'suggestions' pointing to a list of strings.
        """
        response_text = AgentTool.call_ollama(prompt, json_format=True)
        return AgentTool.safe_parse_json(response_text)

class VisualizationAgent:
    @staticmethod
    def generate_chart_data(recent_data: dict) -> dict:
        prompt = f"""
        You are a data visualization assistant. Review the user data:
        {json.dumps(recent_data)}
        
        Create a JSON object configured for a chart. Provide the structure:
        {{
            "chart_type": "bar",
            "labels": ["Mon", "Tue", "Wed", "Thu", "Fri"],
            "dataset_name": "Metrics",
            "data_points": [0,0,0,0,0],
            "title": "Weekly Overview"
        }}
        Fill in the labels and data_points dynamically based on the dataset.
        """
        response_text = AgentTool.call_ollama(prompt, json_format=True)
        return AgentTool.safe_parse_json(response_text)

class IngestionAgent:
    @staticmethod
    def parse_natural_language(text: str) -> dict:
        prompt = f"""
        Extract the food items, portions, and estimated calories from this text exactly as a JSON object:
        "{text}"
        
        The JSON object should match this schema for a Nutrition Log:
        {{
            "food_item": "...",
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "confidence_rating": 3
        }}
        Set confidence rating to 3 if you are sure about macros, 1 if guessing.
        """
        response_text = AgentTool.call_ollama(prompt, json_format=True)
        return AgentTool.safe_parse_json(response_text)


def run_agent_pipeline(user_id: str):
    logger.info(f"Running full agent pipeline for {user_id}")
    
    # 1. Fetch user's data (simulated bulk fetch for MVP)
    nut_req = supabase.table("nutrition_logs").select("*").eq("user_id", user_id).order("logged_at", desc=True).limit(5).execute()
    work_req = supabase.table("workout_logs").select("*").eq("user_id", user_id).order("logged_at", desc=True).limit(5).execute()
    cardio_req = supabase.table("cardio_logs").select("*").eq("user_id", user_id).order("logged_at", desc=True).limit(5).execute()
    
    data_context = {
        "nutrition": nut_req.data,
        "workouts": work_req.data,
        "cardio": cardio_req.data
    }
    
    if not any([nut_req.data, work_req.data, cardio_req.data]):
        logger.info("No data found to analyze.")
        return
        
    # 2. Sequential Agent Calls
    analysis = AnalysisAgent.analyze(user_id, data_context)
    suggestions = SuggestionAgent.suggest(analysis)
    viz = VisualizationAgent.generate_chart_data(data_context)
    
    # 3. Store Results back to Supabase
    def save_result(rtype: str, payload: dict, summary: str):
        supabase.table("agent_results").insert({
            "user_id": user_id,
            "result_type": rtype,
            "json_payload": payload,
            "text_summary": summary
        }).execute()
        
    save_result("analysis", analysis, "Trend Analysis Generated")
    save_result("suggestion", suggestions, "Actionable Suggestions Generated")
    save_result("visualization", viz, "Dashboard Chart Data Precomputed")

    logger.info("Pipeline completed successfully.")
