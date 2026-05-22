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


async def send_otp_email(email_to: str, nick: str, code: str, tipo: str):
    """Envía un código OTP de 5 cifras al usuario.

    tipo = "verificacion"  → verifica el email
    tipo = "reset"         → restablece la contraseña
    """
    if tipo == "verificacion":
        subject  = "Verifica tu email — PokéHub"
        titulo   = "Verificación de email"
        subtitulo = "Has solicitado verificar tu dirección de email en PokéHub."
        icono    = "✉️"
    else:
        subject  = "Restablece tu contraseña — PokéHub"
        titulo   = "Restablecer contraseña"
        subtitulo = "Has solicitado restablecer tu contraseña en PokéHub."
        icono    = "🔑"

    body = f"""
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0010;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0010;padding:32px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
             style="background:#0a0010;border:2px solid rgba(227,0,11,0.4);border-radius:20px;overflow:hidden;max-width:100%;">
        <!-- Cabecera roja -->
        <tr>
          <td style="background:linear-gradient(135deg,#e3000b,#9a0007);padding:28px 32px;text-align:center;">
            <div style="font-size:2rem;margin-bottom:6px;">🔴</div>
            <div style="color:#fff;font-size:1.3rem;font-weight:700;letter-spacing:0.05em;">PokéHub</div>
          </td>
        </tr>
        <!-- Cuerpo -->
        <tr>
          <td style="padding:36px 36px 28px;">
            <div style="font-size:1.5rem;margin-bottom:6px;">{icono}</div>
            <h2 style="margin:0 0 8px;color:#ffcb05;font-size:1.15rem;font-weight:700;">{titulo}</h2>
            <p style="color:rgba(255,255,255,0.65);font-size:0.9rem;line-height:1.75;margin:0 0 6px;">
              Hola, <strong style="color:#fff;">{nick}</strong>.
            </p>
            <p style="color:rgba(255,255,255,0.65);font-size:0.9rem;line-height:1.75;margin:0 0 28px;">
              {subtitulo} Introduce el siguiente código en la aplicación:
            </p>
            <!-- Código -->
            <div style="text-align:center;margin:0 0 28px;">
              <span style="display:inline-block;font-size:2.6rem;font-weight:800;
                           letter-spacing:0.35em;color:#ffcb05;
                           background:rgba(255,203,5,0.1);
                           border:2.5px solid rgba(255,203,5,0.45);
                           padding:18px 28px;border-radius:16px;
                           font-family:monospace;">
                {code}
              </span>
            </div>
            <p style="color:rgba(255,255,255,0.35);font-size:0.75rem;line-height:1.75;margin:0;text-align:center;">
              El código expira en <strong>10 minutos</strong>.<br>
              Si no has solicitado esta acción, ignora este email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:rgba(255,255,255,0.03);border-top:1px solid rgba(255,255,255,0.07);
                     padding:16px 36px;text-align:center;">
            <p style="color:rgba(255,255,255,0.2);font-size:0.68rem;margin:0;">
              © 2025 PokéHub — Este mensaje es automático, no respondas a este correo.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    """

    message = MessageSchema(
        subject=subject,
        recipients=[email_to],
        body=body,
        subtype=MessageType.html,
    )
    fm = FastMail(conf)
    await fm.send_message(message)