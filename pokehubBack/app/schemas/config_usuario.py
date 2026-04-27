from pydantic import BaseModel

class ConfigUsuarioBase(BaseModel):
    idusuario: int
    idioma: str = "esp"
    tema: str
    musica: bool = True
    sonido: bool = True

class ConfigUsuarioCreate(ConfigUsuarioBase):
    pass

class ConfigUsuarioResponse(ConfigUsuarioBase):
    class Config:
        from_attributes = True