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

# Caminho para a base de dados criada pelo database_setup.py
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
    logger.info(f" A pesquisar documento ID: {doc_id}")
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
    # Obtém os IDs dos documentos que correspondem à pesquisa
    raw_results = engine.search(q) 
    
    # Vai buscar os detalhes de cada documento à BD (semelhante à rota /api/search)
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
    
    # Escrita real dos dados nos ficheiros
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
            # Gera uma entrada BibTeX simples para cada documento
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
            "date": meta.get('year', 'N/D')
        })
    return formatted_results

@app.get("/api/search")
async def search(
    q: str = "", 
    search_in: str = 'all', 
    method: str = 'stemming', 
    language: str = 'pt',          
    ranking: str = 'custom_tfidf', 
    weighting: str = 'log_normalization',
    page: int = 1,     
    limit: int = 10,
    date_min: str = "",
    date_max: str = "",
    doc_types: str = "",
    exclude_stopwords: bool = True,
):
    """
    Endpoint de pesquisa principal que suporta filtragem por zona (search_in).
    Cumpre os requisitos de integração entre o frontend React e o motor Python.
    """
    import time
    import re
    start_time = time.time()

    try:
        # Forçar strings limpas para evitar falhas de correspondência com o engine.py
        zona_limpa = str(search_in).strip().lower()
        if zona_limpa not in ['title', 'abstract', 'all']:
            zona_limpa = 'all'

        # COMPORTAMENTO EXPANDIDO: Se o utilizador escolher 'abstract',
        # engana o motor de busca passando 'all' para garantir que ele traz os documentos.
        # Mas mantem zona_limpa como 'abstract' para a lógica de realce visual abaixo
        zone_to_engine = 'all' if zona_limpa == 'abstract' else zona_limpa

        # Limpar os filtros de data — string vazia vira None
        date_min_clean = date_min.strip() if date_min and date_min.strip() else None
        date_max_clean = date_max.strip() if date_max and date_max.strip() else None

        

        if ranking == "boolean":
            raw_results = engine.ranked_search(
                query=q,
                ranking="boolean",
                zone=zone_to_engine,
                date_range=(date_min_clean, date_max_clean),
                doc_types=doc_types.split(',') if doc_types else [],
                remove_stopwords=exclude_stopwords,
                language=language
            )
        else:
            raw_results = engine.ranked_search(
                query=q,
                use_sklearn=(ranking == "sklearn_tfidf"),
                scheme=weighting,
                weighting=weighting,
                zone=zone_to_engine,
                date_range=(date_min_clean, date_max_clean),
                doc_types=doc_types.split(',') if doc_types else [],
                remove_stopwords=exclude_stopwords,
                language=language
            )

        if date_min_clean or date_max_clean:
            conn_filter = get_db_connection()
            cur_filter = conn_filter.cursor()
            filtered = []
            for item in raw_results:
                doc_id = int(item[0] if isinstance(item, tuple) else item)
                cur_filter.execute("SELECT year FROM documents WHERE id = ?", (doc_id,))
                row = cur_filter.fetchone()
                if row:
                    raw_year = str(row['year'] or '').strip()[:4]
                    doc_year = int(raw_year) if raw_year.isdigit() else None
                    if doc_year is not None:
                        if date_min_clean and doc_year < int(date_min_clean): continue
                        if date_max_clean and doc_year > int(date_max_clean): continue
                filtered.append(item)
            conn_filter.close()
            raw_results = filtered

        # Paginação manual dos resultados 
        total_results = len(raw_results)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_results = raw_results[start_idx:end_idx]

        #  Formatação detalhada para o Frontend (incluindo metadados e snippets)
        formatted_results = []

        # Abre a conexão à BD para garantir os dados mais frescos e completos
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Extrai os termos originais da query limpos para o Regex fazer o match
        query_terms_raw = [t for t in q.split() if t.lower() not in ["and", "or", "not"]]

        ids_processados_nesta_api = set()

        for item in paginated_results:
            # Separar o ID e o Score
            raw_id, score = item if isinstance(item, tuple) else (item, 0.0)
            
            #  Força o ID a ser um Inteiro Puro para o SQLite não duplicar/baralhar
            doc_id = int(raw_id)

            # Se por algum motivo o motor ou a BD tentar repetir este ID no mesmo pedido, salta
            if doc_id in ids_processados_nesta_api:
                continue
            ids_processados_nesta_api.add(doc_id)
            
            cursor.execute("SELECT title, abstract, authors, document_link, year FROM documents WHERE id = ?", (doc_id,))
            row = cursor.fetchone()
            
            if row:
                doc_db = dict(row)
                raw_title = doc_db.get('title', 'Sem Título')
                raw_abstract = doc_db.get('abstract', '') or ''

                # Criar o padrão de Regex para encontrar as palavras pesquisadas
                pattern = re.compile(f"({'|'.join(re.escape(t) for t in query_terms_raw)})", re.IGNORECASE) if query_terms_raw else None

                botao_ativo = str(search_in).strip().lower()
                
                # Se o botão ativo for TÍTULOS:
                if botao_ativo == 'title':
                    # O título ganha sublinhado <u>
                    highlighted_title = pattern.sub(r"<u>\1</u>", raw_title) if pattern else raw_title
                    # O resumo fica 100% LIMPO (mostra o início normal sem tags)
                    snippet = raw_abstract[:200] + "..." if len(raw_abstract) > 200 else raw_abstract
                
                # Se o botão ativo for RESUMOS:
                elif botao_ativo == 'abstract':
                    # O título fica 100% LIMPO (sem sublinhados nenhuns)
                    highlighted_title = raw_title
                    # O textinho de baixo leva o realce completo
                    snippet = generate_highlighted_snippet(raw_abstract, query_terms_raw)
                
                # 3. Se for TODOS (ou 'all'):
                else:
                    highlighted_title = pattern.sub(r"<u>\1</u>", raw_title) if pattern else raw_title
                    snippet = generate_highlighted_snippet(raw_abstract, query_terms_raw)

                #  Formata como string de percentagem para o React não crashar
                # Se for maior que 0, vira (ex: "87.5%"). Se for 0 (como na Booleana), vira "N/A"
                score_formatado = f"{score * 100:.1f}%" if score > 0 else "N/A"

                # Envia os dados limpos e formatados para o React
                formatted_results.append({
                    "id": doc_id,
                    "title": highlighted_title,
                    "authors": doc_db.get('authors', 'Autor Desconhecido'),
                    "abstract": raw_abstract,
                    "snippet": snippet,
                    "pdf_link": doc_db.get('document_link', '#'),
                    "score": score_formatado,  
                    "date": doc_db.get('year', 'N/D')
                })

        conn.close()

        execution_time = f"{time.time() - start_time:.3f}s"
        return {
            "results": formatted_results,
            "total_count": total_results,
            "search_time": execution_time,
            "query": q,
            "page": page
        }

    except Exception as e:
        print(f"ERRO NA PESQUISA API: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    

# ==============================================================================
# ENDPOINTS DAS DASHBOARDS
# ==============================================================================

def calculate_real_ir_metrics(engine_instance):
    # Liga à base de dados SQLite local onde estão armazenadas as publicações
    import sqlite3
    conn = sqlite3.connect('publications.db')
    cursor = conn.cursor()

    # Define a lista fixa de queries temáticas que serão testadas na avaliação do motor
    # Constrói o ground truth automaticamente pesquisando por palavras-chave nos títulos/abstracts
    queries_to_test = ["neural networks", "health data", "textile industry", "information systems", "ambient intelligence"]
    
    # Inicializa o dicionário que guardará os IDs genuinamente relevantes (Ground Truth) para cada query
    GROUND_TRUTH = {}
    for query in queries_to_test:
        # Divide a query em palavras individuais para aplicar a lógica AND na pesquisa SQL
        terms = query.split()
        # Cria cláusulas LIKE dinâmicas para garantir que todos os termos aparecem no título ou no abstract
        like_clauses = " AND ".join([f"(title LIKE '%{t}%' OR abstract LIKE '%{t}%')" for t in terms])
        # Executa a query na tabela de documentos utilizando os filtros gerados
        cursor.execute(f"SELECT id FROM documents WHERE {like_clauses}")
        # Extrai os IDs resultantes da consulta da base de dados
        relevant_ids = [row[0] for row in cursor.fetchall()]
        # Se encontrar documentos relevantes, associa-os à respetiva query no Ground Truth
        if relevant_ids:
            GROUND_TRUTH[query] = relevant_ids

    # Fecha a ligação à base de dados para libertar os recursos após recolher o Ground Truth
    conn.close()

    # Caso nenhum documento relevante tenha sido encontrado na BD para as queries, aborta e devolve métricas a zero
    if not GROUND_TRUTH:
        return {"precision": 0, "recall": 0, "f1Score": 0, "accuracy": 0}

    # Inicializa os acumuladores para calcular as médias macro das métricas no final
    total_precision = 0
    total_recall = 0
    queries_run = 0

    # Avalia o motor de busca iterando sobre cada query e o seu conjunto de documentos esperados
    for query, expected_docs in GROUND_TRUTH.items():
        # Converte os documentos esperados num set para operações de conjuntos rápidas
        expected_set = set(expected_docs)

        # Invoca o motor de busca a testar e extrai o Top 10 dos resultados devolvidos
        raw_results = engine_instance.ranked_search(query)[:10]
        # Normaliza os resultados tratando tuplos ou IDs brutos e converte para um set de inteiros
        retrieved_set = set([int(res[0] if isinstance(res, tuple) else res) for res in raw_results])

        # Calcula os Verdadeiros Positivos (interseção entre o que foi devolvido e o que era esperado)
        true_positives = len(retrieved_set.intersection(expected_set))
        # Calcula os Falsos Positivos (documentos devolvidos pelo motor que não eram esperados)
        false_positives = len(retrieved_set - expected_set)
        # Calcula os Falsos Negativos (documentos esperados que o motor não conseguiu recuperar)
        false_negatives = len(expected_set - retrieved_set)

        # Calcula a Precisão e o Recall para a query atual, protegendo contra divisões por zero
        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0

        # Acumula os valores obtidos para o cálculo da média global posterior
        total_precision += precision
        total_recall += recall
        queries_run += 1

    # Calcula as médias aritméticas (Macro-averaging) das métricas de Precisão e Recall
    avg_precision = total_precision / queries_run if queries_run > 0 else 0
    avg_recall = total_recall / queries_run if queries_run > 0 else 0
    # Calcula a métrica F1-Score através da média harmónica entre a precisão média e o recall médio
    f1_score = 2 * (avg_precision * avg_recall) / (avg_precision + avg_recall) if (avg_precision + avg_recall) > 0 else 0
    # Calcula uma métrica simplificada de Accuracy baseada na média simples das duas componentes
    accuracy = (avg_precision + avg_recall) / 2

    # Devolve um dicionário com os valores finais convertidos para percentagem e arredondados
    return {
        "precision": round(avg_precision * 100),
        "recall": round(avg_recall * 100),
        "f1Score": round(f1_score * 100),
        "accuracy": round(accuracy * 100)
    }

@app.get("/api/stats", tags=["Dashboards"])
def get_dashboard_stats():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT year, COUNT(*) as count FROM documents WHERE year IS NOT NULL AND year != 'N/D' AND year != '' GROUP BY year ORDER BY year")
        data = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"by_year": data}
    except Exception as e:
        print(f"❌ ERRO NA DASHBOARD API: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin-stats", tags=["Dashboards"])
