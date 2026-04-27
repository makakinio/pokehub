from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.pokemon import Pokemon
from app.models.movimiento import Movimiento
from app.models.pokemon_movimiento import PokemonMovimiento
from app.schemas.pokemon_movimiento import (
    PokemonMovimientoCreate,
    PokemonMovimientoResponse,
)

router = APIRouter(prefix="/pokemon-movimientos", tags=["pokemon_movimientos"])

@router.get("/", response_model=list[PokemonMovimientoResponse])
def get_pokemon_movimientos(db: Session = Depends(get_db)):
    return db.query(PokemonMovimiento).all()

@router.get("/pokemon/{pokemon_id}", response_model=list[PokemonMovimientoResponse])
def get_movimientos_de_pokemon(pokemon_id: int, db: Session = Depends(get_db)):
    return db.query(PokemonMovimiento).filter(
        PokemonMovimiento.id_pokemon == pokemon_id
    ).all()

@router.post("/", response_model=PokemonMovimientoResponse, status_code=status.HTTP_201_CREATED)
def create_pokemon_movimiento(data: PokemonMovimientoCreate, db: Session = Depends(get_db)):
    pokemon = db.query(Pokemon).filter(Pokemon.id == data.id_pokemon).first()
    if not pokemon:
        raise HTTPException(status_code=404, detail="Pokémon no encontrado")

    movimiento = db.query(Movimiento).filter(Movimiento.id == data.id_movimiento).first()
    if not movimiento:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")

    existing = db.query(PokemonMovimiento).filter(
        PokemonMovimiento.id_pokemon == data.id_pokemon,
        PokemonMovimiento.id_movimiento == data.id_movimiento,
        PokemonMovimiento.metodo_aprendizaje == data.metodo_aprendizaje
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Esa relación ya existe"
        )

    new_relation = PokemonMovimiento(**data.model_dump())
    db.add(new_relation)
    db.commit()
    db.refresh(new_relation)
    return new_relation