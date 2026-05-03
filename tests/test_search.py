import unittest
from src.search.processor import TextProcessor
from src.search.engine import SearchEngine

class TestSearchComponents(unittest.TestCase):
    
    def setUp(self):
        # O setUp corre antes de cada teste para preparar o ambiente
        self.processor = TextProcessor()
        self.engine = SearchEngine()

    def test_text_cleaning_and_stemming(self):
        """Testa a tokenização, remoção de stopwords e stemming (REQ-B14, B16, B21)"""
        texto = "The cats are running quickly!"
        tokens = self.processor.clean_text(texto, use_stemming=True, remove_stopwords=True)
        
        self.assertIn("cat", tokens)
        self.assertIn("run", tokens)
        self.assertNotIn("the", tokens) # Stopword removida
        self.assertNotIn("!", tokens)   # Pontuação removida

    def test_boolean_parser(self):
        """Testa o motor booleano e a inserção de ANDs implícitos (REQ-B23, B26)"""
        tokens = self.engine._tokenize_boolean_query("saude covid")
        self.assertEqual(tokens, ["saude", "and", "covid"])

if __name__ == '__main__':
    unittest.main()