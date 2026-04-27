from pydantic import BaseModel

class DetallePedidoBase(BaseModel):
    id_pedido: int
    id_producto: int
    cantidad: int

class DetallePedidoCreate(DetallePedidoBase):
    pass

class DetallePedidoResponse(DetallePedidoBase):
    class Config:
        from_attributes = True