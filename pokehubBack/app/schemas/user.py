from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    nombre: str
    email: EmailStr
    avatar: Optional[str] = None
    admin: int = 0
    dinero: Decimal = Decimal("10.00")
    estado: str = "activo"
    verificado: bool = False


class UserCreate(BaseModel):
    """Solo los campos que el cliente debe enviar al registrarse."""
    nombre: str
    email: EmailStr
    clave: str
    avatar: Optional[str] = None


class UserUpdate(BaseModel):
    estado:     Optional[str]     = None   # "activo" | "baneado"
    admin:      Optional[int]     = None   # 0 | 1
    dinero:     Optional[Decimal] = None
    verificado: Optional[bool]    = None

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True
