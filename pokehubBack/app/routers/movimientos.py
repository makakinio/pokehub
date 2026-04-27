from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.movimiento import Movimiento
from app.schemas.movimiento import MovimientoCreate, MovimientoResponse

router = APIRouter(prefix="/movimientos", tags=["movimientos"])

@router.get("/", response_model=list[MovimientoResponse])
def get_movimientos(db: Session = Depends(get_db)):
    return db.query(Movimiento).all()

@router.get("/{movimiento_id}", response_model=MovimientoResponse)
def get_movimiento_by_id(movimiento_id: int, db: Session = Depends(get_db)):
    movimiento = db.query(Movimiento).filter(Movimiento.id == movimiento_id).first()
    if not movimiento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movimiento no encontrado"
        )
    return movimiento

@router.post("/", response_model=MovimientoResponse, status_code=status.HTTP_201_CREATED)
def create_movimiento(movimiento_in: MovimientoCreate, db: Session = Depends(get_db)):
    new_movimiento = Movimiento(**movimiento_in.model_dump())
    db.add(new_movimiento)
    db.commit()
    db.refresh(new_movimiento)
    return new_movimiento