from fastapi import APIRouter
from app.services.mail_service import send_welcome_email

router = APIRouter(prefix="/api/mail", tags=["mail"])

@router.get("/test")
async def test_mail():
    await send_welcome_email("tu_correo@ejemplo.com", "Chang Ye")
    return {"message": "Correo enviado"}