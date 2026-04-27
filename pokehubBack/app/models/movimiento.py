from sqlalchemy import Column, Integer, String
from app.core.database import Base

class Movimiento(Base):
    __tablename__ = "movimientos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    tipo = Column(String(30), nullable=False)
    categoria = Column(String(50), nullable=False)
    efecto = Column(String(50), nullable=True)
    danio = Column(Integer, nullable=True)
    porcentaje = Column(Integer, nullable=True)
    estadistica_afectada = Column(String(50), nullable=True)
    precision_mov = Column(Integer, nullable=False)
    pp = Column(Integer, nullable=False)
    descripcion = Column(String(255), nullable=True)