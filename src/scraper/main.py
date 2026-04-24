import json
import scraper  # Em vez de import src.scraper.scraper
from database_setup import setup_database

def main():
    # Example collection:  https://repositorium.uminho.pt/collections/690f7814-a67b-4f27-8fff-6b33581d1a91/search
    # https://repositorium.uminho.pt/handle/1822/21293
    repo_url = f"https://repositorium.uminho.pt/handle/"
    collection = "1822/21293"
    base_url = f"{repo_url}/{collection}"

    # Create an instance of the Scraper class
    # The scraper will automatically detect Chrome in default locations
    # If you want to use a portable Chrome, pass the path as portable_chrome_path parameter:
    # scraper_instance = scraper.UMinhoDSpace8Scraper(base_url, max_items=2, portable_chrome_path=r"D:\Portable\chrome\chrome.exe")
    scraper_instance = scraper.UMinhoDSpace8Scraper(base_url, max_items=20)
    final_results = scraper_instance.scrape()

    print(f"Scraping completed. Total papers scraped: {len(final_results)}")

    # Save results to a JSON file
    with open('src/scraper/scraper_results.json', 'w', encoding='utf-8') as f:
        json.dump(final_results, f, ensure_ascii=False, indent=4)

    print(f"Done! {len(final_results)} items saved.")

    # REQ-B09: Garantir que a base de dados e as tabelas existem antes de tudo
    print("--- Verificando Infraestrutura ---")
    setup_database() 
    print("Base de dados pronta para receber dados.\n")

if __name__ == "__main__":
    main()
