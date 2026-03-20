from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import router as api_router

app = FastAPI(title="Life Data Agent API")

app.include_router(api_router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Life Data Agent API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
