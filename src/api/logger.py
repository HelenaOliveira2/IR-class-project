# logger.py
import logging
from api.config import settings

# Configuração básica de Logging
logging.basicConfig(
    level=settings.log_level, # Usa o nível definido no .env
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.FileHandler("system.log", encoding='utf-8'), # Guarda no ficheiro
        logging.StreamHandler()                              # Mostra no terminal
    ]
)

# Cria um logger que podes importar noutros ficheiros
logger = logging.getLogger("UMinhoScraper")
#No teu scraper.py, em vez de print(f"Loading collection..."), fazes from logger import logger e usas logger.info("Loading collection...") ou logger.error("Falha ao carregar a página!")