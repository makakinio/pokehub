from sqlalchemy import Column, Integer, ForeignKey
from app.core.database import Base

class MovimientosPokemonUsuario(Base):
    __tablename__ = "movimientos_pokemon_usuario"

    id_pokemon_usuario = Column(Integer, ForeignKey("pokemon_usuarios.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    id_movimiento_1 = Column(Integer, ForeignKey("movimientos.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)
    id_movimiento_2 = Column(Integer, ForeignKey("movimientos.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)
    id_movimiento_3 = Column(Integer, ForeignKey("movimientos.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)
    id_movimiento_4 = Column(Integer, ForeignKey("movimientos.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)