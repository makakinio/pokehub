from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.categoria import Categoria
from app.models.producto import Producto
from app.schemas.producto import ProductoCreate, ProductoResponse

router = APIRouter(prefix="/productos", tags=["productos"])

@router.get("/", response_model=list[ProductoResponse])
def get_productos(db: Session = Depends(get_db)):
    return db.query(Producto).all()

@router.get("/{producto_id}", response_model=ProductoResponse)
def get_producto_by_id(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()

    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )

    return producto

@router.get("/categoria/{categoria_id}", response_model=list[ProductoResponse])
def get_productos_by_categoria(categoria_id: int, db: Session = Depends(get_db)):
    return db.query(Producto).filter(Producto.id_categoria == categoria_id).all()

@router.post("/", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
def create_producto(data: ProductoCreate, db: Session = Depends(get_db)):
    categoria = db.query(Categoria).filter(Categoria.id == data.id_categoria).first()

    if not categoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada"
        )

    new_producto = Producto(**data.model_dump())
    db.add(new_producto)
    db.commit()
    db.refresh(new_producto)

    return new_producto