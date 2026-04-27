from datetime import date
from typing import Optional
from pydantic import BaseModel

class EquipoBase(BaseModel):
    id_usuario: int
    nombre: str
    fecha_creacion: date
    id_pokemon_usuario_01: Optional[int] = None
    id_pokemon_usuario_02: Optional[int] = None
    id_pokemon_usuario_03: Optional[int] = None
    id_pokemon_usuario_04: Optional[int] = None
    id_pokemon_usuario_05: Optional[int] = None
    id_pokemon_usuario_06: Optional[int] = None

class EquipoCreate(EquipoBase):
    pass

class EquipoResponse(EquipoBase):
    id: int

    class Config:
        from_attributes = True