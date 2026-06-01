from pydantic_settings import BaseSettings
from pydantic import field_validator

class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    MODEL_NAME: str = "llama-3.1-8b-instant"   # Free & fast on Groq
    GAP_THRESHOLD: float = 0.62

    @field_validator('GROQ_API_KEY')
    @classmethod
    def key_must_not_be_empty(cls, v):
        if not v or not str(v).strip():
            raise ValueError(
                'GROQ_API_KEY must be set in ai-engine/.env — get a free key at https://console.groq.com'
            )
        return str(v).strip()

    class Config:
        env_file = ".env"

settings = Settings()
