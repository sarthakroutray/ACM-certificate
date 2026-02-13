from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from config import settings
from database import init_db
from routers import auth, certificates, workshops, images, templates

# Initialize database on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    print("✓ Database initialized")
    # Ensure media directories exist
    media_dir = Path(__file__).parent / "media" / "certificates"
    media_dir.mkdir(parents=True, exist_ok=True)
    print("✓ Media directories ready")
    yield
    # Shutdown
    print("✓ Application shutdown")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Certificate management system for ACM Club",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(certificates.router)
app.include_router(workshops.router)
app.include_router(images.router)
app.include_router(templates.router)

# Serve generated certificate images
_media_dir = Path(__file__).parent / "media"
_media_dir.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(_media_dir)), name="media")


# Health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "app": settings.APP_NAME}


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "ACM Certificate Management System",
        "docs": "/docs",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENV == "development",
    )
