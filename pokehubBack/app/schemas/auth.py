from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    clave: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"