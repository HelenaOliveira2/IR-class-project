import time

import nltk
import json
import string
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer, WordNetLemmatizer
from nltk.tokenize import sent_tokenize, word_tokenize

# REQ-B13: Descarregar recursos necessários do NLTK
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('omw-1.4')
nltk.download('punkt_tab')

from nltk.tokenize import word_tokenize, sent_tokenize
import sqlite3
import os


class TextProcessor:
    def __init__(self, language='english'):
        self.language = language
        self.stemmer = PorterStemmer() 
        self.lemmatizer = WordNetLemmatizer() 
        
        # Faz os downloads silenciosamente (quiet=True) caso falte algum.
        # Assim garantimos que o projeto corre perfeitamente no PC do professor!
        nltk.download('stopwords', quiet=True)
        nltk.download('punkt', quiet=True)
        nltk.download('punkt_tab', quiet=True)
        nltk.download('wordnet', quiet=True)
        
        # REQ-B22: Carregar stop words
        self.stop_words = set(stopwords.words('english')).union(set(stopwords.words('portuguese')))

    def clean_text(self, text, use_stemming=True, remove_stopwords=True):
        """REQ-B14, B18, B21: Tokenização, Stemming e Filtragem"""
        if not text or text == "N/A":
            return []

        # Tokenização e Lowercase
        tokens = word_tokenize(text.lower())

        # Remoção de pontuação
        table = str.maketrans('', '', string.punctuation)
        stripped = [w.translate(table) for w in tokens]

        # Filtragem (REQ-B21)
        if remove_stopwords:
            words = [w for w in stripped if w.isalpha() and w not in self.stop_words]
        else:
            words = [w for w in stripped if w.isalpha()]

        # Processamento (REQ-B18)
        if use_stemming:
            return [self.stemmer.stem(w) for w in words]
        return [self.lemmatizer.lemmatize(w) for w in words]

    def clean_text_raw(self, text):
        """REQ-B48: Mantém a ordem e duplicados para pesquisa de proximidade"""
        if not text: return []
        tokens = word_tokenize(text.lower())
        # Removemos pontuação mas mantemos a estrutura sequencial
        table = str.maketrans('', '', string.punctuation)
        words = [w.translate(table) for w in tokens if w.translate(table).isalpha()]
        # Aplicamos apenas o stemmer para coincidir com o índice
        return [self.stemmer.stem(w) for w in words if w not in self.stop_words]

# --- FUNÇÃO FORA DA CLASSE (Para evitar o NameError) ---

def process_from_db(db_file='publications.db', output_file='src/search/processed_data.json'):
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    
    # ADICIONA 'authors' e 'year' aqui no SELECT
    cursor.execute('SELECT id, title, abstract, year, doi, document_link, authors FROM documents')
    rows = cursor.fetchall()
    
    processor = TextProcessor()
    processed_list = []
    
    for row in rows:
        # Desempacota as 7 colunas (agora incluindo authors)
        doc_id, title, abstract, year, doi, link, authors_raw = row
        
        # O SQLite guarda listas como strings. Se os autores estiverem separados por vírgulas:
        authors_list = [a.strip() for a in authors_raw.split(',')] if authors_raw else []

        processed_doc = {
            "id": doc_id,
            "title_tokens": processor.clean_text(title),
            "abstract_tokens": processor.clean_text(abstract),
            "original_metadata": {
                "title": title,
                "year": year,
                "authors": authors_list,  # <--- CRUCIAL: Adicionar aqui!
                "doi": doi,
                "document_link": link
            }
        }
        processed_list.append(processed_doc)
        
    # Garantir que a pasta existe
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(processed_list, f, ensure_ascii=False, indent=4)
        
    conn.close()
    print(f"Sucesso! Dados guardados em {output_file}")

#REQ-B14
def segment_and_tokenize(text):
    #Segmentação
    sentences = sent_tokenize(text)
    
    #Tokenização
    all_tokens = []
    for sentence in sentences:
        tokens = word_tokenize(sentence.lower())
        all_tokens.extend(tokens)
        
    return sentences, all_tokens

#REQ-B19
def compare_nlp_strategies(tokens):
    stemmer = PorterStemmer()
    lemmatizer = WordNetLemmatizer()
    
    # Testar Stemming
    start = time.time()
    stems = [stemmer.stem(t) for t in tokens]
    end_stem = time.time() - start
    
    # Testar Lemmatization
    start = time.time()
    lemmas = [lemmatizer.lemmatize(t) for t in tokens]
    end_lem = time.time() - start
    
    print(f"--- Performance ---")
    print(f"Stemming: {end_stem:.5f}s | Termos únicos: {len(set(stems))}")
    print(f"Lemmatization: {end_lem:.5f}s | Termos únicos: {len(set(lemmas))}")
    
    return stems, lemmas

#REQ-B21
def process_with_stopword_control(tokens, remove_stopwords=True, lang='portuguese'):
    if not remove_stopwords:
        return tokens # Retorna todos os termos, incluindo "de", "o", "a"
    
    stop_words = set(stopwords.words(lang))
    # Adiciona stop words de inglês também para cobrir o REQ-B22
    stop_words.update(stopwords.words('english'))
    
    filtered_tokens = [t for t in tokens if t.lower() not in stop_words and t.isalpha()]
    return filtered_tokens


if __name__ == "__main__":
<<<<<<< HEAD
    # Correr o processamento
    process_scraped_data()

    # Agora chamamos a nova função que lê da BD
    process_from_db()

=======
    process_from_db()

    
>>>>>>> 63330b50b79449964436f8ec97d77766c096ddb2
