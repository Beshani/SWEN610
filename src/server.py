from fastapi import FastAPI, HTTPException, Response
from src.api import members, workspaces, boards, tasks, comments, login, category
from src.db import swen610_db_utils as db_utils
from src.db import taskmaster

from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

origins = [
    "http://localhost:5173",   # Vite default
    "http://127.0.0.1:5173",   # Sometimes needed
    # Add production domain here when deployed
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,     # Required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(members.router)
app.include_router(login.router)
app.include_router(workspaces.router)
app.include_router(boards.router)
app.include_router(tasks.router)
app.include_router(comments.router)
app.include_router(category.router)

@app.get("/favicon.ico", include_in_schema=False)
def favicon_no_content():
    return Response(status_code=204)

@app.get("/")
def home_page():
    return {"message": "This is the home page"}

# --- Management endpoints ---
@app.get("/manage/version")
def version():
    try:
        row = db_utils.exec_get_one("SELECT VERSION()")
        return {"version": row}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ------ App Setup
@app.post("/taskmaster/init")
def init_db():
    try:
        taskmaster.rebuild_tables()
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))