from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

async def send_welcome_email(email_to: str, nick: str):
    message = MessageSchema(
        subject="Bienvenido a PokeHub",
        recipients=[email_to],
        body=f"<h1>Bienvenido {nick}</h1><p>Tu cuenta se ha creado correctamente.</p>",
        subtype=MessageType.html,
    )

    fm = FastMail(conf)
    await fm.send_message(message)