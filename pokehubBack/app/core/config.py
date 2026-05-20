from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    FRONTEND_URL: str = "http://localhost:5173"

    # Email (fastapi-mail)
    MAIL_USERNAME:   str  = ""
    MAIL_PASSWORD:   str  = ""
    MAIL_FROM:       str  = ""
    MAIL_PORT:       int  = 587
    MAIL_SERVER:     str  = "smtp.gmail.com"
    MAIL_STARTTLS:   bool = True
    MAIL_SSL_TLS:    bool = False
    MAIL_FROM_NAME:  str  = "PokéHub"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()