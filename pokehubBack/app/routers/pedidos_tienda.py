from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.pedido_tienda import PedidoTienda
from app.schemas.pedido_tienda import PedidoTiendaCreate, PedidoTiendaResponse

router = APIRouter(prefix="/pedidos-tienda", tags=["pedidos_tienda"])

@router.get("/", response_model=list[PedidoTiendaResponse])
def get_pedidos(db: Session = Depends(get_db)):
    return db.query(PedidoTienda).all()

@router.get("/{pedido_id}", response_model=PedidoTiendaResponse)
def get_pedido_by_id(pedido_id: int, db: Session = Depends(get_db)):
    pedido = db.query(PedidoTienda).filter(PedidoTienda.id == pedido_id).first()

    if not pedido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido no encontrado"
        )

    return pedido

@router.get("/usuario/{user_id}", response_model=list[PedidoTiendaResponse])
def get_pedidos_by_user(user_id: int, db: Session = Depends(get_db)):
    return db.query(PedidoTienda).filter(
        PedidoTienda.id_usuario == user_id
    ).all()

@router.post("/", response_model=PedidoTiendaResponse, status_code=status.HTTP_201_CREATED)
def create_pedido(data: PedidoTiendaCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.id_usuario).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    new_pedido = PedidoTienda(**data.model_dump())
    db.add(new_pedido)
    db.commit()
    db.refresh(new_pedido)

    return new_pedido