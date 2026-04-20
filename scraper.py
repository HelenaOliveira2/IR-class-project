import time
import os
import platform
import shutil
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.chrome.service import Service



def is_valid_executable(path):
    """
    Check if a path points to a valid executable file.

    Args:
        path (str): Path to check.

    Returns:
        bool: True if the path is a valid executable file, False otherwise.
    """
    if not os.path.isfile(path):
        return False

    # On Windows, os.access with os.X_OK may not work reliably
    # so we just check if the file exists
    if platform.system() == "Windows":
        return True

    # On Unix-like systems, check if the file is executable
    return os.access(path, os.X_OK)


def find_chrome_executable():
    """
    Attempts to find Chrome executable in common installation locations.

    Checks for Chrome in default installation paths on both Windows and Linux.
    Returns the path to the Chrome executable if found, otherwise returns None.

    Returns:
        str or None: Path to Chrome executable if found, None otherwise.
    """
    system = platform.system()

    # List of common Chrome executable paths
    chrome_paths = []

    if system == "Windows":
        # Windows default installation paths
        possible_paths = [
            # Chrome stable
            os.path.join(os.environ.get('PROGRAMFILES', 'C:\\Program Files'), 'Google', 'Chrome', 'Application', 'chrome.exe'),
            os.path.join(os.environ.get('PROGRAMFILES(X86)', 'C:\\Program Files (x86)'), 'Google', 'Chrome', 'Application', 'chrome.exe'),
            os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Google', 'Chrome', 'Application', 'chrome.exe'),
            # Chromium
            os.path.join(os.environ.get('PROGRAMFILES', 'C:\\Program Files'), 'Chromium', 'Application', 'chrome.exe'),
            os.path.join(os.environ.get('PROGRAMFILES(X86)', 'C:\\Program Files (x86)'), 'Chromium', 'Application', 'chrome.exe'),
            os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Chromium', 'Application', 'chrome.exe'),
        ]
        chrome_paths.extend(possible_paths)

        # Also add hardcoded paths for Chrome
        chrome_paths.extend([
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Users\\%USERNAME%\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files\\Chromium\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Chromium\\Application\\chrome.exe',
            'C:\\Users\\%USERNAME%\\AppData\\Local\\Chromium\\Application\\chrome.exe',
            'D:\\Portable\\chrome\\chrome.exe'
        ])

    elif system == "Linux":
        # Linux default installation paths
        possible_paths = [
            '/usr/bin/google-chrome',
            '/usr/local/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/local/bin/google-chrome-stable',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/usr/local/bin/chromium',
            '/usr/local/bin/chromium-browser',
            '/snap/bin/chromium',
            '/opt/google/chrome/chrome',
            '/opt/google/chrome/google-chrome',
        ]
        chrome_paths.extend(possible_paths)

        # Also add hardcoded paths for Chrome inside the project directory (for portable Chrome)
        chrome_paths.extend([
            'chrome-linux64/chrome'
        ])

    elif system == "Darwin":  # macOS
        possible_paths = [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
        ]
        chrome_paths.extend(possible_paths)

    # Check each path
    for chrome_path in chrome_paths:
        if is_valid_executable(chrome_path):
            print(f"Found Chrome at: {chrome_path}")
            return chrome_path

    # If not found in common locations, check if 'google-chrome' or 'chromium' is in PATH
    for executable in ['google-chrome', 'chromium', 'chromium-browser', 'chrome']:
        chrome_in_path = shutil.which(executable)
        if chrome_in_path:
            print(f"Found Chrome in PATH: {chrome_in_path}")
            return chrome_in_path

    print("Chrome not found in default locations.")
    return None


