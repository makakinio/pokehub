from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.core.database import Base

class PokemonUsuario(Base):
    __tablename__ = "pokemon_usuarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    id_pokemon = Column(Integer, ForeignKey("pokemon.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    apodo = Column(String(100), nullable=True)
    nivel = Column(Integer, nullable=False, default=1)
    experiencia = Column(Integer, nullable=False, default=0)
    hp = Column(Integer, nullable=False)
    ataque = Column(Integer, nullable=False)
    defensa = Column(Integer, nullable=False)
    ataque_especial = Column(Integer, nullable=False)
    defensa_especial = Column(Integer, nullable=False)
    velocidad = Column(Integer, nullable=False)
    shiny = Column(Boolean, nullable=False, default=False)