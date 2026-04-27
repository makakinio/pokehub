from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.config_usuario import ConfigUsuario
from app.schemas.config_usuario import (
    ConfigUsuarioCreate,
    ConfigUsuarioResponse,
)

router = APIRouter(prefix="/config-usuarios", tags=["config_usuarios"])

@router.get("/", response_model=list[ConfigUsuarioResponse])
def get_configs(db: Session = Depends(get_db)):
    return db.query(ConfigUsuario).all()

@router.get("/{user_id}", response_model=ConfigUsuarioResponse)
def get_config_by_user_id(user_id: int, db: Session = Depends(get_db)):
    config = db.query(ConfigUsuario).filter(
        ConfigUsuario.idusuario == user_id
    ).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuración no encontrada para ese usuario"
        )

    return config

@router.post("/", response_model=ConfigUsuarioResponse, status_code=status.HTTP_201_CREATED)
def create_config(data: ConfigUsuarioCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.idusuario).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    existing = db.query(ConfigUsuario).filter(
        ConfigUsuario.idusuario == data.idusuario
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Ese usuario ya tiene configuración creada"
        )

    new_config = ConfigUsuario(**data.model_dump())
    db.add(new_config)
    db.commit()
    db.refresh(new_config)

    return new_config