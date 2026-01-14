from pydantic import BaseModel, Field
from typing import Optional, Literal

class CreateUserRequest(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: Optional[str] = None
    username: str
    handle: str = Field(pattern=r"^@")
    password: str

class EditUserRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    handle: Optional[str] = None
    new_password: Optional[str] = None

class User(BaseModel):
    id: int
    username: str
    first_name: Optional[str]
    last_name: Optional[str]
class UpdateStatusRequest(BaseModel):
    status: Literal["active", "suspended"]