def get_admin_dashboard_stats():
    import json
    import os
    try:
        # 1. Total de Documentos Reais na BD
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM documents")
        row = cursor.fetchone()
        real_doc_count = row[0] if row else 0
        conn.close()

        # 2. Dados Reais do Índice Invertido
        # Vamos usar o índice principal como referência
        index_ref = engine.all_indexes.get('stem_nostop', {}).get('index', {})
        total_terms = len(index_ref)
        
        # Calcular os 5 termos reais mais frequentes no corpus
        term_frequencies = []
        total_words_corpus = 0
        
        for term, posting_list in index_ref.items():
            doc_freq = len(posting_list)
            term_frequencies.append({"term": term, "count": doc_freq})
            total_words_corpus += doc_freq
        
        top_terms = sorted(term_frequencies, key=lambda x: x["count"], reverse=True)[:5]
        avg_doc_length = int(total_words_corpus / real_doc_count) if real_doc_count > 0 else 0

        # 3. Tamanho Real do Ficheiro de Índice (MB)
        file_size_mb = 0
        index_path = 'src/search/all_indexes.json'
        if os.path.exists(index_path):
            file_size_mb = round(os.path.getsize(index_path) / (1024 * 1024), 2)

        # 4. CALCULA AS MÉTRICAS DE MACHINE LEARNING REAIS
        real_metrics = calculate_real_ir_metrics(engine)

        return {
            "stats": {
                "totalDocs": real_doc_count,
                "totalTerms": total_terms,
                "avgDocLength": avg_doc_length
            },
            "frequentQueries": [],  # Vem do localStorage do browser (tratado no AdminDashboard.jsx)
            "frequentTerms": top_terms,
            "indexGrowth": [
                { "month": "Documentos", "size": real_doc_count },
                { "month": "Termos Únicos", "size": total_terms },
                { "month": "Tamanho Índice (MB)", "size": file_size_mb },
                { "month": "Média Palavras/Doc", "size": avg_doc_length },
            ],
            "classification": real_metrics
        }
    except Exception as e:
        print(f"❌ ERRO NO MOTOR ADMIN: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    


