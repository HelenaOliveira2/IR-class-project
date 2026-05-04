from fastapi import FastAPI, HTTPException, Query, Path
from pydantic import BaseModel, Field
from typing import List, Optional
import sqlite3
from src.api.config import settings
from src.api.logger import logger
#7.1
# Inicialização da API com metadados para o Swagger (REQ-B65)
app = FastAPI(
    title="UMinho Publications API",
    description="API RESTful para consulta de artigos científicos extraídos do repositório da UMinho.",
    version="1.0.0"
)

# Caminho para a base de dados criada pelo teu database_setup.py
DB_FILE = 'publications.db'

def get_db_connection():
    conn = sqlite3.connect(settings.db_file)
    conn.row_factory = sqlite3.Row  # Permite aceder às colunas pelo nome
    return conn

# ==========================================
# MODELOS DE VALIDAÇÃO (REQ-B66)
# ==========================================
# O Pydantic garante que os dados que entram e saem têm o formato e tipo corretos.

class DocumentResponse(BaseModel):
    id: int
    title: str
    abstract: Optional[str] = None
    year: Optional[str] = None
    doi: Optional[str] = None
    document_link: Optional[str] = None
    authors: str

class AuthorResponse(BaseModel):
    id: int
    name: str
    affiliation: Optional[str] = None

# ==========================================
# ENDPOINTS DA API (REQ-B63 & REQ-B64)
# ==========================================

@app.get("/api/documents", response_model=List[DocumentResponse], tags=["Documents"])
def get_documents(
    skip: int = Query(0, ge=0, description="Número de registos a saltar (paginação)"),
    limit: int = Query(10, ge=1, le=100, description="Limite máximo de registos a devolver (máx 100)")
):
    logger.info(f"🔍 Pesquisa geral: skip={skip}, limit={limit}")
    """Retorna uma lista paginada de todos os documentos na base de dados."""
    conn = get_db_connection()
    cursor = conn.cursor()
    # O uso de parâmetros (?) previne SQL Injection, ajudando na sanitização (REQ-B66)
    cursor.execute("SELECT * FROM documents LIMIT ? OFFSET ?", (limit, skip))
    docs = cursor.fetchall()
    conn.close()
    logger.info(f"✅ Devolvidos {len(docs)} documentos.")
    return [dict(doc) for doc in docs]


@app.get("/api/documents/{doc_id}", response_model=DocumentResponse, tags=["Documents"])
def get_document_by_id(
    doc_id: int = Path(..., title="O ID do documento", ge=1)
):
    logger.info(f"🆔 A pesquisar documento ID: {doc_id}")
    """Pesquisa um documento específico pelo seu ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    doc = cursor.fetchone()
    conn.close()

    if not doc:
        logger.warning(f"⚠️ Documento {doc_id} não encontrado!")
        # Tratamento de erro adequado com código 404 (REQ-B64)
        raise HTTPException(status_code=404, detail=f"Documento com ID {doc_id} não encontrado.")
    
    logger.info(f"✨ Documento '{doc['title'][:30]}...' enviado.")
    return dict(doc)


@app.get("/api/authors", response_model=List[AuthorResponse], tags=["Authors"])
def get_authors():
    """Retorna a lista de todos os autores."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM authors")
    authors = cursor.fetchall()
    conn.close()
    
    return [dict(author) for author in authors]