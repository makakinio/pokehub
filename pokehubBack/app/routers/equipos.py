from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.equipo import Equipo
from app.models.pokemon_usuario import PokemonUsuario
from app.schemas.equipo import EquipoCreate, EquipoResponse

router = APIRouter(prefix="/equipos", tags=["equipos"])

@router.get("/", response_model=list[EquipoResponse])
def get_equipos(db: Session = Depends(get_db)):
    return db.query(Equipo).all()

@router.get("/{equipo_id}", response_model=EquipoResponse)
def get_equipo_by_id(equipo_id: int, db: Session = Depends(get_db)):
    equipo = db.query(Equipo).filter(Equipo.id == equipo_id).first()

    if not equipo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipo no encontrado"
        )

    return equipo

@router.get("/usuario/{user_id}", response_model=list[EquipoResponse])
def get_equipos_by_user(user_id: int, db: Session = Depends(get_db)):
    return db.query(Equipo).filter(Equipo.id_usuario == user_id).all()

@router.post("/", response_model=EquipoResponse, status_code=status.HTTP_201_CREATED)
def create_equipo(data: EquipoCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.id_usuario).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    pokemon_slots = [
        data.id_pokemon_usuario_01,
        data.id_pokemon_usuario_02,
        data.id_pokemon_usuario_03,
        data.id_pokemon_usuario_04,
        data.id_pokemon_usuario_05,
        data.id_pokemon_usuario_06,
    ]

    for pokemon_usuario_id in pokemon_slots:
        if pokemon_usuario_id is not None:
            pokemon_usuario = db.query(PokemonUsuario).filter(
                PokemonUsuario.id == pokemon_usuario_id
            ).first()

            if not pokemon_usuario:
                raise HTTPException(
                    status_code=404,
                    detail=f"Pokémon de usuario con id {pokemon_usuario_id} no encontrado"
                )

    new_equipo = Equipo(**data.model_dump())
    db.add(new_equipo)
    db.commit()
    db.refresh(new_equipo)

    return new_equipo