class UMinhoDSpace8Scraper:
    def __init__(self, base_url, max_items=10):
        """
        Initialize the web scraper with Selenium WebDriver configuration.
        Args:
            base_url (str): The base URL of the website to scrape.
            max_items (int, optional): Maximum number of items to scrape. Defaults to 10.
        Note:
            Automatically detects Chrome in default installation locations on Windows and Linux.
            If you don't have Chrome, you can download a portable version from:
            https://googlechromelabs.github.io/chrome-for-testing/#stable
        """
        self.base_url = base_url
        chrome_options = Options()

        # Try to find Chrome in default installation locations
        chrome_path = find_chrome_executable()

        if chrome_path is None:
            raise FileNotFoundError("Chrome executable not found. Please install Chrome or provide a portable version.")

        chrome_options.binary_location = chrome_path
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')

        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, 10)

        # Time to wait for Angular to settle after page loads
        self.ANGULAR_SETTLE_TIME = 2.0  # seconds
        # Max items to scrape
        self.MAX_ITEMS = max_items

    def get_paper_info(self, url):
        # 1. VISITA A PÁGINA PRINCIPAL (Para o Link do PDF)
        try:
            self.driver.get(url)
            time.sleep(self.ANGULAR_SETTLE_TIME + 1)
        except Exception:
            return None

        data = { 
            "title": "N/A", "year": "N/A", "doi": "N/A", "abstract": "N/A", 
            "authors": [], "keywords": [], "affiliations": [], "document_link": "N/A" 
        }

        # REQ-B04: PDF Link
        try:
            pdf_link_elem = self.driver.find_elements(By.CSS_SELECTOR, "a[href*='/bitstream/'], a.download-button")
            if pdf_link_elem:
                data["document_link"] = pdf_link_elem[0].get_attribute("href")
        except:
            pass

        # 2. VISITA A PÁGINA /FULL (Para Metadados)
        try:
            self.driver.get(url + "/full")
            # Espera a tabela estar presente e visível
            self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "table.table-striped")))
            time.sleep(1) # Tempo extra para o Angular estabilizar
            
            targets = {
                "dc.title": "title",
                "dc.date.issued": "year",
                "dc.identifier.doi": "doi",
                "dc.contributor.author": "authors",
                "dc.description.abstract": "abstract",
                "dc.subject": "keywords",
                "dc.contributor.affiliation": "affiliations"
            }

            # RESOLUÇÃO DO STALE ELEMENT: 
            # Em vez de guardar os objetos 'row', guardamos logo o texto das células
            rows = self.driver.find_elements(By.CSS_SELECTOR, "table.table-striped tbody tr")
            
            # Criamos uma lista de tuplos (label, valor) com o texto já extraído
            extracted_rows = []
            for row in rows:
                try:
                    cols = row.find_elements(By.TAG_NAME, "td")
                    if len(cols) >= 2:
                        extracted_rows.append((cols[0].text.strip(), cols[1].text.strip()))
                except:
                    continue # Se uma linha falhar, ignora e continua

            # Agora processamos os dados extraídos sem risco de 'stale element'
            for label, val in extracted_rows:
                if label in targets:
                    key = targets[label]
                    if isinstance(data[key], list):
                        if val not in data[key]: data[key].append(val)
                    else:
                        data[key] = val

        except Exception as e:
            print(f"Erro ao processar {url}: {e}")
            return None

        return data

    def go_to_next_page(self):
        """
        Attempts to click the next page button.
        Raises NoSuchElementException if the button is missing or disabled.
        """
        # XPath looking for an active (not disabled) 'Next' button
        next_button_xpath = "//li[contains(@class, 'page-item') and not(contains(@class, 'disabled'))]/a[@aria-label='Next']"

        try:
            next_button = self.driver.find_element(By.XPATH, next_button_xpath)

            # Scroll and Click
            self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", next_button)
            next_button.click()

            # Wait for Angular to swap the content, Slightly longer wait after clicking
            time.sleep(self.ANGULAR_SETTLE_TIME + 1)
            return True

        except NoSuchElementException:
            # Re-raising the exception so the caller knows to stop the loop
            raise NoSuchElementException("Reached the last page: 'Next' button is missing or disabled.")

    def collect_all_links(self):
        """
        Iterates through pagination to collect paper URLs up to self.MAX_ITEMS.
        1. Loads the initial collection page.
        2. Extracts paper links from each item on the page.
        3. Navigates to the next page until no more pages or limit reached.
        4. Returns a list of unique paper URLs.
        """
        paper_urls = []

        # Load the initial collection page
        self.driver.get(self.base_url)

        # Wait for the Angular component that holds the item list
        print("Waiting for Angular to populate the item list...")
        self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "ds-listable-object-component-loader")))

        # Give it a moment to render the links inside those components
        time.sleep(self.ANGULAR_SETTLE_TIME)

        while True:

            # 1. Locate all paper containers on the current page
            items = self.driver.find_elements(By.TAG_NAME, "ds-listable-object-component-loader")

            # Handle cases where the page didn't load any items
            if not items:
                if not paper_urls:
                    print("Error: Could not find any item links in the list.")
                    return []
                print("No items found on this page. Stopping pagination.")
                break

            # 2. Extract links from each item
            for item in items:
                try:
                    title_elem = item.find_element(By.CSS_SELECTOR, "a.item-list-title")
                    href = title_elem.get_attribute("href")

                    if href:
                        # Clean the URL (removes ?show=full etc.)
                        clean_url = href.split('?')[0]

                        if clean_url not in paper_urls:
                            paper_urls.append(clean_url)
                            print(f"  [{len(paper_urls)}] Found: {clean_url}")

                    # Stop immediately if we hit the limit
                    if len(paper_urls) >= self.MAX_ITEMS:
                        print(f"Reached limit of {self.MAX_ITEMS} items.")
                        return paper_urls

                except NoSuchElementException:
                    continue # Skip items that don't have a title link

            # 3. Attempt to move to the next page
            try:
                self.go_to_next_page()
            except NoSuchElementException:
                print("No more pages to scrape.")
                break

        return paper_urls

    def scrape(self):
        """
        Main method to scrape the collection and extract metadata for each paper.
        """
        results = []     # To store final results
        paper_urls = []  # To store unique paper URLs

        print(f"Loading collection list: {self.base_url}") # Debug print

        try:

            # Collect paper links across paginated collection
            paper_urls = self.collect_all_links()

            print(f"Found {len(paper_urls)} papers. Extracting metadata...") # Debug print

            # Visit each paper to get the abstract and authors
            for url in paper_urls:
                # Obtém a informação (pode vir None se houver erro)
                paper_info = self.get_paper_info(url)
                
                if paper_info:
                    print(f"   [{len(results)+1}] Sucesso: {paper_info['title']}")
                    results.append(paper_info)
                else:
                    # Se deu erro, o programa continua para o próximo URL (REQ-B06)
                    print(f"   [!] A saltar documento devido a erro de carregamento.")

        finally:
            self.driver.quit()

        return results
