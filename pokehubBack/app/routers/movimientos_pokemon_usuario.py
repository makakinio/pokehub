from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.movimiento import Movimiento
from app.models.pokemon_usuario import PokemonUsuario
from app.models.movimientos_pokemon_usuario import MovimientosPokemonUsuario
from app.schemas.movimientos_pokemon_usuario import (
    MovimientosPokemonUsuarioCreate,
    MovimientosPokemonUsuarioResponse,
)

router = APIRouter(
    prefix="/movimientos-pokemon-usuario",
    tags=["movimientos_pokemon_usuario"]
)

@router.get("/", response_model=list[MovimientosPokemonUsuarioResponse])
def get_all_movesets(db: Session = Depends(get_db)):
    return db.query(MovimientosPokemonUsuario).all()

@router.get("/{pokemon_usuario_id}", response_model=MovimientosPokemonUsuarioResponse)
def get_moveset_by_pokemon_usuario_id(pokemon_usuario_id: int, db: Session = Depends(get_db)):
    moveset = db.query(MovimientosPokemonUsuario).filter(
        MovimientosPokemonUsuario.id_pokemon_usuario == pokemon_usuario_id
    ).first()

    if not moveset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Moveset no encontrado para ese Pokémon de usuario"
        )

    return moveset

@router.post("/", response_model=MovimientosPokemonUsuarioResponse, status_code=status.HTTP_201_CREATED)
def create_moveset(data: MovimientosPokemonUsuarioCreate, db: Session = Depends(get_db)):
    pokemon_usuario = db.query(PokemonUsuario).filter(
        PokemonUsuario.id == data.id_pokemon_usuario
    ).first()

    if not pokemon_usuario:
        raise HTTPException(status_code=404, detail="Pokémon de usuario no encontrado")

    existing = db.query(MovimientosPokemonUsuario).filter(
        MovimientosPokemonUsuario.id_pokemon_usuario == data.id_pokemon_usuario
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Ese Pokémon de usuario ya tiene moveset asignado"
        )

    movimientos_ids = [
        data.id_movimiento_1,
        data.id_movimiento_2,
        data.id_movimiento_3,
        data.id_movimiento_4,
    ]

    for mov_id in movimientos_ids:
        if mov_id is not None:
            movimiento = db.query(Movimiento).filter(Movimiento.id == mov_id).first()
            if not movimiento:
                raise HTTPException(
                    status_code=404,
                    detail=f"Movimiento con id {mov_id} no encontrado"
                )

    new_moveset = MovimientosPokemonUsuario(**data.model_dump())
    db.add(new_moveset)
    db.commit()
    db.refresh(new_moveset)

    return new_moveset