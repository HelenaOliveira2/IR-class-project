from src.search.processor import process_from_db
from src.search.indexer import run_indexer

print("=== A construir índice: stemming + sem stopwords ===")
process_from_db(output_file='src/search/processed_stem_nostop.json', 
                use_stemming=True, remove_stopwords=True)
run_indexer(input_path='src/search/processed_stem_nostop.json',
            index_file='src/search/index_stem_nostop.json',
            metadata_file='src/search/meta_stem_nostop.json')

print("=== A construir índice: stemming + com stopwords ===")
process_from_db(output_file='src/search/processed_stem_stop.json',
                use_stemming=True, remove_stopwords=False)
run_indexer(input_path='src/search/processed_stem_stop.json',
            index_file='src/search/index_stem_stop.json',
            metadata_file='src/search/meta_stem_stop.json')

print("=== A construir índice: lemmatization + sem stopwords ===")
process_from_db(output_file='src/search/processed_lem_nostop.json',
                use_stemming=False, remove_stopwords=True)
run_indexer(input_path='src/search/processed_lem_nostop.json',
            index_file='src/search/index_lem_nostop.json',
            metadata_file='src/search/meta_lem_nostop.json')

print("=== A construir índice: lemmatization + com stopwords ===")
process_from_db(output_file='src/search/processed_lem_stop.json',
                use_stemming=False, remove_stopwords=False)
run_indexer(input_path='src/search/processed_lem_stop.json',
            index_file='src/search/index_lem_stop.json',
            metadata_file='src/search/meta_lem_stop.json')

print("✅ Todos os índices construídos!")