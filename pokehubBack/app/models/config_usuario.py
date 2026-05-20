from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.core.database import Base

class ConfigUsuario(Base):
    __tablename__ = "config_usuarios"

    id_usuario = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    idioma = Column(String(50), nullable=False, default="esp")
    musica = Column(Boolean, nullable=False, default=True)
    sonido = Column(Boolean, nullable=False, default=True)