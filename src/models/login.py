from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    message: str
    session_key: str
    member_id: int
    username: str
    email: str
    is_admin: bool
    status: str