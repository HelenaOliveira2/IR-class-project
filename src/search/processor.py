import nltk
import json
import string
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer, WordNetLemmatizer
from nltk.tokenize import word_tokenize
import sqlite3

class TextProcessor:
    def __init__(self, language='english'):
        """
        REQ-B15 & REQ-B22: Suporte a múltiplos idiomas (Português/Inglês)
        REQ-B20: Configuração de Stop Words
        """
        self.language = language
        self.stemmer = PorterStemmer() # REQ-B16
        self.lemmatizer = WordNetLemmatizer() # REQ-B17
        
        # Carregar stop words para os dois idiomas (REQ-B22)
        self.stop_words = set(stopwords.words('english')).union(set(stopwords.words('portuguese')))

    def clean_text(self, text, use_stemming=True):
        """
        REQ-B14: Tokenização
        REQ-B21: Filtragem de Stop Words
        REQ-B18: Escolha entre Stemming ou Lematização
        """
        if not text or text == "N/A":
            return []

        # 1. Tokenização e conversão para minúsculas (REQ-B14)
        tokens = word_tokenize(text.lower())

        # 2. Remoção de pontuação e caracteres especiais
        table = str.maketrans('', '', string.punctuation)
        stripped = [w.translate(table) for w in tokens]

        # 3. Remover tokens vazios e stop words (REQ-B20, B21)
        words = [w for w in stripped if w.isalpha() and w not in self.stop_words]

        # 4. Aplicar Stemming ou Lematização (REQ-B18)
        if use_stemming:
            processed_words = [self.stemmer.stem(w) for w in words]
        else:
            processed_words = [self.lemmatizer.lemmatize(w) for w in words]

        return processed_words

def process_from_db(db_file='publications.db', output_file='src/search/processed_data.json'):
    """
    Lê os dados da SQLite (REQ-B09), processa (REQ-B13-22) e prepara para o índice.
    Cumpre REQ-B10 ao manter a relação com os dados originais via ID.
    """
    try:
        # 1. Ligar à base de dados
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # 2. Selecionar os dados necessários (REQ-B09)
        cursor.execute('SELECT id, title, abstract, year, doi, document_link FROM documents')
        rows = cursor.fetchall()
        
        processor = TextProcessor()
        processed_list = []
        
        print(f"--- A processar {len(rows)} documentos da Base de Dados ---")
        
        for row in rows:
            doc_id, title, abstract, year, doi, link = row
            
            # 3. Processar título e abstract (REQ-B13 a B22)
            processed_doc = {
                "id": doc_id,
                "title_tokens": processor.clean_text(title),
                "abstract_tokens": processor.clean_text(abstract),
                # Guardamos os metadados originais para referência (REQ-B10)
                "original_metadata": {
                    "title": title,
                    "year": year,
                    "doi": doi,
                    "document_link": link
                }
            }
            processed_list.append(processed_doc)
        
        # 4. Guardar o ficheiro de tokens para o Indexer
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(processed_list, f, ensure_ascii=False, indent=4)
            
        conn.close()
        print(f"Sucesso! {len(processed_list)} documentos processados e guardados em {output_file}")
            
    except sqlite3.Error as e:
        print(f"Erro ao ler a base de dados: {e}")
    except Exception as e:
        print(f"Ocorreu um erro inesperado: {e}")

if __name__ == "__main__":
    # Agora chamamos a nova função que lê da BD
    process_from_db()