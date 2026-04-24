import json
import os
import math
from collections import defaultdict

class Indexer:
    def __init__(self):
        # REQ-B27: Estrutura base
        self.inverted_index = defaultdict(lambda: {"df": 0, "postings": defaultdict(int)})
        self.document_metadata = {} 
        self.indexed_doc_ids = set()

    def load_existing_index(self, index_file='src/search/inverted_index.json', metadata_file='src/search/doc_metadata.json'):
        """REQ-B31: Suporte incremental carregando caminhos corretos."""
        if os.path.exists(index_file) and os.path.exists(metadata_file):
            print("A carregar índice existente...")
            
            with open(metadata_file, 'r', encoding='utf-8') as f:
                saved_metadata = json.load(f)
                for doc_id, data in saved_metadata.items():
                    self.document_metadata[int(doc_id)] = data
                    self.indexed_doc_ids.add(int(doc_id))
            
            with open(index_file, 'r', encoding='utf-8') as f:
                saved_index = json.load(f)
                for term, data in saved_index.items():
                    self.inverted_index[term]["df"] = data["df"]
                    for doc_id, count in data["postings"].items():
                        self.inverted_index[term]["postings"][int(doc_id)] = count
            
            print(f"Índice carregado: {len(self.inverted_index)} termos, {len(self.indexed_doc_ids)} documentos.")

    def build_index(self, processed_data):
        """REQ-B28 & REQ-B30"""
        new_docs_count = 0
        
        for doc in processed_data:
            doc_id = int(doc["id"])
            
            if doc_id in self.indexed_doc_ids:
                continue
                
            new_docs_count += 1
            self.indexed_doc_ids.add(doc_id)
            
            # --- CORREÇÃO AQUI: A chave correta é 'original_metadata' ---
            meta = doc.get("original_metadata", {})
            self.document_metadata[doc_id] = {
                "title": meta.get("title", "Sem Título"),
                "authors": meta.get("authors", []), # ADICIONA ESTA LINHA se não tiveres
                "document_link": meta.get("document_link", "N/A"),
                "doi": meta.get("doi", "N/A")
            }

            # União de tokens para processar frequências
            all_tokens = doc.get("title_tokens", []) + doc.get("abstract_tokens", [])

            term_counts = defaultdict(int)
            for token in all_tokens:
                term_counts[token] += 1

            for term, count in term_counts.items():
                self.inverted_index[term]["postings"][doc_id] = count
                self.inverted_index[term]["df"] += 1
                
        print(f"{new_docs_count} NOVOS documentos adicionados ao índice.")

    def generate_skip_pointers(self):
        """REQ-B29: Otimização matemática"""
        for term, data in self.inverted_index.items():
            postings_list = sorted(list(data["postings"].keys()))
            length = len(postings_list)
            skip_pointers = {}
            
            if length >= 3:
                skip_length = int(math.sqrt(length))
                for i in range(0, length - skip_length, skip_length):
                    current_doc = postings_list[i]
                    target_doc = postings_list[i + skip_length]
                    skip_pointers[current_doc] = target_doc
            
            self.inverted_index[term]["skip_pointers"] = skip_pointers

    def save_index(self, index_file='src/search/inverted_index.json', metadata_file='src/search/doc_metadata.json'):
        self.generate_skip_pointers()
        
        # Garantir que a pasta existe
        os.makedirs(os.path.dirname(index_file), exist_ok=True)
        
        clean_index = {
            k: {
                "df": v["df"], 
                "postings": dict(v["postings"]),
                "skip_pointers": v.get("skip_pointers", {})
            } for k, v in self.inverted_index.items()
        }
        
        with open(index_file, 'w', encoding='utf-8') as f:
            json.dump(clean_index, f, ensure_ascii=False, indent=4)
            
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(self.document_metadata, f, ensure_ascii=False, indent=4)
            
        print("Índice Invertido e Metadados guardados com sucesso!")

def run_indexer(batch_size=100):
    """
    REQ-B59: Implementação de processamento em lotes (batch processing).
    Processa a coleção em fatias para não sobrecarregar a memória RAM.
    """
    input_path = 'src/search/processed_data.json'
    
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            processed_data = json.load(f)
    except FileNotFoundError:
        print(f"Erro: {input_path} não encontrado.")
        return

    indexer = Indexer()
    indexer.load_existing_index()
    
    # --- REQ-B59: Lógica de Lotes (Batches) ---
    total_docs = len(processed_data)
    print(f"\n📦 A iniciar indexação em Lotes (Tamanho do Lote: {batch_size})...")
    
    for i in range(0, total_docs, batch_size):
        # Cortar a lista numa fatia de tamanho 'batch_size'
        batch = processed_data[i:i + batch_size]
        print(f" -> A processar lote {i//batch_size + 1} (Docs {i} a {i + len(batch) - 1})...")
        
        # Constrói o índice apenas para esta fatia
        indexer.build_index(batch)
        
    # Guarda o ficheiro gigante apenas uma vez no final
    indexer.save_index()

if __name__ == "__main__":
    run_indexer()