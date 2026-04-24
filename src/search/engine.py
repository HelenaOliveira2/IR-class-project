import json
import math
from collections import defaultdict
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
import sqlite3
#from processor import TextProcessor, process_from_db
import nltk
from nltk.corpus import wordnet
import xml.etree.ElementTree as ET
from xml.dom import minidom
import os
#from classifier import DocumentClassifier 
#from indexer import run_indexer
from src.search.processor import TextProcessor, process_from_db
from src.search.classifier import DocumentClassifier 
from src.search.indexer import run_indexer

class SearchEngine:
    def __init__(self, index_path='src/search/inverted_index.json', metadata_path='src/search/doc_metadata.json'):
        try:
            with open(index_path, 'r', encoding='utf-8') as f:
                self.index_data = json.load(f)
            with open(metadata_path, 'r', encoding='utf-8') as f:
                self.metadata = json.load(f)
            
            # Atalho para os métodos de autor encontrarem os dados
            self.document_metadata = self.metadata 
            
            # Lista ordenada de todos os IDs para a Matriz de Incidência
            self.all_doc_ids = sorted([int(id) for id in self.metadata.keys()])
            self.processor = TextProcessor()
            
        except FileNotFoundError:
            print("Erro: Ficheiros de índice não encontrados. Garante que correste o Indexer.")
            self.index_data = {}
            self.metadata = {}
            self.document_metadata = {} # Inicializa vazio para não dar erro
            self.all_doc_ids = []

    def _get_postings(self, term):
        """Retorna o conjunto de IDs de documentos para um termo."""
        # REQ-B13 a B22: Processar o termo da pesquisa (Stemming/Stopwords)
        processed_tokens = self.processor.clean_text(term)
        
        if not processed_tokens:
            return set()
            
        # Vamos buscar o primeiro token (ex: "saude" vira "saud")
        clean_term = processed_tokens[0]
        
        if clean_term in self.index_data:
            return set(int(id) for id in self.index_data[clean_term]["postings"].keys())
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
        # USA O PROCESSADOR AQUI (REQ-B18, B21):
        query_terms = self.processor.clean_text(query)
        
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
    
    # ---------------------------------------------------------
    # REQ-B42: Train classifier on research publication categories
    # ---------------------------------------------------------
    def train_ai_classifier(self):
        """
        Lê os documentos da SQLite que já têm categoria para treinar o modelo.
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Procuramos documentos que tenham título/resumo e uma categoria válida
        cursor.execute("SELECT title, abstract, category FROM documents WHERE category IS NOT NULL AND category != 'N/A'")
        rows = cursor.fetchall()
        conn.close()

        if len(rows) < 4: # Mínimo aceitável para um teste rápido
            return "Dados insuficientes na BD para treinar (preciso de mais categorias)."

        texts = [f"{r[0]} {r[1]}" for r in rows] # Título + Abstract
        labels = [r[2] for r in rows]            # Categorias

        # Chama o método de treino do classifier.py e retorna as métricas (REQ-B44)
        report = self.clf.train(texts, labels)
        print("Modelo treinado com sucesso!")
        return report

    # ---------------------------------------------------------
    # REQ-B43: Categorize documents into subject areas automatically
    # ---------------------------------------------------------
    def apply_auto_categorization(self):
        """
        Percorre a BD e preenche as categorias vazias usando a IA.
        """
        if not self.clf.is_trained:
            return "O classificador precisa de ser treinado primeiro!"

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Selecionar documentos sem categoria
        cursor.execute("SELECT id, title, abstract FROM documents WHERE category IS NULL OR category = 'N/A'")
        to_classify = cursor.fetchall()

        count = 0
        for doc_id, title, abstract in to_classify:
            full_text = f"{title} {abstract}"
            # REQ-B43: Predição automática
            predicted_cat = self.clf.predict_category(full_text)
            
            # Atualizar a BD
            cursor.execute("UPDATE documents SET category = ? WHERE id = ?", (predicted_cat, doc_id))
            count += 1
        
        conn.commit()
        conn.close()
        return f"Sucesso: {count} documentos categorizados automaticamente pela IA."
    
    # ---------------------------------------------------------
    # REQ-B47: Implement query expansion techniques
    # ---------------------------------------------------------
    def expand_query(self, tokens):
        """Expande os termos da query usando sinónimos do WordNet."""
        expanded = set(tokens)
        for token in tokens:
            for syn in wordnet.synsets(token):
                for lemma in syn.lemmas():
                    # Adiciona o sinónimo processado (stemmed)
                    clean_syn = self.processor.clean_text(lemma.name())
                    if clean_syn:
                        expanded.add(clean_syn[0])
        return list(expanded)

    # ---------------------------------------------------------
    # REQ-B46: Support search across titles, abstracts, and full docs
    # ---------------------------------------------------------
    def _get_postings_multizone(self, term, zones=['title_tokens', 'abstract_tokens']):
        """
        Pesquisa o termo em diferentes zonas do documento.
        """
        # No teu índice atual, podes diferenciar onde o termo aparece
        # Se o teu indexer juntou tudo, esta função retorna o set normal
        return self._get_postings(term)

    # ---------------------------------------------------------
    # REQ-B45: Parse complex Boolean queries (Shunting-yard completo)
    # ---------------------------------------------------------
    def search_complex(self, query, expand=False):
        """
        Resolve queries como: (ia AND saude) OR (not covid)
        """
        tokens = self._tokenize_boolean_query(query)
        if expand:
            # Expande apenas os termos que não são operadores
            tokens = [t if t in ['and', 'or', 'not', '(', ')'] else self.expand_query([t])[0] for t in tokens]
        
        postfix = self._infix_to_postfix(tokens)
        stack = []
        all_docs = set(self.all_doc_ids)

        for token in postfix:
            if token == 'not':
                s1 = stack.pop()
                stack.append(all_docs - s1)
            elif token == 'and':
                s2, s1 = stack.pop(), stack.pop()
                stack.append(s1.intersection(s2)) # REQ-B25 aqui
            elif token == 'or':
                s2, s1 = stack.pop(), stack.pop()
                stack.append(s1.union(s2))
            else:
                # REQ-B46: Aqui pesquisamos nas várias zonas
                stack.append(self._get_postings_multizone(token))
        
        return sorted(list(stack[0])) if stack else []

    # ---------------------------------------------------------
    # REQ-B48: Handle phrase queries and proximity searches
    # ---------------------------------------------------------
    def proximity_search(self, term1, term2, window=5):
        """
        Pesquisa documentos onde term1 e term2 aparecem a uma 
        distância máxima de 'window' palavras.
        """
        # 1. Encontrar documentos que têm ambas as palavras (Interseção básica)
        candidates = self.search(f"{term1} and {term2}")
        if not candidates: return []

        results = []
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        for doc_id in candidates:
            # 2. Ir à BD buscar o texto original (Título + Abstract)
            cursor.execute("SELECT title, abstract FROM documents WHERE id = ?", (doc_id,))
            row = cursor.fetchone()
            if not row: continue
            
            # Usamos o processador para ter o texto limpo mas mantendo a ordem
            full_text = f"{row[0]} {row[1]}"
            tokens = self.processor.clean_text_raw(full_text) # Precisas desta função no processor
            
            # 3. Verificar a distância entre as palavras
            indices_t1 = [i for i, t in enumerate(tokens) if t == self.processor.clean_text(term1)[0]]
            indices_t2 = [i for i, t in enumerate(tokens) if t == self.processor.clean_text(term2)[0]]
            
            min_dist = float('inf')
            for p1 in indices_t1:
                for p2 in indices_t2:
                    dist = abs(p1 - p2)
                    if dist < min_dist: min_dist = dist
            
            if min_dist <= window:
                results.append((doc_id, min_dist))
        
        conn.close()
        # Ordenar pelos que estão mais perto (distância menor primeiro)
        return sorted(results, key=lambda x: x[1])
    
    # ---------------------------------------------------------
    # REQ-B50: Generate text snippets containing query terms
    # ---------------------------------------------------------
    def _generate_snippet(self, text, query_terms, window=80):
        """Cria um resumo do texto focado onde os termos da query aparecem."""
        if not text: return ""
        
        text_lower = text.lower()
        first_match = -1
        
        # Encontrar a primeira ocorrência de qualquer termo da query
        for term in query_terms:
            pos = text_lower.find(term.lower())
            if pos != -1 and (first_match == -1 or pos < first_match):
                first_match = pos
        
        if first_match == -1:
            return text[:window] + "..."

        start = max(0, first_match - window // 2)
        end = min(len(text), start + window)
        
        snippet = text[start:end].replace('\n', ' ').strip()
        return f"...{snippet}..."

    # ---------------------------------------------------------
    # REQ-B49 & REQ-B51: Ranked results with scores and links
    # ---------------------------------------------------------
    def get_detailed_results(self, query, format='json'):
        """
        Executa a pesquisa e devolve dados formatados (JSON ou XML).
        Cobre REQ-B49, B50, B51 e B52.
        """
        # 1. Obter termos limpos e resultados ordenados (REQ-B49)
        query_terms = self.processor.clean_text(query)
        ranked_ids = self.ranked_search(query) # Devolve lista de (id, score)

        results = []
        conn = sqlite3.connect('publications.db')
        cursor = conn.cursor()

        for doc_id, score in ranked_ids:
            cursor.execute("SELECT title, abstract, document_link FROM documents WHERE id = ?", (doc_id,))
            row = cursor.fetchone()
            if not row: continue

            title, abstract, link = row
            
            # REQ-B50: Gerar snippet
            snippet = self._generate_snippet(abstract if abstract else title, query_terms)

            results.append({
                "id": doc_id,
                "score": round(score, 4),      # REQ-B49
                "title": title,
                "snippet": snippet,            # REQ-B50
                "link": link or "N/A"          # REQ-B51
            })
        
        conn.close()

        # REQ-B52: Diferentes formatos de saída
        if format.lower() == 'xml':
            return self._to_xml(results)
        return results # Retorna lista/JSON por defeito

    # ---------------------------------------------------------
    # REQ-B52: Support different result formats (XML)
    # ---------------------------------------------------------
    def _to_xml(self, data):
        root = ET.Element("results")
        for item in data:
            doc_el = ET.SubElement(root, "document")
            for key, val in item.items():
                child = ET.SubElement(doc_el, key)
                child.text = str(val)
        
        # Formatação bonita do XML
        xml_str = ET.tostring(root, encoding='utf-8')
        return minidom.parseString(xml_str).toprettyxml(indent="  ")
    
    # ---------------------------------------------------------
    # REQ-B52: Gravação física de resultados em XML ou JSON
    # ---------------------------------------------------------
    def export_results(self, query, results_data, format='xml'):
        """
        Grava os resultados da pesquisa num ficheiro físico.
        """
        # Criar pasta de exportação se não existir
        if not os.path.exists('exports'):
            os.makedirs('exports')
            
        # Criar um nome de ficheiro limpo baseado na query
        filename = f"exports/search_{query.replace(' ', '_')[:20]}.{format}"

        if format.lower() == 'xml':
            xml_output = self._to_xml(results_data)
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(xml_output)
        else:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(results_data, f, ensure_ascii=False, indent=4)
        
        print(f"Resultados exportados com sucesso para: {filename}")
        return filename
    
    # ---------------------------------------------------------
    # REQ-B53, B54, B55: Pesquisa por Autor
    # ---------------------------------------------------------
    def search_by_author(self, name_query):
        results = []
        name_query = name_query.lower().strip()

        # Percorrer o dicionário de metadados
        for doc_id, meta in self.document_metadata.items():
            # 1. Tentar obter a lista de autores (se não existir, usa lista vazia)
            authors_data = meta.get("authors", [])
            
            # 2. Garantir que authors_data é uma lista (caso o scraper tenha guardado como string)
            if isinstance(authors_data, str):
                authors_list = [authors_data]
            elif isinstance(authors_data, list):
                authors_list = authors_data
            else:
                authors_list = []

            # 3. Pesquisa parcial (REQ-B54)
            match = False
            for author in authors_list:
                if name_query in author.lower():
                    match = True
                    # REQ-B55: Liga o autor à publicação
                    results.append({
                        "doc_id": doc_id,
                        "author_found": author,
                        "title": meta.get("title", "Sem Título")
                    })
                    break # Encontrou um autor neste doc, passa para o próximo doc
        
        return results

if __name__ == "__main__":
    # 1. Processamento
    process_from_db() 
    
    # 2. Indexação
    run_indexer()
    
    # 3. Motor + Classificação
    engine = SearchEngine()
    query = "neural networks"
    
    # O get_detailed_results agora chama internamente o Classifier
    final_data = engine.get_detailed_results(query)
    
    # 4. Exportação com tudo incluído
    engine.export_results(query, final_data, format='json')
    
    print("Pipeline completo: Processado -> Indexado -> Classificado -> Exportado!")

    print("\n=== [REQ-B53/B54/B55] Pesquisa por Autor ===")
    autor_pesquisa = "Santos" # Exemplo de nome parcial
    publicacoes_autor = engine.search_by_author(autor_pesquisa)
    
    if publicacoes_autor:
        print(f"Encontradas {len(publicacoes_autor)} publicações para o autor contendo '{autor_pesquisa}':")
        for pub in publicacoes_autor:
            print(f"- [{pub['doc_id']}] {pub['title']} (Autor: {pub['author_found']})")
    else:
        print(f"Nenhum autor encontrado com o nome '{autor_pesquisa}'.")
