import time
import tracemalloc
import sqlite3
from src.search.processor import TextProcessor # Ajusta o caminho se necessário
from src.search.indexer import Indexer         # Ajusta o caminho se necessário
from src.search.engine import SearchEngine     # Ajusta o caminho se necessário

def evaluate_indexing_performance():
    """
    Secção 6.1: REQ-B56, B57, B58
    Compara o tempo e memória de indexação entre Stemming e Lematização.
    """
    print("\n" + "="*50)
    print(" ⏱️ 6.1 AVALIAÇÃO DE PERFORMANCE: INDEXAÇÃO")
    print("="*50)
    
    conn = sqlite3.connect('publications.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, title, abstract FROM documents LIMIT 50') # Amostra de 50 docs
    rows = cursor.fetchall()
    conn.close()
    
    if not rows:
        print("Erro: Base de dados vazia.")
        return

    estrategias = [
        {"nome": "STEMMING", "use_stemming": True},
        {"nome": "LEMATIZAÇÃO", "use_stemming": False}
    ]

    for est in estrategias:
        print(f"\n--- Testando estratégia: {est['nome']} ---")
        processor = TextProcessor()
        indexer = Indexer()
        processed_list = []
        
        tracemalloc.start() # Inicia medição de RAM (REQ-B58)
        start_time = time.time() # Inicia medição de Tempo (REQ-B56)
        
        # Simular processamento e indexação
        for doc_id, title, abstract in rows:
            processed_list.append({
                "id": doc_id,
                "title_tokens": processor.clean_text(title, use_stemming=est["use_stemming"]),
                "abstract_tokens": processor.clean_text(abstract, use_stemming=est["use_stemming"]),
                "original_metadata": {"title": title}
            })
        indexer.build_index(processed_list)
        
        end_time = time.time()
        current_memory, peak_memory = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        
        tempo_gasto = end_time - start_time
        memoria_pico_mb = peak_memory / (1024 * 1024)
        
        print(f"-> Tempo de Indexação: {tempo_gasto:.4f} segundos (REQ-B56)")
        print(f"-> Pico de Memória RAM: {memoria_pico_mb:.4f} MB (REQ-B58)")

def evaluate_search_performance():
    """
    Secção 6.2: REQ-B60, B61, B62
    Testa a velocidade e eficácia de vários algoritmos de pesquisa.
    """
    print("\n" + "="*50)
    print(" 🔍 6.2 AVALIAÇÃO DE PERFORMANCE: PESQUISA")
    print("="*50)
    
    try:
        engine = SearchEngine()
    except Exception:
        print("Erro ao carregar o motor. Já correste a indexação?")
        return

    # Escolhe uma query que saibas que existe na tua base de dados
    #test_query = "data" 
    #print(f"Query de Teste: '{test_query}'\n")

    # Pergunta ao utilizador, mas se ele só der "Enter", usa "data" por defeito
    user_input = input("\nEscreve a query para o teste de performance (ou pressiona Enter para usar 'data'): ")
    test_query = user_input.strip() if user_input.strip() else "data"
    
    print(f"A executar testes de performance para a query: '{test_query}'\n")

    metodos = [
        {"nome": "1. Booleano (AND implícito)", "func": lambda q: engine.search(q), "ranked": False},
        {"nome": "2. Ranking (Apenas TF)", "func": lambda q: engine.ranked_search(q, scheme="tf", use_sklearn=False), "ranked": True},
        {"nome": "3. Ranking (Custom TF-IDF)", "func": lambda q: engine.ranked_search(q, scheme="tfidf", use_sklearn=False), "ranked": True},
        {"nome": "4. Ranking (Sklearn TF-IDF)", "func": lambda q: engine.ranked_search(q, use_sklearn=True), "ranked": True}
    ]

    for metodo in metodos:
        # REQ-B60: Medir tempo de resposta da query
        start_time = time.time()
        resultados = metodo["func"](test_query)
        tempo_resposta = (time.time() - start_time) * 1000 # Converter para milissegundos
        
        print(f"--- {metodo['nome']} ---")
        print(f"Tempo de resposta: {tempo_resposta:.2f} ms (REQ-B60)")
        
        # REQ-B61 & B62: Avaliar e comparar o ranking
        if not resultados:
            print("Nenhum resultado encontrado.\n")
            continue
            
        print("Top 3 Resultados (REQ-B61 e B62):")
        if metodo["ranked"]:
            # Se for ranked, os resultados são tuplos (doc_id, score)
            for i, (doc_id, score) in enumerate(resultados[:3]):
                titulo = engine.metadata.get(str(doc_id), {}).get("title", "Sem Título")
                print(f"  {i+1}º -> Score: {score:.4f} | ID: {doc_id} | Título: {titulo[:50]}...")
        else:
            # Se for booleano, é só uma lista de IDs
            for i, doc_id in enumerate(resultados[:3]):
                titulo = engine.metadata.get(str(doc_id), {}).get("title", "Sem Título")
                print(f"  {i+1}º -> ID: {doc_id} | Título: {titulo[:50]}...")
        print("")

if __name__ == "__main__":
    evaluate_indexing_performance()
    evaluate_search_performance()