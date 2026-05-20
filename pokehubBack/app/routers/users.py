from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    return user


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está en uso"
        )

    from app.core.security import get_password_hash
    from decimal import Decimal

    new_user = User(
        nombre=user_in.nombre,
        email=user_in.email,
        clave=get_password_hash(user_in.clave),
        avatar=user_in.avatar,
        admin=0,
        dinero=Decimal("10.00"),
        estado="activo",
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if data.estado is not None:
        if data.estado not in ("activo", "baneado"):
            raise HTTPException(status_code=400, detail="Estado inválido (activo | baneado)")
        user.estado = data.estado
    if data.admin is not None:
        if data.admin not in (0, 1):
            raise HTTPException(status_code=400, detail="admin debe ser 0 o 1")
        user.admin = data.admin
    if data.dinero is not None:
        if data.dinero < 0:
            raise HTTPException(status_code=400, detail="El saldo no puede ser negativo")
        user.dinero = data.dinero
    if data.verificado is not None:
        user.verificado = data.verificado
    db.commit()
    db.refresh(user)
    return user
