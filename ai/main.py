from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import solve, practice, health
from security import InternalTokenMiddleware, RateLimitMiddleware
from services import llm_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model weights once at startup
    llm_service.load_model()
    yield


app = FastAPI(title="MathAI API", lifespan=lifespan)

app.add_middleware(InternalTokenMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.allowed_origins.split(",") if origin.strip()],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["content-type", "authorization", "x-internal-token"],
)

app.include_router(solve.router, prefix="/api")
app.include_router(practice.router, prefix="/api")
app.include_router(health.router, prefix="/api")
