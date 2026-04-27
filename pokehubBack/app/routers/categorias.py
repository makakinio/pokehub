from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.categoria import Categoria
from app.schemas.categoria import CategoriaCreate, CategoriaResponse

router = APIRouter(prefix="/categorias", tags=["categorias"])

@router.get("/", response_model=list[CategoriaResponse])
def get_categorias(db: Session = Depends(get_db)):
    return db.query(Categoria).all()

@router.get("/{categoria_id}", response_model=CategoriaResponse)
def get_categoria_by_id(categoria_id: int, db: Session = Depends(get_db)):
    categoria = db.query(Categoria).filter(Categoria.id == categoria_id).first()

    if not categoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada"
        )

    return categoria

@router.post("/", response_model=CategoriaResponse, status_code=status.HTTP_201_CREATED)
def create_categoria(data: CategoriaCreate, db: Session = Depends(get_db)):
    new_categoria = Categoria(**data.model_dump())
    db.add(new_categoria)
    db.commit()
    db.refresh(new_categoria)

    return new_categoria