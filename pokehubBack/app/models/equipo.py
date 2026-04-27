from sqlalchemy import Column, Integer, String, Date, ForeignKey
from app.core.database import Base

class Equipo(Base):
    __tablename__ = "equipos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    nombre = Column(String(100), nullable=False)
    fecha_creacion = Column(Date, nullable=False)

    id_pokemon_usuario_01 = Column(Integer, ForeignKey("pokemon_usuarios.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)
    id_pokemon_usuario_02 = Column(Integer, ForeignKey("pokemon_usuarios.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)
    id_pokemon_usuario_03 = Column(Integer, ForeignKey("pokemon_usuarios.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)
    id_pokemon_usuario_04 = Column(Integer, ForeignKey("pokemon_usuarios.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)
    id_pokemon_usuario_05 = Column(Integer, ForeignKey("pokemon_usuarios.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)
    id_pokemon_usuario_06 = Column(Integer, ForeignKey("pokemon_usuarios.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)