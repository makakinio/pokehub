from sqlalchemy import Column, Integer, String, Numeric, Boolean
from app.core.database import Base

class User(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(50), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    clave = Column(String(255), nullable=False)
    avatar = Column(String(255), nullable=True)
    admin = Column(Integer, nullable=False, default=0)
    dinero = Column(Numeric(10, 2), nullable=False, default=10.00)
    estado = Column(String(50), nullable=False, default="activo")
    verificado = Column(Boolean, nullable=False, default=False)