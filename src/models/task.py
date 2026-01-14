from pydantic import BaseModel

class TaskPriority(BaseModel):
    id: int                 
    level: str              
    color: str