from sqlalchemy import Column, Integer, ForeignKey
from app.core.database import Base

class DetallePedido(Base):
    __tablename__ = "detalle_pedido"

    id_pedido = Column(Integer, ForeignKey("pedidos_tienda.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    id_producto = Column(Integer, ForeignKey("productos.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    cantidad = Column(Integer, nullable=False)