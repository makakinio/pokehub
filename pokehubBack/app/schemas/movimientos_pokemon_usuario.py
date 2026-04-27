from typing import Optional
from pydantic import BaseModel

class MovimientosPokemonUsuarioBase(BaseModel):
    id_pokemon_usuario: int
    id_movimiento_1: Optional[int] = None
    id_movimiento_2: Optional[int] = None
    id_movimiento_3: Optional[int] = None
    id_movimiento_4: Optional[int] = None

class MovimientosPokemonUsuarioCreate(MovimientosPokemonUsuarioBase):
    pass

class MovimientosPokemonUsuarioResponse(MovimientosPokemonUsuarioBase):
    class Config:
        from_attributes = True