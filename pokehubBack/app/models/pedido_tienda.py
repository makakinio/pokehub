from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from app.core.database import Base

class PedidoTienda(Base):
    __tablename__ = "pedidos_tienda"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    total = Column(Numeric(10, 2), nullable=False)
    estado = Column(String(50), nullable=False)