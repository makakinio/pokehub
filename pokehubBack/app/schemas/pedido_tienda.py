from decimal import Decimal
from pydantic import BaseModel

class PedidoTiendaBase(BaseModel):
    id_usuario: int
    total: Decimal
    estado: str

class PedidoTiendaCreate(PedidoTiendaBase):
    pass

class PedidoTiendaResponse(PedidoTiendaBase):
    id: int

    class Config:
        from_attributes = True