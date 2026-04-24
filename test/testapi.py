# test_api.py
from fastapi.testclient import TestClient
from api import app # Importa a API que criaste no passo anterior

# O TestClient simula pedidos à tua API sem precisares de ligar o servidor
client = TestClient(app)

def test_get_documents_status_code():
    """Testa se o endpoint dos documentos responde com sucesso (200 OK)"""
    response = client.get("/api/documents?limit=5")
    assert response.status_code == 200

def test_get_documents_returns_list():
    """Testa se a API devolve uma lista e se a paginação funciona"""
    response = client.get("/api/documents?limit=2")
    dados = response.json()
    assert isinstance(dados, list)
    assert len(dados) <= 2

def test_get_document_not_found():
    """Testa o tratamento de erros (REQ-B64) para um ID que não existe"""
    response = client.get("/api/documents/999999")
    assert response.status_code == 404
    assert "não encontrado" in response.json()["detail"]