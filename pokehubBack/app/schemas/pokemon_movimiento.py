from typing import Optional
from pydantic import BaseModel

class PokemonMovimientoBase(BaseModel):
    id_pokemon: int
    id_movimiento: int
    metodo_aprendizaje: str
    nivel_aprendizaje: Optional[int] = None

class PokemonMovimientoCreate(PokemonMovimientoBase):
    pass

class PokemonMovimientoResponse(PokemonMovimientoBase):
    class Config:
        from_attributes = True