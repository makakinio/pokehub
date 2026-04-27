from sqlalchemy import Column, Integer, ForeignKey
from app.core.database import Base

class InventarioUsuario(Base):
    __tablename__ = "inventario_usuario"

    id_usuario = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    id_producto = Column(Integer, ForeignKey("productos.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    cantidad = Column(Integer, nullable=False, default=0)