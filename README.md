#  Sistema de Pesquisa de Publicações Científicas

Motor de Recuperação de Informação desenvolvido no âmbito do Mestrado em Engenharia Biomédica, focado na extração, indexação, pesquisa e visualização de publicações científicas do RepositóriUM da Universidade do Minho.

O sistema implementa um ecossistema completo de *Information Retrieval* (IR), integrando:
- Web Scraping automatizado
- Processamento de Linguagem Natural (NLP)
- Indexação Invertida
- Algoritmos de Ranking TF-IDF
- Pesquisa Booleana
- API RESTful em FastAPI
- Frontend SPA em React
- Dashboards Analíticos
- Infraestrutura Dockerizada

---

##  Funcionalidades Principais

### 1. Recolha e Armazenamento de Dados
* **Web Scraping Automatizado:** Sistema de scraping desenvolvido com Selenium WebDriver para navegação dinâmica no RepositóriUM (DSpace 7 Angular).
* **Extração de Metadados:** O scraper extrai automaticamente Título, Abstract, Autores, DOI, Ano, Keywords, Afiliações e Links permanentes dos documentos.
* **Persistência Estruturada:** Todos os dados são armazenados numa base de dados SQLite (`publications.db`).

### 2. Processamento de Linguagem Natural (NLP)
* **Pipeline Textual:** O sistema implementa Tokenização, Lowercasing, Remoção de pontuação e Filtragem de Stop Words.
* **Suporte Bilingue:** Suporte simultâneo para Português e Inglês através da biblioteca NLTK.
* **Estratégias de Normalização:** Foram implementadas duas abordagens:
  * **Stemming** (PorterStemmer / Snowball)
  * **Lemmatization** (WordNetLemmatizer)

### 3. Motor de Indexação Invertida
* **Arquitetura Híbrida:** O sistema implementa uma estratégia híbrida: Extração *Full-Text* dos primeiros 20 PDFs via PyMuPDF (`fitz`), sendo a restante coleção indexada via metadados estruturados.
* **Índices Persistentes:** Os índices invertidos são armazenados em JSON (`inverted_index.json`, `doc_metadata.json`).
* **Pesquisa em RAM:** Os índices são carregados em memória para minimizar a latência.

### 4. Algoritmos de Pesquisa e Ranking
* **Pesquisa Booleana:** Suporte para operadores `AND`, `OR`, `NOT`, incluindo parsing lógico complexo.
* **Ranking Vetorial TF-IDF:** Implementação manual de TF, TF-IDF e Similaridade do Cosseno.
* **Scikit-Learn:** Integração opcional com `TfidfVectorizer` e `cosine_similarity` para validação matemática dos resultados.

### 5. API RESTful (FastAPI) e Monitorização
* **Endpoints REST:** Pesquisa de documentos, autores, exportação (CSV/JSON/BibTeX), dashboard estatístico e perfis avançados.
* **Swagger UI:** Documentação automática disponível em `http://localhost:8000/docs`.
* **Logging:** Sistema centralizado de logs para debug, medição de performance e gestão de erros.

### 6. Frontend React SPA
* **Interface Moderna:** Desenvolvido com React, Vite, SCSS e Axios.
* **Dashboard Analítico:** Visualizações construídas com Recharts (Bar Charts, Pie Charts, Area Charts, Line Charts).
* **Funcionalidades Interativas:** Pesquisa avançada, Query Builder Booleano, filtros dinâmicos, comparação de algoritmos, redes de coautoria e persistência de estado via URL.

---

##  Funcionalidades Educativas
O sistema inclui módulos pedagógicos para explicar conceitos de Recuperação de Informação:
* Índices Invertidos
* Cálculos de TF-IDF e Similaridade do Cosseno
* Operações Booleanas e Comparação de algoritmos

---

