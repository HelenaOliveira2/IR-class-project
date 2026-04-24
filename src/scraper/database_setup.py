import sqlite3
import json
import os

def setup_database(json_file='src/scraper/scraper_results.json', db_file='publications.db'):
    # Conectar (ou criar) a base de dados
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    # 1. Criar Tabelas (REQ-B09)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            abstract TEXT,
            year TEXT,
            doi TEXT,
            document_link TEXT,
            authors TEXT  -- GARANTE QUE ESTA LINHA EXISTE
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS authors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            affiliation TEXT
        )
    ''')

    # Tabela de ligação para REQ-B11 (Relacionamento N-para-N)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS document_authors (
            document_id INTEGER,
            author_id INTEGER,
            FOREIGN KEY (document_id) REFERENCES documents (id),
            FOREIGN KEY (author_id) REFERENCES authors (id)
        )
    ''')

    # 2. Ler os dados do JSON
    with open(json_file, 'r', encoding='utf-8') as f:
        publications = json.load(f)

    # 3. Inserir os dados
    for pub in publications:
        # Inserir Documento
        cursor.execute('''
            INSERT INTO documents (title, year, doi, abstract, document_link, authors)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            pub['title'], 
            pub['year'], 
            pub['doi'], 
            pub['abstract'], 
            pub['document_link'], 
            # Convertemos a lista de autores numa string para a coluna 'authors' da tabela 'documents'
            ", ".join(pub['authors']) if isinstance(pub['authors'], list) else pub['authors']
        ))
        
        doc_id = cursor.lastrowid

        # Inserir Autores e criar relações
        for i, author_name in enumerate(pub['authors']):
            # Tenta obter a afiliação correspondente (se existir na lista)
            aff = pub['affiliations'][i] if i < len(pub['affiliations']) else "N/A"
            
            # Inserir autor (ignora se já existir pelo nome UNIQUE)
            cursor.execute('INSERT OR IGNORE INTO authors (name, affiliation) VALUES (?, ?)', (author_name, aff))
            
            # Obter o ID do autor
            cursor.execute('SELECT id FROM authors WHERE name = ?', (author_name,))
            author_id = cursor.fetchone()[0]

            # Criar relação (REQ-B11)
            cursor.execute('INSERT INTO document_authors (document_id, author_id) VALUES (?, ?)', (doc_id, author_id))

    conn.commit()
    conn.close()
    print(f"Migração concluída! Base de dados '{db_file}' criada com sucesso.")

if __name__ == "__main__":
    setup_database()