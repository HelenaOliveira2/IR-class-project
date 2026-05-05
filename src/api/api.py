import time
import re
import csv
import io
from fastapi import FastAPI, HTTPException, Query, Path
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import sqlite3
from src.api.config import settings
from src.api.logger import logger
from src.search.engine import SearchEngine
#7.1
# Inicialização da API com metadados para o Swagger (REQ-B65)
app = FastAPI(
    title="UMinho Publications API",
    description="API RESTful para consulta de artigos científicos extraídos do repositório da UMinho.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite que o React aceda à API
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = SearchEngine()

# Caminho para a base de dados criada pelo teu database_setup.py
DB_FILE = 'publications.db'

def get_db_connection():
    conn = sqlite3.connect(settings.db_file)
    conn.row_factory = sqlite3.Row  # Permite aceder às colunas pelo nome
    return conn

# REQ-F26: Função para gerar snippets com destaque (Highlight)
def generate_highlighted_snippet(text, query_terms):
    if not text: return "Resumo não disponível."
    
    # Procura a primeira ocorrência de qualquer termo da query
    pattern = re.compile(f"({'|'.join(re.escape(t) for t in query_terms)})", re.IGNORECASE)
    match = pattern.search(text)
    
    if match:
        start = max(0, match.start() - 50)
        end = min(len(text), match.end() + 100)
        snippet = text[start:end]
        # Adiciona as tags de destaque
        highlighted = pattern.sub(r"<b>\1</b>", snippet)
        return f"...{highlighted}..."
    return text[:150] + "..."

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

# No src/api/api.py

# Local: src/api/api.py

@app.get("/api/search")
def search(
    q: str, 
    method: str = "stemming", 
    ranking: str = "custom_tfidf", 
    weighting: str = "log_normalization",
    page: int = Query(1, ge=1),           
    limit: int = Query(10, ge=1, le=50),  
    sort_by: str = "relevance"            
):
    start_time = time.time()
    
    # 1. Obtém TODOS os resultados do motor de busca[cite: 5]
    raw_results = engine.search(q, method, ranking, weighting)
    total_results = len(raw_results)
    
    # 2. Busca os dados de TODOS para poder ordenar corretamente
    all_matching_docs = []
    conn = get_db_connection()
    cursor = conn.cursor()

    for res in raw_results:
        doc_id = res['doc_id'] if isinstance(res, dict) else res
        score = res['score'] if isinstance(res, dict) else 0.0

        cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
        row = cursor.fetchone()
        if row:
            doc = dict(row)
            all_matching_docs.append({
                "id": doc["id"],
                "title": doc["title"],
                "authors": doc.get("authors", "N/A"),
                "date": str(doc.get("year", "N/A")), # Garante string para ordenação
                "score": round(score, 4),
                "snippet": generate_highlighted_snippet(doc.get("abstract", ""), q.split()),
                "pdf_link": doc.get("document_link", "#"),
                "abstract": doc.get("abstract", ""),
                "type": "Artigo Científico"
            })
    conn.close()

    # 3. Lógica de Ordenação Global (REQ-F34)
    if sort_by == "date":
        all_matching_docs.sort(key=lambda x: x['date'], reverse=True)
    elif sort_by == "title":
        all_matching_docs.sort(key=lambda x: x['title'].lower())
    else:
        # Relevância (já vem do motor, mas garantimos aqui)[cite: 5]
        all_matching_docs.sort(key=lambda x: x['score'], reverse=True)

    # 4. Cálculo de Paginação sobre a lista já ordenada (REQ-F31)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated_results = all_matching_docs[start_idx:end_idx]

    return {
        "results": paginated_results,
        "total_count": total_results,
        "page": page,
        "limit": limit,
        "search_time": f"{time.time() - start_time:.4f}s"
    }

# REQ-F30: Exportação de Resultados
@app.get("/api/export/{file_format}")
def export_results(file_format: str, q: str = "search"):
    # 1. Obtém os IDs dos documentos que correspondem à pesquisa[cite: 4, 5]
    raw_results = engine.search(q) 
    
    # 2. Vai buscar os detalhes de cada documento à BD (semelhante à rota /api/search)
    conn = get_db_connection()
    cursor = conn.cursor()
    documents = []
    
    for res in raw_results:
        doc_id = res['doc_id'] if isinstance(res, dict) else res
        cursor.execute("SELECT title, authors, year, document_link FROM documents WHERE id = ?", (doc_id,))
        row = cursor.fetchone()
        if row:
            documents.append(dict(row))
    conn.close()

    output = io.StringIO()
    
    # 3. Escrita real dos dados nos ficheiros
    if file_format == "csv":
        writer = csv.writer(output)
        writer.writerow(["Title", "Authors", "Year", "Link"]) # Cabeçalho
        for doc in documents:
            writer.writerow([doc['title'], doc['authors'], doc['year'], doc['document_link']])
        
        output.seek(0)
        return StreamingResponse(output, media_type="text/csv", 
                                headers={"Content-Disposition": f"attachment; filename=search_results.csv"})

    elif file_format == "json":
        # Retorna a lista de documentos reais em formato JSON (REQ-F30)
        return {"query": q, "total_exported": len(documents), "results": documents}

    elif file_format == "bibtex":
        bib_entries = []
        for i, doc in enumerate(documents):
            # Gera uma entrada BibTeX simples para cada documento[cite: 4]
            entry = f"@article{{doc{i},\n  title={{{doc['title']}}},\n  author={{{doc['authors']}}},\n  year={{{doc['year']}}}\n}}"
            bib_entries.append(entry)
        
        bib_content = "\n\n".join(bib_entries)
        return StreamingResponse(io.StringIO(bib_content), media_type="text/plain",
                                headers={"Content-Disposition": f"attachment; filename=results.bib"})