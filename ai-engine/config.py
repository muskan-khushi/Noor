from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    MODEL_NAME: str = "llama-3.1-8b-instant"   # Free & fast on Groq
    GAP_THRESHOLD: float = 0.62

    class Config:
        env_file = ".env"

settings = Settings()
