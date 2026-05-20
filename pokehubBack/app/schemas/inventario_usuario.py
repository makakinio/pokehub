from pydantic import BaseModel

class InventarioUsuarioBase(BaseModel):
    id_usuario: int
    id_producto: int
    cantidad: int = 0

class InventarioUsuarioCreate(InventarioUsuarioBase):
    pass

class InventarioUsuarioUpdate(BaseModel):
    cantidad: int

class InventarioUsuarioResponse(InventarioUsuarioBase):
    class Config:
        from_attributes = True