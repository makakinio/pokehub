from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.pedido_tienda import PedidoTienda
from app.models.producto import Producto
from app.models.detalle_pedido import DetallePedido
from app.schemas.detalle_pedido import DetallePedidoCreate, DetallePedidoResponse

router = APIRouter(prefix="/detalle-pedido", tags=["detalle_pedido"])

@router.get("/", response_model=list[DetallePedidoResponse])
def get_detalles(db: Session = Depends(get_db)):
    return db.query(DetallePedido).all()

@router.get("/pedido/{pedido_id}", response_model=list[DetallePedidoResponse])
def get_detalles_by_pedido(pedido_id: int, db: Session = Depends(get_db)):
    return db.query(DetallePedido).filter(
        DetallePedido.id_pedido == pedido_id
    ).all()

@router.post("/", response_model=DetallePedidoResponse, status_code=status.HTTP_201_CREATED)
def create_detalle(data: DetallePedidoCreate, db: Session = Depends(get_db)):
    pedido = db.query(PedidoTienda).filter(PedidoTienda.id == data.id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    producto = db.query(Producto).filter(Producto.id == data.id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    existing = db.query(DetallePedido).filter(
        DetallePedido.id_pedido == data.id_pedido,
        DetallePedido.id_producto == data.id_producto
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Ese producto ya está en el detalle del pedido"
        )

    new_detalle = DetallePedido(**data.model_dump())
    db.add(new_detalle)
    db.commit()
    db.refresh(new_detalle)

    return new_detalle