from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.producto import Producto
from app.models.inventario_usuario import InventarioUsuario
from app.schemas.inventario_usuario import (
    InventarioUsuarioCreate,
    InventarioUsuarioResponse,
)

router = APIRouter(prefix="/inventario-usuario", tags=["inventario_usuario"])

@router.get("/", response_model=list[InventarioUsuarioResponse])
def get_inventario(db: Session = Depends(get_db)):
    return db.query(InventarioUsuario).all()

@router.get("/usuario/{user_id}", response_model=list[InventarioUsuarioResponse])
def get_inventario_by_user(user_id: int, db: Session = Depends(get_db)):
    return db.query(InventarioUsuario).filter(
        InventarioUsuario.id_usuario == user_id
    ).all()

@router.post("/", response_model=InventarioUsuarioResponse, status_code=status.HTTP_201_CREATED)
def create_inventario_item(data: InventarioUsuarioCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.id_usuario).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    producto = db.query(Producto).filter(Producto.id == data.id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    existing = db.query(InventarioUsuario).filter(
        InventarioUsuario.id_usuario == data.id_usuario,
        InventarioUsuario.id_producto == data.id_producto
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Ese producto ya existe en el inventario del usuario"
        )

    new_item = InventarioUsuario(**data.model_dump())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item