import os
import sys

# Forçar o Python a reconhecer a raiz do projeto (IR-class-project)
root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if root not in sys.path:
    sys.path.insert(0, root)

# Imports corrigidos com o caminho completo
from src.scraper.scraper import UMinhoDSpace8Scraper
from src.scraper.database_setup import setup_database
from src.api.config import settings
from src.api.logger import logger

def main():
    # Example collection:  https://repositorium.uminho.pt/collections/690f7814-a67b-4f27-8fff-6b33581d1a91/search
    # https://repositorium.uminho.pt/handle/1822/21292
    repo_url = f"https://repositorium.uminho.pt/handle/"
    collection = "1822/21293"
    base_url = f"{repo_url}/{collection}"

    # Create an instance of the Scraper class
    # The scraper will automatically detect Chrome in default locations
    # If you want to use a portable Chrome, pass the path as portable_chrome_path parameter:
    # scraper_instance = scraper.UMinhoDSpace8Scraper(base_url, max_items=2, portable_chrome_path=r"D:\Portable\chrome\chrome.exe")
    # --- USO DO SETTINGS ---
    # Substituímos o '20' fixo pelo valor que está no teu config/ .env
    scraper_instance = UMinhoDSpace8Scraper(
        base_url, 
        max_items=settings.scraper_max_items 
    )
    
    final_results = scraper_instance.scrape()

    logger.info(f"Scraping completed. Total papers scraped: {len(final_results)}")

    # 2. Migrar diretamente da memória para a Base de Dados (REQ-B09)
    logger.info("--- Verificando e Populando Infraestrutura ---")

    setup_database(data_list=final_results, db_file=settings.db_file) 
    
    logger.info("Base de dados pronta e populada.\n")
if __name__ == "__main__":
    main()
