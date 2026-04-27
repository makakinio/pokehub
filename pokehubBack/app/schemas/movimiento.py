from typing import Optional
from pydantic import BaseModel

class MovimientoBase(BaseModel):
    nombre: str
    tipo: str
    categoria: str
    efecto: Optional[str] = None
    danio: Optional[int] = None
    porcentaje: Optional[int] = None
    estadistica_afectada: Optional[str] = None
    precision_mov: int
    pp: int
    descripcion: Optional[str] = None

class MovimientoCreate(MovimientoBase):
    pass

class MovimientoResponse(MovimientoBase):
    id: int

    class Config:
        from_attributes = True