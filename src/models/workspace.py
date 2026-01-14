from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from src.models.user import User

class WorkspaceOut(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    created_on: datetime
    created_by: Optional[int] = None



class WorkspaceUsers(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    users: List[User]
    boardCount: int

class BulkUsernamesPayload(BaseModel):
    usernames: List[str] = Field(
        ...,
        example=["alice", "bob", "charlie"],
        description="Usernames to add to this workspace"
    )