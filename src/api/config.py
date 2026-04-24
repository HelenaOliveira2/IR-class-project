# config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    environment: str = "development"
    db_file: str = "publications.db"
    log_level: str = "INFO"
    scraper_max_items: int = 10

    # Lê as variáveis do ficheiro .env
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

# Instância global para usares em todo o projeto
settings = Settings()

#No teu api.py ou main.py, em vez de DB_FILE = 'publications.db', passas a fazer from config import settings e usas settings.db_file