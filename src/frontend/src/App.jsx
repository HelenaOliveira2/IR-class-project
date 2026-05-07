import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import SearchBox from './components/SearchBox'; 
import ConfigPanel from './components/ConfigPanel';
import ResultItem from './components/ResultItem';
// REQ-F35: Importação da página dedicada de autores
import AuthorPage from './pages/AuthorPage';
import AboutPage from './pages/AboutPage';
import ComparePage from './pages/ComparePage';
import AdminDashboard from './pages/AdminDashboard';   
import './styles/main.scss';


function App() {
  // REQ-F43: Estado para intervalo de datas (Advanced Filters)
  const [dateRange, setDateRange] = useState({ min: '', max: '' });
  
  // REQ-F44: Estado para tipos de documento (PhD, MSc, Articles)
  const [docTypes, setDocTypes] = useState([]);
  
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
  }, [currentPage, resultsPerPage, sortBy]); 

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
        // REQ-F46: Rota geral com combinação de filtros avançados
        const params = new URLSearchParams({
          q: query,
          method: method,
          ranking: rankingAlgorithm,
          weighting: weightingScheme,
          stop_words: excludeStopWords,
          lang: language,
          page: page,             // REQ-F31[cite: 1]
          limit: resultsPerPage,  // REQ-F32[cite: 1]
          sort_by: sortBy,        // REQ-F34[cite: 1]
          // REQ-F43: Novos filtros de data[cite: 1]
          min_date: dateRange.min,
          max_date: dateRange.max,
          // REQ-F44: Novos filtros de tipo[cite: 1]
          types: docTypes.join(',')
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
        return prev.filter(item => item.id !== doc.id); 
      }
      return [...prev, doc]; 
    });
  };

  // --- Função de Exportação Atualizada (REQ-F30) ---
  const handleExport = (format) => {
    const params = new URLSearchParams({
      q: lastQuery,
      method: method,
      lang: language
    });
    const url = `http://127.0.0.1:8000/api/export/${format}?${params.toString()}`;
    console.log("A exportar de:", url);
    window.open(url, '_blank');
  };

return (
    <Router>
      <div className="app-wrapper">
        {/* Passa o tamanho da coleção para o Header */}
        <Header savedCount={collection.length} />
        
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
                    // REQ-F43, REQ-F44: Passagem dos novos estados para o painel[cite: 1]
                    dateRange={dateRange} setDateRange={setDateRange}
                    docTypes={docTypes} setDocTypes={setDocTypes}
                  />
                </SearchBox>

                <div className="results-container" style={{ marginTop: '40px', textAlign: 'left' }}>
                  
                  {loading && (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <div className="spinner"></div>
                      <p>A pesquisar...</p>
                    </div>
                  )}

                  {!loading && results.length > 0 && (
                    <div className="results-content">
                      <div className="stats-bar" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px' }}>
                        <div>
                          Encontrados <strong>{searchStats.total}</strong> resultados ({searchStats.time})
                        </div>
                        
                        <div style={{ display: 'flex', gap: '15px' }}>
                          <select value={resultsPerPage} onChange={(e) => { setResultsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                            <option value={10}>10 por pág.</option>
                            <option value={20}>20 por pág.</option>
                            <option value={50}>50 por pág.</option>
                          </select>

                          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}>
                            <option value="relevance">Relevância</option>
                            <option value="date">Data</option>
                            <option value="title">Título</option>
                          </select>
                        </div>
                      </div>

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

                  {!loading && results.length === 0 && (
                    <div style={{ textAlign: 'center', marginTop: '50px', color: '#94a3b8' }}>
                      <p>Aguardando pesquisa ou sem resultados para apresentar.</p>
                    </div>
                  )}
                </div>
              </div>
            } />
            {/* REQ-F35: Rota atualizada para a página dedicada de autores[cite: 1] */}
            <Route path="/authors" element={
              <AuthorPage 
                collection={collection} 
                toggleSaveToCollection={toggleSaveToCollection} 
              />
            } />
            {/* ROTA PARA VER OS DOCUMENTOS GUARDADOS */}
            <Route path="/collection" element={
              <div style={{ maxWidth: '1000px', margin: '40px auto', textAlign: 'left' }}>
                <h2 style={{ color: '#2D3748', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                  A Minha Coleção Guardada ({collection.length})
                </h2>
                {collection.length === 0 ? (
                  <p style={{ marginTop: '20px', color: '#718096' }}>Ainda não guardaste nenhum documento.</p>
                ) : (
                  <div className="results-list" style={{ marginTop: '20px' }}>
                    {collection.map((doc, index) => (
                      <ResultItem 
                        key={doc.id || index} 
                        doc={doc} 
                        rank={index + 1} 
                        isSaved={true} 
                        onSave={() => toggleSaveToCollection(doc)} 
                      />
                    ))}
                  </div>
                )}
              </div>
            } />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/compare" element={
              <ComparePage 
                collection={collection} 
                toggleSaveToCollection={toggleSaveToCollection} 
              />
            } />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;