from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.pokemon import Pokemon
from app.schemas.pokemon import PokemonCreate, PokemonResponse

router = APIRouter(prefix="/pokemon", tags=["pokemon"])

@router.get("/", response_model=list[PokemonResponse])
def get_pokemon(db: Session = Depends(get_db)):
    return db.query(Pokemon).all()

@router.get("/{pokemon_id}", response_model=PokemonResponse)
def get_pokemon_by_id(pokemon_id: int, db: Session = Depends(get_db)):
    pokemon = db.query(Pokemon).filter(Pokemon.id == pokemon_id).first()
    if not pokemon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pokémon no encontrado"
        )
    return pokemon

@router.post("/", response_model=PokemonResponse, status_code=status.HTTP_201_CREATED)
def create_pokemon(pokemon_in: PokemonCreate, db: Session = Depends(get_db)):
    new_pokemon = Pokemon(**pokemon_in.model_dump())
    db.add(new_pokemon)
    db.commit()
    db.refresh(new_pokemon)
    return new_pokemon