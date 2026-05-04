import unittest
from fastapi.testclient import TestClient
from src.api.api import app

class TestAPI(unittest.TestCase):
    
    def setUp(self):
        # O TestClient simula pedidos à API sem ligar o servidor web
        self.client = TestClient(app)

    def test_get_documents_status_code(self):
        """Testa se o endpoint dos documentos responde com sucesso 200 OK (REQ-B64)"""
        response = self.client.get("/api/documents?limit=5")
        self.assertEqual(response.status_code, 200)

    def test_get_documents_returns_list(self):
        """Testa se a API devolve uma lista e se a paginação funciona"""
        response = self.client.get("/api/documents?limit=2")
        dados = response.json()
        
        self.assertIsInstance(dados, list)
        self.assertLessEqual(len(dados), 2)

    def test_get_document_not_found(self):
        """Testa o tratamento de erros HTTP para um ID que não existe (REQ-B64)"""
        response = self.client.get("/api/documents/999999")
        
        self.assertEqual(response.status_code, 404)
        self.assertIn("não encontrado", response.json()["detail"])

if __name__ == '__main__':
    unittest.main()