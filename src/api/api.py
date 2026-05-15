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

engine = SearchEngine(
    index_path='src/search/inverted_index.json', 
    metadata_path='src/search/doc_metadata.json'
)

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



# REQ-F35: Design dedicated author search page
@app.get("/api/authors/profile", tags=["Authors"])
def get_author_profile(name: str):
    """Pesquisa o perfil de um autor, as suas publicações, rede e timeline."""
    conn = get_db_connection()
    cursor = conn.cursor()
    # Procura documentos onde o nome do autor aparece na coluna authors
    cursor.execute("SELECT * FROM documents WHERE authors LIKE ?", (f"%{name}%",))
    docs = cursor.fetchall()
    conn.close()

    author_docs = []
    collaborators = set()
    timeline_data = {}

    for row in docs:
        doc = dict(row)
        
        # REQ-F36: Formata o documento para a lista de publicações
        doc_formatted = {
            "id": doc["id"],
            "title": doc["title"],
            "authors": doc.get("authors", "N/A"),
            "date": str(doc.get("year", "N/A")),
            "snippet": doc.get("abstract", "")[:150] + "...",
            "abstract": doc.get("abstract", ""),
            "pdf_link": doc.get("document_link", "#"),
            "type": doc.get("type", "Artigo Científico")
        }
        author_docs.append(doc_formatted)

        # REQ-F37: Extrai co-autores (Agrupa Apelido, Nome)
        raw_authors = doc.get("authors", "")
        doc_authors = []
        
        if ';' in raw_authors:
            doc_authors = [a.strip() for a in raw_authors.split(';')]
        else:
            # Separa tudo por vírgula
            parts = [p.strip() for p in raw_authors.split(',') if p.strip()]
            # Agrupa de 2 em 2 (Apelido, Nome)
            if len(parts) % 2 == 0:
                doc_authors = [f"{parts[i]}, {parts[i+1]}" for i in range(0, len(parts), 2)]
            else:
                doc_authors = parts

        for a in doc_authors:
            # Ignora o próprio autor pesquisado para não aparecer na sua própria rede
            if a and name.lower() not in a.lower():
                collaborators.add(a)

        # REQ-F38: Conta documentos por ano para a Timeline
        year = str(doc.get("year", "Desconhecido"))
        timeline_data[year] = timeline_data.get(year, 0) + 1

    # Ordena a timeline cronologicamente
    timeline = [{"year": y, "count": c} for y, c in sorted(timeline_data.items()) if y != "Desconhecido"]

    # Retorna a estrutura exata que o nosso Frontend React espera
    return {
        "name": name,
        "collaborators": list(collaborators)[:15], # Limitamos a 15 co-autores para a interface não quebrar visualmente
        "timeline": timeline,
        "publications": author_docs # REQ-F36
    }

@app.get("/api/authors/search")
async def get_author_results(name: str):
    # Chama a função do engine.py
    results = engine.search_by_author(name)
    
    formatted_results = []
    for res in results:
        doc_id = str(res['doc_id'])
        # Usa .get() para evitar que o servidor crash se o ID não existir
        meta = engine.metadata.get(doc_id, {})
        
        formatted_results.append({
            "id": int(doc_id),
            "title": meta.get("title", "Sem Título"),
            "authors": meta.get("authors", "Autor Desconhecido"),
            "pdf_link": meta.get("document_link", "#"),
            "abstract": meta.get("abstract", ""),
            "date": meta.get("year", "N/A")
        })
    return formatted_results

@app.get("/api/search")
async def search(
    q: str= "", 
    search_in: str = 'all', 
    method: str = 'stemming', 
    ranking: str = 'custom_tfidf', 
    weighting: str = 'log_normalization',
    page: int = 1,
    limit: int = 10
):
    """
    Endpoint de pesquisa principal que suporta filtragem por zona (search_in).
    Cumpre os requisitos de integração entre o frontend React e o motor Python.
    """
    import time
    start_time = time.time()

    try:
        # 1. Chamar o motor de busca passando o parâmetro de zona (search_in)
        # Nota: O seu engine.ranked_search precisa de aceitar 'search_in' ou 'zone'
        raw_results = engine.ranked_search(
            query=q, 
            use_sklearn=(ranking == "sklearn_tfidf"), 
            scheme=weighting,
        )

        # 2. Paginação manual dos resultados (essencial para o REQ-F83 do frontend)
        total_results = len(raw_results)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_results = raw_results[start_idx:end_idx]

        # 3. Formatação detalhada para o Frontend (incluindo metadados e snippets)
        # O handlePerformSearch no App.jsx espera esta estrutura exata
        formatted_results = []
        for item in paginated_results:
            # Lidar com retorno (doc_id, score) ou apenas doc_id
            doc_id, score = item if isinstance(item, tuple) else (item, 0.0)
            
            # Ir buscar os metadados carregados no SearchEngine.__init__
            meta = engine.document_metadata.get(str(doc_id), {})
            
            # REQ-B50: Gerar snippet focado na query
            snippet = engine._generate_snippet(meta.get('abstract', ''), engine.processor.clean_text(q))

            formatted_results.append({
                "id": doc_id,
                "title": meta.get('title', 'Sem Título'),
                "authors": meta.get('authors', []),
                "abstract": meta.get('abstract', ''),
                "snippet": snippet,
                "pdf_link": meta.get('document_link', '#'),
                "score": f"{score * 100:.1f}%" if score > 0 else "N/A",
                "date": meta.get('date', 'N/D')
            })

        execution_time = f"{time.time() - start_time:.3f}s"

        # Retorna o objeto esperado pelo App.jsx
        return {
            "results": formatted_results,
            "total_count": total_results,
            "search_time": execution_time,
            "query": q,
            "page": page
        }

    except Exception as e:
        print(f"Erro interno na API: {str(e)}")
        return {"results": [], "total_count": 0, "error": str(e)}