from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_id: str = "Qwen/Qwen2.5-Math-1.5B-Instruct"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    allowed_origins: str = "http://localhost:5173"

    class Config:
        env_file = "../.env"
        extra = "ignore"


settings = Settings()
