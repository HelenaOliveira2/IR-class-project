# config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    environment: str = "development"
    db_file: str = "publications.db"
    log_level: str = "INFO"
    scraper_max_items: int = 20

    # Lê as variáveis do ficheiro .env
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

# Instância global para usares em todo o projeto
settings = Settings()

print(f"Configurações carregadas: Ambiente={settings.environment}, DB={settings.db_file}")