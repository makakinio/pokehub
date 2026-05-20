from decimal import Decimal
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel as PydanticBaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash, verify_password, decode_access_token
from app.models.user import User
from app.models.config_usuario import ConfigUsuario
from app.models.producto import Producto
from app.models.inventario_usuario import InventarioUsuario
from app.schemas.user import UserCreate, UserResponse


class DineroUpdate(PydanticBaseModel):
    dinero: Decimal

class PerfilUpdate(PydanticBaseModel):
    nombre: str

class PasswordUpdate(PydanticBaseModel):
    password_actual: str
    password_nuevo: str

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está en uso")

    new_user = User(
        nombre=user_in.nombre,
        email=user_in.email,
        clave=get_password_hash(user_in.clave),
        avatar=user_in.avatar,
        admin=0,                  # siempre 0 al registrarse
        dinero=Decimal("10.00"),  # 10 monedas de inicio
        estado="activo",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Crear configuración por defecto automáticamente
    config = ConfigUsuario(
        id_usuario=new_user.id,
        idioma="esp",
        musica=True,
        sonido=True,
    )
    db.add(config)
    db.commit()

    # Dar 10 Pokéballs de inicio (busca el producto por nombre)
    pokeball = db.query(Producto).filter(
        Producto.nombre.ilike("%pokeball%")
    ).first()
    if pokeball:
        inventario_inicial = InventarioUsuario(
            id_usuario=new_user.id,
            id_producto=pokeball.id,
            cantidad=10,
        )
        db.add(inventario_inicial)
        db.commit()

    return new_user


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.clave):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.estado == "baneado":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta ha sido suspendida. Contacta con el administrador.",
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
def get_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return user


@router.patch("/me/dinero", response_model=UserResponse)
def update_dinero(
    data: DineroUpdate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if data.dinero < 0:
        raise HTTPException(status_code=400, detail="El saldo no puede ser negativo")

    user.dinero = data.dinero
    db.commit()
    db.refresh(user)
    return user


def _get_user_from_token(token: str, db: Session):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.patch("/me/perfil", response_model=UserResponse)
def update_perfil(
    data: PerfilUpdate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    user = _get_user_from_token(token, db)
    if not data.nombre.strip():
        raise HTTPException(status_code=400, detail="El nombre no puede estar vacío")
    user.nombre = data.nombre.strip()
    db.commit()
    db.refresh(user)
    return user


@router.patch("/me/password")
def update_password(
    data: PasswordUpdate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    user = _get_user_from_token(token, db)
    if not verify_password(data.password_actual, user.clave):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
    if len(data.password_nuevo) < 6:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 6 caracteres")
    user.clave = get_password_hash(data.password_nuevo)
    db.commit()
    return {"detail": "Contraseña actualizada correctamente"}
