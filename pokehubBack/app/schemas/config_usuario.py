from pydantic import BaseModel


class ConfigUsuarioBase(BaseModel):
    id_usuario: int
    idioma: str = "esp"
    musica: bool = True
    sonido: bool = True


class ConfigUsuarioCreate(ConfigUsuarioBase):
    pass


class ConfigUsuarioResponse(ConfigUsuarioBase):
    class Config:
        from_attributes = True
