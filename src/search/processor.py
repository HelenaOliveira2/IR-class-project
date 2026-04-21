import nltk
import json
import string
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer, WordNetLemmatizer
from nltk.tokenize import word_tokenize

# REQ-B13: Descarregar recursos necessários do NLTK
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('omw-1.4')
nltk.download('punkt_tab')

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

def process_scraped_data(input_file='../scraper/scraper_results.json', output_file='processed_data.json'):
    """
    Lê os dados brutos, aplica NLP e guarda o resultado para ser usado pelo Indexer.
    Cumpre REQ-B10 (Store raw and processed versions).
    """
    try:
        # Tenta ler da raiz do projeto
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        processor = TextProcessor()
        processed_list = []
        
        print(f"--- A processar e guardar {len(data)} documentos ---")
        
        for doc in data:
            # Processamos título e abstract
            # REQ-B13 a B22 aplicados aqui dentro do clean_text
            processed_doc = {
                "id": data.index(doc), # Criamos um ID numérico para o índice
                "title_tokens": processor.clean_text(doc['title']),
                "abstract_tokens": processor.clean_text(doc['abstract']),
                "original_data": doc # Mantemos a referência ao original (REQ-B10)
            }
            processed_list.append(processed_doc)
        
        # Guardar o ficheiro processado
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(processed_list, f, ensure_ascii=False, indent=4)
            
        print(f"Sucesso! Dados processados guardados em: {output_file}")
            
    except FileNotFoundError:
        print(f"Erro: Ficheiro {input_file} não encontrado na raiz.")

if __name__ == "__main__":
    # Correr o processamento
    process_scraped_data()