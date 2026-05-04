import sqlite3
import os

def setup_database(data_list, db_file='publications.db'):
    """
    REQ-B09 & REQ-B11: Configura a BD e insere os dados diretamente da lista do scraper.
    """
    # Conectar (ou criar) a base de dados
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    # 1. Criar Tabelas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            abstract TEXT,
            year TEXT,
            doi TEXT,
            document_link TEXT,
            authors TEXT 
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS authors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            affiliation TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS document_authors (
            document_id INTEGER,
            author_id INTEGER,
            FOREIGN KEY (document_id) REFERENCES documents (id),
            FOREIGN KEY (author_id) REFERENCES authors (id)
        )
    ''')

    # 2. Inserir os dados diretamente da data_list
    # Já não precisamos do 'with open(json_file)...'
    for pub in data_list:
        # Inserir Documento (REQ-B09)
        cursor.execute('''
            INSERT INTO documents (title, year, doi, abstract, document_link, authors)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            pub.get('title', 'N/A'), 
            pub.get('year', 'N/A'), 
            pub.get('doi', 'N/A'), 
            pub.get('abstract', 'N/A'), 
            pub.get('document_link', 'N/A'),
            ", ".join(pub.get('authors', [])) if isinstance(pub.get('authors'), list) else pub.get('authors', 'N/A')
        ))
        
        doc_id = cursor.lastrowid

        # 3. Inserir Autores e criar relações (REQ-B11)
        authors = pub.get('authors', [])
        affiliations = pub.get('affiliations', [])

        for i, author_name in enumerate(authors):
            # Tenta obter a afiliação correspondente
            aff = affiliations[i] if i < len(affiliations) else "N/A"
            
            # Inserir autor (ignora se já existir)
            cursor.execute('INSERT OR IGNORE INTO authors (name, affiliation) VALUES (?, ?)', (author_name, aff))
            
            # Obter o ID do autor
            cursor.execute('SELECT id FROM authors WHERE name = ?', (author_name,))
            res = cursor.fetchone()
            if res:
                author_id = res[0]
                # Criar relação na tabela intermédia
                cursor.execute('INSERT INTO document_authors (document_id, author_id) VALUES (?, ?)', (doc_id, author_id))

    conn.commit()
    conn.close()
    print(f"Sucesso! {len(data_list)} documentos processados na BD '{db_file}'.")

# Se quiseres testar este ficheiro sozinho, precisas de passar uma lista vazia ou dummy
if __name__ == "__main__":
    setup_database([])