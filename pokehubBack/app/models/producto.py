from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from app.core.database import Base

class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_categoria = Column(Integer, ForeignKey("categoria.id", onupdate="CASCADE"), nullable=False)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(255), nullable=True)
    precio = Column(Numeric(10, 2), nullable=False)
    imagen = Column(String(255), nullable=True)