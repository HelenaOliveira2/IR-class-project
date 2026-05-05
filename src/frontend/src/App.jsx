import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import SearchBox from './components/SearchBox'; 
import ConfigPanel from './components/ConfigPanel';
import ResultItem from './components/ResultItem';
import './styles/main.scss';

function App() {
  // --- Estados de Configuração (REQ-F18 e REQ-F20) ---
  const [method, setMethod] = useState('stemming');
  const [excludeStopWords, setExcludeStopWords] = useState(false);
  const [language, setLanguage] = useState('pt');
  const [rankingAlgorithm, setRankingAlgorithm] = useState('custom_tfidf');
  const [weightingScheme, setWeightingScheme] = useState('log_normalization');

  // --- Estados de Dados e Resultados (REQ-F31, F33) ---
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchStats, setSearchStats] = useState({ total: 0, time: "0s" });
  const [lastQuery, setLastQuery] = useState('');

  // --- Novos Estados para REQ-F31, F32 e F34 ---
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('relevance');

  // REQ-F31, F32, F34: Dispara a pesquisa sempre que os filtros de visualização mudam
  useEffect(() => {
    if (lastQuery) {
      handlePerformSearch(lastQuery, 'general', currentPage);
    }
  }, [currentPage, resultsPerPage, sortBy]); // Escuta estas variáveis

  // --- Função Principal de Pesquisa (Conecta o Frontend ao Backend) ---
  const handlePerformSearch = async (query, mode = 'general', page = 1) => {
    if (!query) return;
    setLastQuery(query);
    setCurrentPage(page);
    setLoading(true);
    setResults([]); 
    
    try {
      let url = "";
  
      if (mode === 'author') {
        // Rota para pesquisa de autores (REQ-F24)[cite: 4, 5]
        url = `http://127.0.0.1:8000/api/authors/search?name=${encodeURIComponent(query)}`;
      } else {
        // Rota geral com todos os filtros aplicados
        const params = new URLSearchParams({
          q: query,
          method: method,
          ranking: rankingAlgorithm,
          weighting: weightingScheme,
          stop_words: excludeStopWords,
          lang: language,
          page: page,             // REQ-F31[cite: 1]
          limit: resultsPerPage,  // REQ-F32[cite: 1]
          sort_by: sortBy         // REQ-F34[cite: 1]
        });
        url = `http://127.0.0.1:8000/api/search?${params}`;
      }
  
      console.log("A enviar pedido para:", url);
  
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Erro na resposta do servidor");
      }
    
      const data = await response.json();
      console.log("Dados recebidos da API:", data);
  
      // Ajuste: A pesquisa de autor pode devolver um array direto ou um objeto com .results[cite: 4, 5]
      const finalResults = Array.isArray(data) ? data : (data.results || []);
  
      if (finalResults.length > 0 || (data.results && Array.isArray(data.results))) {
        setResults(finalResults);
        setSearchStats({ 
          total: data.total_count || finalResults.length, 
          time: data.search_time || "0s" 
        });
      } else {
        console.warn("Nenhum resultado encontrado.");
        setResults([]);
      }
  
    } catch (error) {
      console.error("Erro ao procurar documentos:", error);
      alert("Erro na ligação ao servidor Python (Porta 8000).");
    } finally {
      setLoading(false);
    }
  };

  // --- Novo Estado para REQ-F29 ---
  const [collection, setCollection] = useState([]);

  // --- Função para REQ-F29 (Guardar/Remover da Coleção) ---
  const toggleSaveToCollection = (doc) => {
    setCollection(prev => {
      const isAlreadySaved = prev.find(item => item.id === doc.id);
      if (isAlreadySaved) {
        return prev.filter(item => item.id !== doc.id); // Remove se já existir
      }
      return [...prev, doc]; // Adiciona à coleção
    });
  };

  // --- Função de Exportação Atualizada (REQ-F30) ---
  const handleExport = (format) => {
    // Constrói os parâmetros para o ficheiro exportado ter os dados da pesquisa atual[cite: 1, 4]
    const params = new URLSearchParams({
      q: lastQuery,
      method: method,
      lang: language
    });
    const url = `http://127.0.0.1:8000/api/export/${format}?${params.toString()}`;
    console.log("A exportar de:", url);
    window.open(`http://127.0.0.1:8000/api/export/${format}?${params}`, '_blank');
  };

  return (
    <Router>
      <div className="app-wrapper">
        <Header />
        
        <main className="main-container" role="main">
          <Routes>
            <Route path="/" element={
              <div style={{ textAlign: 'center', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
                <h2 style={{ fontSize: '2rem', color: '#2D3748', marginBottom: '0.5rem' }}>
                  Motor de Recuperação de Informação
                </h2>
                <p style={{ color: '#718096', marginBottom: '2rem' }}>
                  Pesquise metadados de publicações científicas do RepositóriUM
                </p>
                
                {/* O SearchBox envia a query para o handlePerformSearch */}
                <SearchBox 
                  onSearch={handlePerformSearch}
                  method={method} 
                  excludeStopWords={excludeStopWords} 
                  language={language}
                  rankingAlgorithm={rankingAlgorithm}
                  weightingScheme={weightingScheme}
                >
                  <ConfigPanel 
                    method={method} setMethod={setMethod}
                    excludeStopWords={excludeStopWords} setExcludeStopWords={setExcludeStopWords}
                    language={language} setLanguage={setLanguage}
                    rankingAlgorithm={rankingAlgorithm} setRankingAlgorithm={setRankingAlgorithm}
                    weightingScheme={weightingScheme} setWeightingScheme={setWeightingScheme}
                  />
                </SearchBox>

                {/* --- SEÇÃO DE RESULTADOS --- */}
                <div className="results-container" style={{ marginTop: '40px', textAlign: 'left' }}>
                  
                  {loading && (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <div className="spinner"></div>
                      <p>A pesquisar...</p>
                    </div>
                  )}

                  {!loading && results.length > 0 && (
                    <div className="results-content">
                      {/* Estatísticas e Exportação */}
                      <div className="stats-bar" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px' }}>
                        <div>
                          Encontrados <strong>{searchStats.total}</strong> resultados ({searchStats.time})
                        </div>
                        
                        <div style={{ display: 'flex', gap: '15px' }}>
                          {/* REQ-F32: Resultados por página */}
                          <select value={resultsPerPage} onChange={(e) => { setResultsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                            <option value={10}>10 por pág.</option>
                            <option value={20}>20 por pág.</option>
                            <option value={50}>50 por pág.</option>
                          </select>

                          {/* REQ-F34: Ordenação */}
                          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}>
                            <option value="relevance">Relevância</option>
                            <option value="date">Data</option>
                            <option value="title">Título</option>
                          </select>
                        </div>
                      </div>

                      {/* Renderização ÚNICA da Lista */}
                      <div className="results-list">
                      {results.map((doc, index) => (
                        <ResultItem 
                          key={doc.id || index} 
                          doc={doc} 
                          rank={index + 1} 
                          isSaved={collection.some(item => item.id === doc.id)} 
                          onSave={() => toggleSaveToCollection(doc)}          
                        />
                      ))}
                      </div>

                      <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                        <button 
                          disabled={currentPage === 1} 
                          onClick={() => handlePerformSearch(lastQuery, 'general', currentPage - 1)}
                        > Anterior </button>
                        <span>Página {currentPage}</span>
                        <button 
                          disabled={results.length < resultsPerPage}
                          onClick={() => handlePerformSearch(lastQuery, 'general', currentPage + 1)}
                        > Próxima </button>
                      </div>
                    </div>
                  )}

                  {/* Mensagem de "Sem resultados" apenas se não estiver a carregar e a lista estiver vazia */}
                  {!loading && results.length === 0 && (
                    <div style={{ textAlign: 'center', marginTop: '50px', color: '#94a3b8' }}>
                      <p>Aguardando pesquisa ou sem resultados para apresentar.</p>
                    </div>
                  )}
                </div>
              </div>
            } />
            <Route path="/authors" element={<div className="main-container"><h2>Pesquisa por Autores (Em breve)</h2></div>} />
            <Route path="/about" element={<div className="main-container"><h2>Sobre o Projecto</h2></div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;