##  Docker e Contentorização
Infraestrutura totalmente dockerizada utilizando **Docker** e **Docker Compose**.
* **Backend Container:** Executa Python 3.11, FastAPI, SQLite e gere os Índices JSON.
* **Frontend Container:** Executa React SPA gerado via Vite.
* **Comunicação Interna:** Rede virtual Docker (*bridge network*) para comunicação segura, baixa latência e isolamento.

---


## 📂 Estrutura do Projeto

```plaintext
IR-class-project/
├── exports/
├── src/
│   ├── scraper/
│   │   ├── main.py
|   |   ├── database_setup.py
│   │   └── scraper.py
│   ├── search/
│   │   ├── engine.py
│   │   ├── indexer.py
│   │   ├── processor.py
|   |   ├── classifier.py
│   │   └── rebuild_indexes.json
│   ├── api/
│   │   ├── api.py
│   │   ├── logger.py
│   │   └── config.py
│   └── frontend/          
│       ├── public/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── styles/
│       │   ├── test/
│       │   ├── App.jsx
│       │   ├── App.test.jsx
│       │   └── main.jsx
│       ├── index.html
│       ├── package.json
│       ├── vite.config.js
│       └── vitest.config.js
├── tests/
│       ├── tesr_api.py
│       ├── test_scraper.py
│       └── test_search.py
├── evaluation.py
├── publications.db
├── requirements.txt
├── README.md
├── Dockerfile.backend
├── Dockerfile.frontend
└── docker-compose.yml
```

## Instalação e Execução

### Pré-requisitos
* Python 3.11+
* Docker e Docker Compose
* Google Chrome (para Web Scraping)

### Configuração Local

1. **Clonar o Repositório**
`git clone <repo-url>`
`cd IR-class-project`


2. Criar Ambiente Virtual

`python -m venv venv`
`.\venv\Scripts\activate`

3. Instalar Dependências
`pip install -r requirements.txt`

### Extração e Processamento

1. Executar o Scraper
Isto irá navegar automaticamente no RepositóriUM, extrair metadados científicos e gerar a publications.db
`python src/scraper/main.py`

2. Gerar Índices Invertidos
Este processo limpa o texto, aplica NLP, extrai Full-Text, calcula índices invertidos e guarda as estruturas JSON.
`python -m src.search.engine`

3. Avaliação Experimental
O script mede o tempo de indexação, o consumo de RAM, a latência de pesquisa e a consistência de ranking.
`python evaluation.py`

### Execução com Docker

- Inicializar todo o sistema
`docker compose up --build`


- Interfaces Disponíveis
    * Frontend React: http://localhost:5173
    * API Swagger: http://localhost:8000/docs

# Resultados Experimentais

| Métrica | Resultado |
|---|---|
| Indexação com Stemming | ~1.13s |
| RAM (Stemming) | ~3.79 MB |
| Indexação com Lemmatization | ~43.45s |
| RAM (Lemmatization) | ~166.94 MB |
| Latência de Pesquisa (TF-IDF) | ~208 ms |
| Latência de Pesquisa (Scikit-Learn) | ~139 ms |


# Tecnologias Utilizadas

## Backend
- Python 3.11
- FastAPI
- SQLite
- Uvicorn

## NLP & IA
- NLTK
- PyMuPDF
- Scikit-Learn

## Frontend
- React
- Vite
- SCSS
- Axios
- Recharts

## Infraestrutura
- Docker
- Docker Compose
- Selenium WebDriver

---

# Funcionalidades de Investigação

O projeto inclui:

- Comparação empírica de algoritmos
- Avaliação de ranking
- Precision / Recall
- Performance benchmarking
- Estratégias híbridas de indexação

---

# Trabalho Futuro

Possíveis extensões futuras:

- Integração com PubMed e arXiv
- Modelos Transformer (BERT)
- Relevance Feedback
- Pesquisa Semântica
- Recomendações Inteligentes
- Clustering de documentos
- Pesquisa multimodal

# Contexto Académico

Projeto desenvolvido no âmbito da unidade curricular de:

## Processamento e Recuperação de Informação (PRI)

### Mestrado em Engenharia Biomédica