from typing import Optional
from pydantic import BaseModel

class PokemonBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    imagen: Optional[str] = None
    rareza: Optional[str] = None
    nivel_minimo: int = 1
    hp_base: int
    ataque_base: int
    defensa_base: int
    ataque_esp_base: int
    defensa_esp_base: int
    velocidad_base: int
    tipo1: str
    tipo2: Optional[str] = None

class PokemonCreate(PokemonBase):
    pass

class PokemonResponse(PokemonBase):
    id: int

    class Config:
        from_attributes = True