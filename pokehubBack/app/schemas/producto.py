from decimal import Decimal
from typing import Optional
from pydantic import BaseModel

class ProductoBase(BaseModel):
    id_categoria: int
    nombre: str
    descripcion: Optional[str] = None
    precio: Decimal
    imagen: Optional[str] = None

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(BaseModel):
    nombre:      Optional[str]     = None
    descripcion: Optional[str]     = None
    precio:      Optional[Decimal] = None

class ProductoResponse(ProductoBase):
    id: int

    class Config:
        from_attributes = True