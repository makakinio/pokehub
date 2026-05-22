import random
from decimal import Decimal
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel as PydanticBaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash, verify_password, decode_access_token
from app.models.user import User
from app.models.config_usuario import ConfigUsuario
from app.models.producto import Producto
from app.models.inventario_usuario import InventarioUsuario
from app.schemas.user import UserCreate, UserResponse
from app.services.mail_service import send_otp_email

# ── Almacén en memoria de códigos OTP ──────────────────────
# Estructura: { email: { code, tipo, expires, created_at } }
_otps: dict[str, dict] = {}
OTP_EXPIRE_MINUTES   = 10   # el código expira a los 10 minutos
OTP_COOLDOWN_SECONDS = 60   # evita flooding: 1 envío por minuto por email


def _generate_otp() -> str:
    """Genera un código de 5 dígitos con cero a la izquierda si procede."""
    return f"{random.randint(0, 99999):05d}"


def _store_otp(email: str, tipo: str) -> str:
    """Genera, guarda y devuelve el código OTP para el email dado."""
    existing = _otps.get(email)
    if existing:
        elapsed = (datetime.utcnow() - existing["created_at"]).total_seconds()
        if elapsed < OTP_COOLDOWN_SECONDS:
            wait = int(OTP_COOLDOWN_SECONDS - elapsed)
            raise HTTPException(
                status_code=429,
                detail=f"Espera {wait} segundos antes de solicitar otro código",
            )
    code = _generate_otp()
    _otps[email] = {
        "code":       code,
        "tipo":       tipo,
        "expires":    datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES),
        "created_at": datetime.utcnow(),
    }
    return code


def _check_otp(email: str, code: str, tipo: str) -> None:
    """Valida el OTP. Lo elimina al acertar. Lanza HTTPException si falla."""
    otp = _otps.get(email)
    if not otp or otp.get("tipo") != tipo:
        raise HTTPException(
            status_code=400,
            detail="No se encontró un código válido. Solicita uno nuevo",
        )
    if datetime.utcnow() > otp["expires"]:
        _otps.pop(email, None)
        raise HTTPException(
            status_code=400,
            detail="El código ha expirado. Solicita uno nuevo",
        )
    if otp["code"] != code:
        raise HTTPException(status_code=400, detail="Código incorrecto")
    _otps.pop(email, None)


class DineroUpdate(PydanticBaseModel):
    dinero: Decimal

class PerfilUpdate(PydanticBaseModel):
    nombre: str

class PasswordUpdate(PydanticBaseModel):
    password_actual: str
    password_nuevo: str

class OTPInput(PydanticBaseModel):
    codigo: str

class ResetPorOTPInput(PydanticBaseModel):
    codigo: str
    password_nuevo: str

class EnviarResetPublicoInput(PydanticBaseModel):
    email: str

class ResetPublicoInput(PydanticBaseModel):
    email: str
    codigo: str
    password_nuevo: str

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está en uso")

    new_user = User(
        nombre=user_in.nombre,
        email=user_in.email,
        clave=get_password_hash(user_in.clave),
        avatar=user_in.avatar,
        admin=0,                  # siempre 0 al registrarse
        dinero=Decimal("10.00"),  # 10 monedas de inicio
        estado="activo",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Crear configuración por defecto automáticamente
    config = ConfigUsuario(
        id_usuario=new_user.id,
        idioma="esp",
        musica=True,
        sonido=True,
    )
    db.add(config)
    db.commit()

    # Dar 10 Pokéballs de inicio (busca el producto por nombre)
    pokeball = db.query(Producto).filter(
        Producto.nombre.ilike("%pokeball%")
    ).first()
    if pokeball:
        inventario_inicial = InventarioUsuario(
            id_usuario=new_user.id,
            id_producto=pokeball.id,
            cantidad=10,
        )
        db.add(inventario_inicial)
        db.commit()

    return new_user


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.clave):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.estado == "baneado":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta ha sido suspendida. Contacta con el administrador.",
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
def get_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return user


