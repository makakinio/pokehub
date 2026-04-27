from typing import Optional
from pydantic import BaseModel

class PokemonUsuarioBase(BaseModel):
    id_usuario: int
    id_pokemon: int
    apodo: Optional[str] = None
    nivel: int = 1
    experiencia: int = 0
    hp: int
    ataque: int
    defensa: int
    ataque_especial: int
    defensa_especial: int
    velocidad: int
    shiny: bool = False

class PokemonUsuarioCreate(PokemonUsuarioBase):
    pass

class PokemonUsuarioResponse(PokemonUsuarioBase):
    id: int

    class Config:
        from_attributes = True