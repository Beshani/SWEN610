from typing import List, Optional
from pydantic import BaseModel

from src.models.user import User

class BoardUsers(BaseModel):
    id: int                 # board.id
    name: str               # board.title
    description: Optional[str] = None
    workspaceName: str      # workspace.name
    users: List[User]        # usernames on this board
    taskCount: int          # number of tasks on this board