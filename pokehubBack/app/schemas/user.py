from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    nombre: str
    email: EmailStr
    avatar: Optional[str] = None
    rol: str
    dinero: Decimal = Decimal("0.00")
    estado: str

class UserCreate(UserBase):
    clave: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True