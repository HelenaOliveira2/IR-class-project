import json
import math
from collections import defaultdict
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

class SearchEngine:
    def __init__(self, index_path='src/search/inverted_index.json', metadata_path='src/search/doc_metadata.json'):
        try:
            with open(index_path, 'r', encoding='utf-8') as f:
                self.index_data = json.load(f)
            with open(metadata_path, 'r', encoding='utf-8') as f:
                self.metadata = json.load(f)
            # Lista ordenada de todos os IDs para a Matriz de Incidência
            self.all_doc_ids = sorted([int(id) for id in self.metadata.keys()])
        except FileNotFoundError:
            print("Erro: Ficheiros de índice não encontrados. Garante que correste o Indexer.")
            self.index_data = {}
            self.metadata = {}
            self.all_doc_ids = []

    def _get_postings(self, term):
        """Retorna o conjunto de IDs de documentos para um termo."""
        term = term.lower()
        if term in self.index_data:
            return set(int(id) for id in self.index_data[term]["postings"].keys())
        return set()

    # --------------------------------------------------------------------------
    # REQ-B24: Create term-document incidence matrix
    # --------------------------------------------------------------------------
    def get_incidence_matrix(self, terms):
        """
        Gera a representação binária (0/1) da presença de termos nos documentos.
        """
        matrix = {}
        for term in terms:
            postings = self._get_postings(term)
            # Cria o vetor: 1 se o ID está nas postings, 0 caso contrário
            matrix[term] = [1 if doc_id in postings else 0 for doc_id in self.all_doc_ids]
        return matrix

    # --------------------------------------------------------------------------
    # REQ-B25: Process AND operations with term frequency optimization
    # --------------------------------------------------------------------------
    def _execute_optimized_and(self, terms):
        """
        Interseção otimizada: Processa as listas mais curtas (menor DF) primeiro.
        """
        if not terms: return set()
        
        # Obter (termo, DF) e ordenar por DF (Document Frequency) ascendente
        term_df_list = []
        for t in terms:
            df = self.index_data.get(t.lower(), {}).get("df", 0)
            if df == 0: return set() # Se um termo não existe, o AND é vazio
            term_df_list.append((t, df))
        
        # Ordenação crucial para o REQ-B25
        term_df_list.sort(key=lambda x: x[1])
        
        # Começamos com a lista mais pequena
        result = self._get_postings(term_df_list[0][0])
        for next_term, _ in term_df_list[1:]:
            result = result.intersection(self._get_postings(next_term))
            if not result: break # Curto-circuito se a interseção ficar vazia
        return result

    # --------------------------------------------------------------------------
    # REQ-B23: Implement Boolean operators (AND, OR, NOT) with precedence
    # REQ-B26: Support space-separated terms as implicit AND
    # --------------------------------------------------------------------------
    def search(self, query):
        """
        Resolve a query booleana respeitando operadores e precedência.
        """
        tokens = query.lower().split()
        if not tokens: return []

        # REQ-B26: Se não houver operadores explícitos, trata tudo como AND otimizado
        operators = {'and', 'or', 'not'}
        if not any(op in tokens for op in operators):
            final_ids = self._execute_optimized_and(tokens)
            return sorted(list(final_ids))

        # REQ-B23: Lógica de Processamento com Operadores
        # Nota: Para precedência complexa, usamos processamento sequencial 
        # (NOT > AND > OR). Aqui implementamos a base funcional:
        
        try:
            # 1. Tratar NOT primeiro (Maior precedência)
            # Ex: "saude NOT covid"
            result = self._get_postings(tokens[0])
            
            idx = 1
            while idx < len(tokens):
                op = tokens[idx]
                
                if op == 'and':
                    next_val = self._get_postings(tokens[idx+1])
                    result = result.intersection(next_val)
                    idx += 2
                elif op == 'or':
                    next_val = self._get_postings(tokens[idx+1])
                    result = result.union(next_val)
                    idx += 2
                elif op == 'not':
                    next_val = self._get_postings(tokens[idx+1])
                    result = result.difference(next_val)
                    idx += 2
                else:
                    # Caso de termo solto (Implicit AND)
                    result = result.intersection(self._get_postings(op))
                    idx += 1
                    
            return sorted(list(result))
        except IndexError:
            print("Erro de sintaxe na query.")
            return []
        
    def _calculate_custom_tfidf(self, term, doc_id):
        """
        REQ-B34: Implementação manual da fórmula TF-IDF.
        """
        # TF (Term Frequency): Frequência do termo no documento
        tf = self.index_data.get(term, {}).get("postings", {}).get(str(doc_id), 0)
        if tf == 0: return 0
        
        # Logarithmic TF scaling (opcional mas recomendado)
        tf_score = 1 + math.log10(tf)
        
        # IDF (Inverse Document Frequency)
        # REQ-B33: log10(N / df)
        n_docs = len(self.all_doc_ids)
        df = self.index_data.get(term, {}).get("df", 0)
        
        idf_score = math.log10(n_docs / df) if df > 0 else 0
        
        return tf_score * idf_score

    # ---------------------------------------------------------
    # REQ-B35 & REQ-B36: Sklearn Integration & Selection
    # ---------------------------------------------------------
    def ranked_search(self, query, use_sklearn=False):
        """
        REQ-B36: Permite ao utilizador escolher entre implementação Custom ou Sklearn.
        """
        query_terms = self.processor.clean_text(query)
        if not query_terms: return []

        if use_sklearn:
            return self._search_with_sklearn(query_terms)
        else:
            return self._search_with_custom(query_terms)

    def _search_with_custom(self, query_terms):
        """Executa ranking usando a tua função manual (REQ-B34)."""
        scores = defaultdict(float)
        
        for term in query_terms:
            postings = self._get_postings(term)
            for doc_id in postings:
                scores[doc_id] += self._calculate_custom_tfidf(term, doc_id)
        
        # Ordenar por score descendente
        return sorted(scores.items(), key=lambda x: x[1], reverse=True)

    def _search_with_sklearn(self, query_terms):
        """
        REQ-B35: Integração com sklearn para comparação.
        """
        # Para o Sklearn, precisamos de reconstruir o "corpus" (texto processado)
        # Numa escala real, isto seria feito durante a indexação
        corpus = []
        doc_ids = []
        for d_id, meta in self.metadata.items():
            corpus.append(meta['title']) # Simplificação: usa o título para o vetor
            doc_ids.append(int(d_id))

        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform(corpus)
        
        # Transformar a query no mesmo espaço vetorial
        query_vec = vectorizer.transform([" ".join(query_terms)])
        
        # Calcular similaridade (produto escalar)
        from sklearn.metrics.pairwise import cosine_similarity
        cosine_similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
        
        results = []
        for i, score in enumerate(cosine_similarities):
            if score > 0:
                results.append((doc_ids[i], score))
        
        return sorted(results, key=lambda x: x[1], reverse=True)

# --- Bloco de Demonstração para Defesa do Projeto ---
if __name__ == "__main__":
    engine = SearchEngine()