@router.patch("/me/dinero", response_model=UserResponse)
def update_dinero(
    data: DineroUpdate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if data.dinero < 0:
        raise HTTPException(status_code=400, detail="El saldo no puede ser negativo")

    user.dinero = data.dinero
    db.commit()
    db.refresh(user)
    return user


def _get_user_from_token(token: str, db: Session):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.patch("/me/perfil", response_model=UserResponse)
def update_perfil(
    data: PerfilUpdate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    user = _get_user_from_token(token, db)
    if not data.nombre.strip():
        raise HTTPException(status_code=400, detail="El nombre no puede estar vacío")
    user.nombre = data.nombre.strip()
    db.commit()
    db.refresh(user)
    return user


@router.patch("/me/password")
def update_password(
    data: PasswordUpdate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    user = _get_user_from_token(token, db)
    if not verify_password(data.password_actual, user.clave):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
    if len(data.password_nuevo) < 6:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 6 caracteres")
    user.clave = get_password_hash(data.password_nuevo)
    db.commit()
    return {"detail": "Contraseña actualizada correctamente"}


# ── Verificación de email ──────────────────────────────────

@router.post("/enviar-verificacion")
async def enviar_verificacion(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """Envía un código OTP al email del usuario autenticado para verificar su cuenta."""
    user = _get_user_from_token(token, db)
    if user.verificado:
        raise HTTPException(status_code=400, detail="Tu email ya está verificado")
    code = _store_otp(user.email, "verificacion")
    try:
        await send_otp_email(user.email, user.nombre, code, "verificacion")
    except Exception:
        _otps.pop(user.email, None)
        raise HTTPException(status_code=500, detail="Error al enviar el email. Revisa la configuración SMTP")
    return {"detail": "Código enviado correctamente"}


@router.post("/verificar-email", response_model=UserResponse)
def verificar_email(
    data: OTPInput,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """Confirma el código OTP y marca el usuario como verificado."""
    user = _get_user_from_token(token, db)
    if user.verificado:
        raise HTTPException(status_code=400, detail="Tu email ya está verificado")
    _check_otp(user.email, data.codigo, "verificacion")
    user.verificado = True
    db.commit()
    db.refresh(user)
    return user


# ── Restablecer contraseña por email ──────────────────────

@router.post("/enviar-reset")
async def enviar_reset(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """Envía un código OTP al email del usuario autenticado para restablecer su contraseña."""
    user = _get_user_from_token(token, db)
    code = _store_otp(user.email, "reset")
    try:
        await send_otp_email(user.email, user.nombre, code, "reset")
    except Exception:
        _otps.pop(user.email, None)
        raise HTTPException(status_code=500, detail="Error al enviar el email. Revisa la configuración SMTP")
    return {"detail": "Código enviado correctamente"}


@router.post("/reset-password-otp")
def reset_password_otp(
    data: ResetPorOTPInput,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """Verifica el código OTP y establece la nueva contraseña sin necesitar la actual."""
    user = _get_user_from_token(token, db)
    _check_otp(user.email, data.codigo, "reset")
    if len(data.password_nuevo) < 6:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 6 caracteres")
    user.clave = get_password_hash(data.password_nuevo)
    db.commit()
    return {"detail": "Contraseña restablecida correctamente"}


# ── Recuperación de contraseña pública (sin token — desde login) ───

@router.post("/enviar-reset-publico")
async def enviar_reset_publico(
    data: EnviarResetPublicoInput,
    db: Session = Depends(get_db),
):
    """Envía un OTP al email indicado para recuperar la contraseña (sin autenticación).
    Siempre devuelve éxito para no revelar si el email existe.
    """
    user = db.query(User).filter(User.email == data.email).first()
    if user:
        code = _store_otp(data.email, "reset_publico")
        try:
            await send_otp_email(data.email, user.nombre, code, "reset")
        except Exception:
            _otps.pop(data.email, None)
            raise HTTPException(status_code=500, detail="Error al enviar el email. Revisa la configuración SMTP")
    return {"detail": "Si el email está registrado, recibirás un código en breve"}


@router.post("/reset-password-publico")
def reset_password_publico(
    data: ResetPublicoInput,
    db: Session = Depends(get_db),
):
    """Verifica el OTP enviado públicamente y establece la nueva contraseña."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Código incorrecto o expirado")
    _check_otp(data.email, data.codigo, "reset_publico")
    if len(data.password_nuevo) < 6:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 6 caracteres")
    user.clave = get_password_hash(data.password_nuevo)
    db.commit()
    return {"detail": "Contraseña restablecida correctamente"}
