from typing import List
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.mensaje_chat import MensajeChat
from app.models.user import User
from app.schemas.mensaje_chat import MensajeChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])


# ── Helper de serialización ────────────────────────────────
def _serializar(m: MensajeChat) -> dict:
    return {
        "id":         m.id,
        "id_usuario": m.id_usuario,
        "nombre":     m.usuario.nombre if m.usuario else "Desconocido",
        "avatar":     m.usuario.avatar  if m.usuario else None,
        "mensaje":    m.mensaje,
        "fecha":      m.fecha.isoformat(),
    }


# ── Helper para obtener usuario desde el token ─────────────
def _get_usuario(authorization: str, db: Session) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    token = authorization.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    usuario = db.query(User).filter(User.id == int(payload.get("sub", 0))).first()
    if not usuario or usuario.estado == "baneado":
        raise HTTPException(status_code=403, detail="Acceso denegado")
    return usuario


# ── GET /chat/historial?limite=50&desde_id=0 ──────────────
@router.get("/historial", response_model=List[MensajeChatResponse])
def get_historial(
    limite: int = 50,
    desde_id: int = 0,
    db: Session = Depends(get_db),
):
    """
    Devuelve mensajes. Si desde_id > 0 solo devuelve los mensajes
    con id mayor a desde_id (útil para el polling incremental).
    """
    q = db.query(MensajeChat)
    if desde_id > 0:
        q = q.filter(MensajeChat.id > desde_id)
    mensajes = q.order_by(MensajeChat.fecha.desc()).limit(limite).all()
    mensajes.reverse()
    return [_serializar(m) for m in mensajes]


# ── POST /chat/mensaje ─────────────────────────────────────
class NuevoMensaje(BaseModel):
    mensaje: str

@router.post("/mensaje", response_model=MensajeChatResponse)
def enviar_mensaje(
    body: NuevoMensaje,
    authorization: str = Header(...),
    db: Session = Depends(get_db),
):
    """Guarda un mensaje del usuario autenticado y lo devuelve."""
    usuario = _get_usuario(authorization, db)

    texto = body.mensaje.strip()
    if not texto or len(texto) > 500:
        raise HTTPException(status_code=422, detail="Mensaje inválido")

    nuevo = MensajeChat(id_usuario=usuario.id, mensaje=texto)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return _serializar(nuevo)
