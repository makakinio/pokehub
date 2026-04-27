from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.pokemon import Pokemon
from app.models.pokemon_usuario import PokemonUsuario
from app.schemas.pokemon_usuario import (
    PokemonUsuarioCreate,
    PokemonUsuarioResponse,
)

router = APIRouter(prefix="/pokemon-usuarios", tags=["pokemon_usuarios"])

@router.get("/", response_model=list[PokemonUsuarioResponse])
def get_pokemon_usuarios(db: Session = Depends(get_db)):
    return db.query(PokemonUsuario).all()

@router.get("/{pokemon_usuario_id}", response_model=PokemonUsuarioResponse)
def get_pokemon_usuario_by_id(pokemon_usuario_id: int, db: Session = Depends(get_db)):
    pokemon_usuario = db.query(PokemonUsuario).filter(
        PokemonUsuario.id == pokemon_usuario_id
    ).first()

    if not pokemon_usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pokémon de usuario no encontrado"
        )

    return pokemon_usuario

@router.get("/usuario/{user_id}", response_model=list[PokemonUsuarioResponse])
def get_pokemon_by_user(user_id: int, db: Session = Depends(get_db)):
    return db.query(PokemonUsuario).filter(
        PokemonUsuario.id_usuario == user_id
    ).all()

@router.post("/", response_model=PokemonUsuarioResponse, status_code=status.HTTP_201_CREATED)
def create_pokemon_usuario(data: PokemonUsuarioCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.id_usuario).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    pokemon = db.query(Pokemon).filter(Pokemon.id == data.id_pokemon).first()
    if not pokemon:
        raise HTTPException(status_code=404, detail="Pokémon no encontrado")

    new_pokemon_usuario = PokemonUsuario(**data.model_dump())
    db.add(new_pokemon_usuario)
    db.commit()
    db.refresh(new_pokemon_usuario)

    return new_pokemon_usuario