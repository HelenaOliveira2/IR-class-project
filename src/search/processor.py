import nltk
import json
import string
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer, WordNetLemmatizer
from nltk.tokenize import word_tokenize, sent_tokenize
import sqlite3
import os

class TextProcessor:
    def __init__(self, language='english'):
        self.language = language
        self.stemmer = PorterStemmer() 
        self.lemmatizer = WordNetLemmatizer() 
        
        # REQ-B22: Carregar stop words para os dois idiomas
        try:
            self.stop_words = set(stopwords.words('english')).union(set(stopwords.words('portuguese')))
        except:
            nltk.download('stopwords')
            nltk.download('punkt')
            nltk.download('wordnet')
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
    """
    Lê os dados da SQLite e prepara o JSON para o Indexer.
    """
    if not os.path.exists(db_file):
        print(f"Erro: Base de dados {db_file} não encontrada!")
        return

    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, title, abstract, year, doi, document_link FROM documents')
        rows = cursor.fetchall()
        
        processor = TextProcessor()
        processed_list = []
        
        print(f"--- A processar {len(rows)} documentos da Base de Dados ---")
        
        for row in rows:
            doc_id, title, abstract, year, doi, link = row
            
            processed_doc = {
                "id": doc_id,
                "title_tokens": processor.clean_text(title),
                "abstract_tokens": processor.clean_text(abstract),
                "original_metadata": {
                    "title": title,
                    "year": year,
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
            
    except sqlite3.Error as e:
        print(f"Erro ao ler a base de dados: {e}")

if __name__ == "__main__":
    process_from_db()