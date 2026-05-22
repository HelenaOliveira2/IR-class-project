# logger.py
import logging
from src.api.config import settings

# Configuração básica de Logging
logging.basicConfig(
    level=settings.log_level, 
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.FileHandler("system.log", encoding='utf-8'), # Guarda no ficheiro
        logging.StreamHandler()                              # Mostra no terminal
    ]
)

logger = logging.getLogger("UMinhoScraper")

logger.info("Sistema de Logging inicializado com sucesso!")