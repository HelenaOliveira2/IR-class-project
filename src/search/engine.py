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
    # REQ-B23: Implement Boolean operators (AND, OR, NOT) with precedence
    # REQ-B25: Process AND operations with term frequency optimization
    # REQ-B26: Support space-separated terms as implicit AND
    # --------------------------------------------------------------------------
    def _tokenize_boolean_query(self, query):
        """REQ-B26: Tokeniza a query, lida com parênteses e insere AND implícito."""
        # Limpar e dar espaço aos parênteses para o split() não colar palavras aos parênteses
        query = query.lower().replace('(', ' ( ').replace(')', ' ) ')
        tokens = query.split()
        
        processed_tokens = []
        for i, token in enumerate(tokens):
            if i > 0:
                prev = tokens[i-1]
                # Se a palavra anterior for um termo normal (ou parênteses a fechar) 
                # e a atual também for um termo normal (ou parênteses a abrir), insere AND.
                prev_is_term = prev not in ['and', 'or', 'not', '(']
                curr_is_term = token not in ['and', 'or', ')']
                if prev_is_term and curr_is_term:
                    processed_tokens.append('and')
            processed_tokens.append(token)
        return processed_tokens

    def _infix_to_postfix(self, tokens):
        """REQ-B23: Algoritmo Shunting-yard para garantir NOT > AND > OR."""
        precedence = {'not': 3, 'and': 2, 'or': 1, '(': 0}
        output = []
        stack = []
        
        for token in tokens:
            if token == '(':
                stack.append(token)
            elif token == ')':
                while stack and stack[-1] != '(':
                    output.append(stack.pop())
                if stack: 
                    stack.pop() # Remove o '('
            elif token in precedence:
                while stack and precedence.get(stack[-1], 0) >= precedence[token]:
                    output.append(stack.pop())
                stack.append(token)
            else:
                output.append(token) # É um termo
                
        while stack:
            output.append(stack.pop())
        return output

    def search(self, query):
        """
        Resolve a query booleana respeitando matemática rigorosa.
        Substitui a versão anterior para resolver precedências complexas.
        """
        tokens = self._tokenize_boolean_query(query)
        if not tokens: return []
        
        postfix = self._infix_to_postfix(tokens)
        stack = []
        
        # O universo de todos os documentos (para podermos fazer o operador NOT)
        all_docs_set = set(self.all_doc_ids)
        
        for token in postfix:
            if token == 'not':
                if stack:
                    s1 = stack.pop()
                    stack.append(all_docs_set - s1)
            elif token == 'and':
                if len(stack) >= 2:
                    s2 = stack.pop()
                    s1 = stack.pop()
                    # REQ-B25: Otimização do AND - Interseta começando pelo conjunto mais pequeno
                    if len(s1) <= len(s2):
                        stack.append(s1.intersection(s2))
                    else:
                        stack.append(s2.intersection(s1))
            elif token == 'or':
                if len(stack) >= 2:
                    s2 = stack.pop()
                    s1 = stack.pop()
                    stack.append(s1.union(s2))
            else:
                # É um termo de pesquisa normal
                stack.append(self._get_postings(token))
                
        # O resultado final é o único conjunto que sobra na pilha
        result = stack[0] if stack else set()
        return sorted(list(result))
        
    # ---------------------------------------------------------
    # REQ-B32, B33, B34: TF e IDF manuais
    # REQ-B39: Support ranking by different weighting schemes
    # ---------------------------------------------------------
    def _calculate_custom_weight(self, term, doc_id, scheme="tfidf"):
        """
        Calcula o peso. Suporta os esquemas: 'tfidf' (default), 'tf', e 'boolean'.
        """
        # REQ-B32: Term Frequency (TF)
        tf = self.index_data.get(term, {}).get("postings", {}).get(str(doc_id), 0)
        
        if scheme == "boolean":
            return 1 if tf > 0 else 0
            
        if tf == 0: return 0
        tf_score = 1 + math.log10(tf)
        
        if scheme == "tf":
            return tf_score
            
        # REQ-B33: Inverse Document Frequency (IDF)
        n_docs = len(self.all_doc_ids)
        df = self.index_data.get(term, {}).get("df", 0)
        idf_score = math.log10(n_docs / df) if df > 0 else 0
        
        # REQ-B34: TF-IDF Custom
        return tf_score * idf_score

    # ---------------------------------------------------------
    # REQ-B35 & REQ-B36: Sklearn Integration & Selection
    # ---------------------------------------------------------
    def ranked_search(self, query, use_sklearn=False, scheme="tfidf"):
        """
        REQ-B36: Seleção entre Custom e Sklearn.
        """
        # Limpeza básica para os testes no terminal.
        # Numa API real, deves passar a query pelo TextProcessor do Módulo 2.
        import string
        query_terms = [w.strip(string.punctuation).lower() for w in query.split() if w.isalpha()]
        
        if not query_terms: return []

        if use_sklearn:
            return self._search_with_sklearn(query_terms)
        else:
            return self._search_with_custom(query_terms, scheme)

    # ---------------------------------------------------------
    # REQ-B37: Implement cosine similarity calculation
    # REQ-B38: Rank search results by relevance scores
    # ---------------------------------------------------------
    def _search_with_custom(self, query_terms, scheme="tfidf"):
        """
        Calcula a Similaridade do Cosseno manualmente.
        """
        # Vetor da Query (assumimos peso 1 para cada termo pesquisado)
        query_vector = {term: 1 for term in query_terms}
        
        # Encontrar documentos que têm pelo menos um termo
        relevant_docs = set()
        for term in query_terms:
            relevant_docs.update(self._get_postings(term))
            
        scores = {}
        for doc_id in relevant_docs:
            dot_product = 0.0
            doc_norm_sq = 0.0
            query_norm_sq = 0.0
            
            for term in query_terms:
                w_doc = self._calculate_custom_weight(term, doc_id, scheme)
                w_query = query_vector[term]
                
                dot_product += (w_doc * w_query)
                doc_norm_sq += (w_doc ** 2)
                query_norm_sq += (w_query ** 2)
                
            doc_norm = math.sqrt(doc_norm_sq)
            query_norm = math.sqrt(query_norm_sq)
            
            # REQ-B37: Fórmula Cosine Similarity
            if doc_norm > 0 and query_norm > 0:
                cosine_sim = dot_product / (doc_norm * query_norm)
                scores[doc_id] = cosine_sim
                
        # REQ-B38: Ordenar resultados pelo score (maior para menor)
        return sorted(scores.items(), key=lambda x: x[1], reverse=True)

    def _search_with_sklearn(self, query_terms):
        """REQ-B35: Integração com sklearn para comparação."""
        corpus = []
        doc_ids = []
        for d_id, meta in self.metadata.items():
            texto = meta.get('title', '') + " " + meta.get('abstract', '')
            corpus.append(texto)
            doc_ids.append(int(d_id))

        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform(corpus)
        query_vec = vectorizer.transform([" ".join(query_terms)])
        
        from sklearn.metrics.pairwise import cosine_similarity
        cosine_similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
        
        results = [(doc_ids[i], score) for i, score in enumerate(cosine_similarities) if score > 0]
        return sorted(results, key=lambda x: x[1], reverse=True)

    # ---------------------------------------------------------
    # REQ-B40: Generate document similarity matrices
    # ---------------------------------------------------------
    def generate_document_similarity_matrix(self):
        """
        Gera matriz de similaridade entre todos os documentos da coleção.
        """
        corpus = []
        doc_ids = []
        for d_id, meta in self.metadata.items():
            texto = meta.get('title', '') + " " + meta.get('abstract', '')
            corpus.append(texto)
            doc_ids.append(d_id)

        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform(corpus)
        
        from sklearn.metrics.pairwise import cosine_similarity
        doc_sim_matrix = cosine_similarity(tfidf_matrix)
        
        print("\n--- Matriz de Similaridade de Documentos (Top 5x5) ---")
        for i in range(min(5, len(doc_ids))):
            linha = [f"{score:.2f}" for score in doc_sim_matrix[i][:5]]
            print(f"Doc {doc_ids[i]}: {linha}")
            
        return doc_sim_matrix

# --- Bloco de Demonstração para Defesa do Projeto ---
if __name__ == "__main__":
    engine = SearchEngine()
    
    print("1. Motor Booleano (REQ-B23):", engine.search("saude AND covid"))
    
    print("\n2. Ranking Manual TF-IDF (REQ-B34, B37):")
    print(engine.ranked_search("machine learning", use_sklearn=False, scheme="tfidf"))
    
    print("\n3. Ranking com Sklearn (REQ-B35):")
    print(engine.ranked_search("machine learning", use_sklearn=True))
    
    print("\n4. Ranking Manual apenas TF (REQ-B39):")
    print(engine.ranked_search("machine learning", use_sklearn=False, scheme="tf"))
    
    engine.generate_document_similarity_matrix()
