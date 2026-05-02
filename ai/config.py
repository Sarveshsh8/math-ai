from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_id: str = "Qwen/Qwen2.5-Math-1.5B-Instruct"
    backend_host: str = "127.0.0.1"
    backend_port: int = 8000
    allowed_origins: str = "http://localhost:5173"
    internal_api_token: str = ""
    max_problem_chars: int = 500
    max_answer_chars: int = 500
    max_weak_areas: int = 5
    max_llm_concurrency: int = 2
    rate_limit_per_minute: int = 30

    class Config:
        env_file = "../.env"
        extra = "ignore"


settings = Settings()
