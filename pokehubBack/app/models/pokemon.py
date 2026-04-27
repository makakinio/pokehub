from sqlalchemy import Column, Integer, String
from app.core.database import Base

class Pokemon(Base):
    __tablename__ = "pokemon"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(255), nullable=True)
    imagen = Column(String(255), nullable=True)
    rareza = Column(String(50), nullable=True)
    nivel_minimo = Column(Integer, nullable=False, default=1)
    hp_base = Column(Integer, nullable=False)
    ataque_base = Column(Integer, nullable=False)
    defensa_base = Column(Integer, nullable=False)
    ataque_esp_base = Column(Integer, nullable=False)
    defensa_esp_base = Column(Integer, nullable=False)
    velocidad_base = Column(Integer, nullable=False)
    tipo1 = Column(String(50), nullable=False)
    tipo2 = Column(String(50), nullable=True)