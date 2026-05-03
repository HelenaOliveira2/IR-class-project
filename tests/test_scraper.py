import unittest
from src.scraper.scraper import is_valid_executable

class TestScraper(unittest.TestCase):
    
    def test_is_valid_executable_fake_path(self):
        """Testa se o scraper rejeita caminhos falsos para o Chrome (REQ-B70)"""
        fake_path = "/caminho/inventado/para/o/chrome.exe"
        resultado = is_valid_executable(fake_path)
        
        self.assertFalse(resultado, "Deveria retornar False para um executável que não existe.")

if __name__ == '__main__':
    unittest.main()