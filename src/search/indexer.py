import json
import os
import math
from collections import defaultdict

class Indexer:
    def __init__(self):
        """
        REQ-B27: Constrói a estrutura do Índice Invertido
        Estrutura planeada com Skip Pointers incluídos:
        {
            "termo": {
                "df": 2,
                "postings": { "1": 3, "4": 1, "9": 2 },
                "skip_pointers": { "1": "4", "4": "9" } # REQ-B29
            }
        }
        """
        self.inverted_index = defaultdict(lambda: {"df": 0, "postings": defaultdict(int)})
        self.document_metadata = {} 
        self.indexed_doc_ids = set() # Ajuda no REQ-B31 para não duplicar documentos

    def load_existing_index(self, index_file='inverted_index.json', metadata_file='doc_metadata.json'):
        """
        REQ-B31: Suporte a atualizações incrementais do índice.
        Carrega o que já existe no disco para a memória antes de processar novos dados.
        """
        if os.path.exists(index_file) and os.path.exists(metadata_file):
            print("A carregar índice existente para atualização incremental...")
            
            # Carregar Metadados primeiro
            with open(metadata_file, 'r', encoding='utf-8') as f:
                saved_metadata = json.load(f)
                for doc_id, data in saved_metadata.items():
                    self.document_metadata[int(doc_id)] = data
                    self.indexed_doc_ids.add(int(doc_id))
            
            # Carregar Índice
            with open(index_file, 'r', encoding='utf-8') as f:
                saved_index = json.load(f)
                for term, data in saved_index.items():
                    self.inverted_index[term]["df"] = data["df"]
                    for doc_id, count in data["postings"].items():
                        self.inverted_index[term]["postings"][int(doc_id)] = count
                        
            print(f"Índice carregado: {len(self.inverted_index)} termos, {len(self.indexed_doc_ids)} documentos.")
        else:
            print("Nenhum índice anterior encontrado. A iniciar do zero...")

    def build_index(self, processed_data):
        """
        REQ-B28: Implementar listas de postings para cada termo
        REQ-B30: Armazenar frequências de termos (TF) e de documentos (DF)
        """
        new_docs_count = 0
        
        for doc in processed_data:
            doc_id = int(doc["id"])
            
            # REQ-B31: Se o documento já estiver no índice, saltamos para não duplicar
            if doc_id in self.indexed_doc_ids:
                continue
                
            new_docs_count += 1
            self.indexed_doc_ids.add(doc_id)
            
            self.document_metadata[doc_id] = {
                "title": doc["original_data"]["title"],
                "document_link": doc["original_data"]["document_link"],
                "doi": doc["original_data"]["doi"]
            }

            all_tokens = doc["title_tokens"] + doc["abstract_tokens"]

            term_counts = defaultdict(int)
            for token in all_tokens:
                term_counts[token] += 1

            for term, count in term_counts.items():
                self.inverted_index[term]["postings"][doc_id] = count
                self.inverted_index[term]["df"] += 1
                
        print(f"{new_docs_count} NOVOS documentos adicionados ao índice.")

    def generate_skip_pointers(self):
        """
        REQ-B29: Otimização da interseção de postings com skip pointers.
        Cria atalhos matemáticos (saltos de raiz quadrada do tamanho da lista).
        """
        for term, data in self.inverted_index.items():
            # Ordenar os IDs dos documentos numericamente
            postings_list = sorted(list(data["postings"].keys()))
            length = len(postings_list)
            skip_pointers = {}
            
            # Só vale a pena criar skip pointers se a lista tiver tamanho razoável (ex: >= 3)
            if length >= 3:
                # O tamanho ideal do salto é a raiz quadrada do tamanho da lista
                skip_length = int(math.sqrt(length))
                
                for i in range(0, length - skip_length, skip_length):
                    # O documento atual aponta para o documento X posições à frente
                    current_doc = postings_list[i]
                    target_doc = postings_list[i + skip_length]
                    skip_pointers[current_doc] = target_doc
            
            self.inverted_index[term]["skip_pointers"] = skip_pointers

    def save_index(self, index_file='inverted_index.json', metadata_file='doc_metadata.json'):
        """
        Guarda o índice e os metadados em ficheiros JSON.
        """
        # REQ-B29: Gerar os skip pointers mesmo antes de guardar
        self.generate_skip_pointers()
        
        print(f"A guardar índice com {len(self.inverted_index)} termos únicos...")
        
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

def run_indexer():
    try:
        with open('processed_data.json', 'r', encoding='utf-8') as f:
            processed_data = json.load(f)
    except FileNotFoundError:
        print("Erro: processed_data.json não encontrado. Corre o processor.py primeiro.")
        return

    indexer = Indexer()
    
    # Ordem correta para REQ-B31 (Atualização Incremental)
    indexer.load_existing_index()          # 1. Carrega o antigo (se existir)
    indexer.build_index(processed_data)    # 2. Adiciona os novos
    indexer.save_index()                   # 3. Guarda tudo (calculando skip pointers)

if __name__ == "__main__":
    run_indexer()