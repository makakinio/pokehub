from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class MensajeChatResponse(BaseModel):
    id:         int
    id_usuario: int
    nombre:     str
    avatar:     Optional[str] = None
    mensaje:    str
    fecha:      datetime

    class Config:
        from_attributes = True
