from pydantic_settings import BaseSettings
from pydantic import field_validator

class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    MODEL_NAME: str = "llama-3.1-8b-instant"   # Free & fast on Groq
    GAP_THRESHOLD: float = 0.62

    @field_validator('GROQ_API_KEY')
    @classmethod
    def key_must_not_be_empty(cls, v):
        return v

    class Config:
        env_file = ".env"

settings = Settings()
