from sqlalchemy import Column, Integer, String, ForeignKey
from app.core.database import Base

class PokemonMovimiento(Base):
    __tablename__ = "pokemon_movimientos"

    id_pokemon = Column(Integer, ForeignKey("pokemon.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    id_movimiento = Column(Integer, ForeignKey("movimientos.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    metodo_aprendizaje = Column(String(100), primary_key=True)
    nivel_aprendizaje = Column(Integer, nullable=True)