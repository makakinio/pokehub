from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class MensajeChat(Base):
    __tablename__ = "mensajes_chat"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    mensaje    = Column(Text, nullable=False)
    fecha      = Column(DateTime, server_default=func.now())

    # Relación para obtener nombre y avatar del autor sin query extra
    usuario = relationship("User", lazy="joined")
