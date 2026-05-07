import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import SearchBox from './components/SearchBox'; 
import ConfigPanel from './components/ConfigPanel';
import ResultItem from './components/ResultItem';
import HistoryPage from './components/HistoryPage';
import HelpPage from './components/HelpPage';
import CollectionPage from './components/CollectionPage';
// REQ-F35: Importação das novas páginas dedicadas
import AuthorPage from './pages/AuthorPage';
import AboutPage from './pages/AboutPage';
import ComparePage from './pages/ComparePage';
import AdminDashboard from './pages/AdminDashboard';   
import './styles/main.scss';

// --- REQ-F63 & REQ-F64: Carregar Configurações Preferidas ---
const getSavedConfig = (key, defaultValue) => {
  const saved = localStorage.getItem(`config_${key}`);
  return saved !== null ? JSON.parse(saved) : defaultValue;
};

function App() {
  // REQ-F43: Estado para intervalo de datas e REQ-F44: Tipos de documento
  const [dateRange, setDateRange] = useState({ min: '', max: '' });
  const [docTypes, setDocTypes] = useState([]);
  
  // --- Estados de Configuração ---
  const [method, setMethod] = useState(() => getSavedConfig('method', 'stemming'));
  const [excludeStopWords, setExcludeStopWords] = useState(() => getSavedConfig('stopWords', false));
  const [language, setLanguage] = useState(() => getSavedConfig('language', 'pt'));
  const [rankingAlgorithm, setRankingAlgorithm] = useState(() => getSavedConfig('ranking', 'custom_tfidf'));
  const [weightingScheme, setWeightingScheme] = useState(() => getSavedConfig('weighting', 'log_normalization'));

  // --- Estados de Dados e Resultados ---
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchStats, setSearchStats] = useState({ total: 0, time: "0s" });
  const [lastQuery, setLastQuery] = useState('');

  // --- Novos Estados para Paginação e Ordenação ---
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('relevance');

  // --- Estados de Histórico e Coleções ---
  const [searchHistory, setSearchHistory] = useState(() => JSON.parse(localStorage.getItem('searchHistory') || '[]'));
  const [savedSearches, setSavedSearches] = useState(() => JSON.parse(localStorage.getItem('savedSearches') || '[]'));
  const [collection, setCollection] = useState([]); // REQ-F29: Coleção de documentos
  const [showHistory, setShowHistory] = useState(false);

  // REQ-F78: Cache em memória para evitar pedidos repetidos à API
  const queryCache = useRef({});

  // --- Opções de Exibição e Sessão ---
  const [density, setDensity] = useState(() => getSavedConfig('pref_density', 'comfortable'));
  const [showSnippet, setShowSnippet] = useState(() => getSavedConfig('showSnippet', true));
  const [showTour, setShowTour] = useState(() => !localStorage.getItem('tour_completed'));

  const [userSession, setUserSession] = useState(() => {
    const session = sessionStorage.getItem('user_session');
    return session ? JSON.parse(session) : { id: `user_${Date.now()}`, startTime: new Date().toISOString() };
  });

  const completeTour = () => {
    setShowTour(false);
    localStorage.setItem('tour_completed', 'true');
  };

  // Persistência de configurações
  useEffect(() => {
    const configs = { method, stopWords: excludeStopWords, language, ranking: rankingAlgorithm, weighting: weightingScheme, density, showSnippet };
    Object.keys(configs).forEach(key => localStorage.setItem(`config_${key}`, JSON.stringify(configs[key])));
  }, [method, excludeStopWords, language, rankingAlgorithm, weightingScheme, density, showSnippet]);

  useEffect(() => {
    if (!sessionStorage.getItem('user_session')) {
      sessionStorage.setItem('user_session', Date.now().toString());
    }
  }, []);

  // REQ-F81: Ler o URL quando a página abre para pesquisas partilháveis
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get('q');
    const urlMode = params.get('mode') || 'general';
    
    if (urlQuery) {
      handlePerformSearch(urlQuery, urlMode, 1);
    }
  }, []); // Executa apenas 1 vez ao carregar a página

  // Sincronização do Histórico e Coleções
  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    localStorage.setItem('savedSearches', JSON.stringify(savedSearches));
  }, [searchHistory, savedSearches]);

  // Pesquisa automática ao mudar paginação ou filtros
  useEffect(() => {
    if (lastQuery) handlePerformSearch(lastQuery, 'general', currentPage);
  }, [currentPage, resultsPerPage, sortBy]);

  // --- Handlers de Ações ---
  const handleSaveSearch = (queryText, collectionName) => {
    if (!queryText) return alert("Nada para guardar");

    // Captura os resultados que estão atualmente no estado 'results'
    const resultsToSave = results.map(doc => ({
      id: doc.id,
      title: doc.title,
      authors: doc.authors,
      pdf_link: doc.pdf_link
    }));

    const newSaved = { 
      id: Date.now(), 
      name: `Pesquisa: ${queryText}`, 
      collectionName: collectionName || 'Geral',
      query: queryText,
      results: resultsToSave, // Garante que os documentos são guardados aqui
      timestamp: new Date().toLocaleString() 
    };

    setSavedSearches(prev => {
      const updated = [newSaved, ...prev];
      localStorage.setItem('savedSearches', JSON.stringify(updated));
      return updated;
    });

    alert(`Pesquisa e ${resultsToSave.length} títulos guardados em "${collectionName || 'Geral'}"!`);
  };

  const addToHistory = (query, count = 0) => {
    const newEntry = { 
      id: Date.now(), 
      query, 
      timestamp: new Date().toISOString(),
      resultsCount: count, // Adiciona o contador
      engine: rankingAlgorithm // Guarda o algoritmo usado
    };
    setSearchHistory(prev => [newEntry, ...prev].slice(0, 20));
  };

  const exportHistory = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(searchHistory));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "historico_pesquisa.json");
    downloadAnchorNode.click();
  };

  const toggleSaveToCollection = (doc) => {
    setCollection(prev => {
      const isAlreadySaved = prev.find(item => item.id === doc.id);
      return isAlreadySaved ? prev.filter(item => item.id !== doc.id) : [...prev, doc];
    });
  };

  const handlePerformSearch = async (query, mode = 'general', page = 1) => {
    if (!query) return;
    if (page === 1) addToHistory(query);
    setLastQuery(query);
    setCurrentPage(page);
    setLoading(true);

    // (REQ-F81) Atualizar o URL do Browser para ser partilhável
    const newUrlParams = new URL(window.location);
    newUrlParams.searchParams.set('q', query);
    newUrlParams.searchParams.set('mode', mode);
    window.history.pushState({}, '', newUrlParams);
    
    try {
      let url = "";
      if (mode === 'author') {
        url = `http://127.0.0.1:8000/api/authors/search?name=${encodeURIComponent(query)}`;
      } else {
        const params = new URLSearchParams({
          q: query, method, ranking: rankingAlgorithm, weighting: weightingScheme,
          stop_words: excludeStopWords, lang: language, page, limit: resultsPerPage,
          sort_by: sortBy, min_date: dateRange.min, max_date: dateRange.max, types: docTypes.join(',')
        });
        url = `http://127.0.0.1:8000/api/search?${params}`;
      }

      // ---------------------------------------------------------------
      // REQ-F78: Verificar se a resposta já está na Cache!
      // Se a resposta estiver guardada, saltamos o "fetch" e poupamos tempo
      // ---------------------------------------------------------------
      if (queryCache.current[url]) {
        console.log("A carregar resultados a partir da cache!");
        setResults(queryCache.current[url].results);
        setSearchStats(queryCache.current[url].stats);
        setLoading(false);
        return; // Sai da função sem chamar o servidor
      }

      // Se não estiver na cache, faz o pedido real ao servidor Python
      const response = await fetch(url);
      const data = await response.json();
      
      const finalResults = Array.isArray(data) ? data : (data.results || []);
      const finalStats = { total: data.total_count || finalResults.length, time: data.search_time || "0s" };
      
      // REQ-F78: Guardar o resultado na Cache para a próxima vez
      queryCache.current[url] = { results: finalResults, stats: finalStats };

      setResults(finalResults);
      setSearchStats(finalStats);

    } catch (error) {
      console.error("Erro na pesquisa:", error);
      alert("Erro na ligação ao servidor Python. Verifique se o backend está a correr na porta 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Router>
      <div className="app-wrapper">
        {showTour && (
          <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#B91C1C', color: 'white', padding: '20px', borderRadius: '12px', zIndex: 9999, width: '300px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
            <h3>👋 Bem-vindo!</h3>
            <p>Pode configurar o algoritmo de ranking e filtros no painel lateral.</p>
            <button onClick={completeTour} style={{ background: 'white', color: '#B91C1C', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Entendi!</button>
          </div>
        )}
        
        <Header savedCount={collection.length} />

        <main className="main-container" role="main">
          <Routes>
            <Route path="/" element={
              <div style={{ textAlign: 'center', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
                <h2>Motor de Recuperação de Informação</h2>
                <SearchBox 
                  onSearch={handlePerformSearch} onSaveSearch={handleSaveSearch} savedSearches={savedSearches}
                  method={method} excludeStopWords={excludeStopWords} language={language}
                  rankingAlgorithm={rankingAlgorithm} weightingScheme={weightingScheme}
                >
                  <ConfigPanel 
                    method={method} setMethod={setMethod} excludeStopWords={excludeStopWords} setExcludeStopWords={setExcludeStopWords}
                    language={language} setLanguage={setLanguage} rankingAlgorithm={rankingAlgorithm} setRankingAlgorithm={setRankingAlgorithm}
                    weightingScheme={weightingScheme} setWeightingScheme={setWeightingScheme}
                    dateRange={dateRange} setDateRange={setDateRange} docTypes={docTypes} setDocTypes={setDocTypes}
                  />
                </SearchBox>

                <div className="results-container" style={{ marginTop: '40px', textAlign: 'left' }}>
                  {loading ? <p>A pesquisar...</p> : results.length > 0 && (
                    <div className="results-content">
                      <div className="stats-bar" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                        <div>Encontrados <strong>{searchStats.total}</strong> resultados ({searchStats.time})</div>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                          <button onClick={() => setDensity(density === 'compact' ? 'comfortable' : 'compact')}>{density === 'compact' ? '📂 Normal' : '📑 Compacta'}</button>
                          <label><input type="checkbox" checked={showSnippet} onChange={(e) => setShowSnippet(e.target.checked)} /> Resumos</label>
                          <select value={resultsPerPage} onChange={(e) => setResultsPerPage(Number(e.target.value))}><option value={10}>10 pág.</option><option value={20}>20 pág.</option></select>
                          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="relevance">Relevância</option><option value="date">Data</option></select>
                        </div>
                      </div>
                      <div className="results-list">
                        {results.map((doc, idx) => (
                          <ResultItem key={doc.id || idx} doc={doc} rank={((currentPage - 1) * resultsPerPage) + idx + 1} density={density} showSnippet={showSnippet} isSaved={collection.some(i => i.id === doc.id)} onSave={() => toggleSaveToCollection(doc)} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            } />

            <Route path="/authors" element={<AuthorPage collection={collection} toggleSaveToCollection={toggleSaveToCollection} addToHistory={addToHistory} />} />
            <Route path="/history" element={
              <HistoryPage 
                history={searchHistory} 
                saved={collection} // Usa o estado da coleção de documentos
                onExport={exportHistory} 
                onClearHistory={() => setSearchHistory([])} // Exemplo de limpeza rápida
                onRemoveSaved={toggleSaveToCollection} 
              />
            } />
            <Route path="/collection" element={
              <CollectionPage 
                collection={collection} 
                savedSearches={savedSearches} 
                toggleSaveToCollection={toggleSaveToCollection}
                onRemoveSavedSearch={(id) => setSavedSearches(prev => prev.filter(s => s.id !== id))}
              />
            } />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/compare" element={<ComparePage collection={collection} toggleSaveToCollection={toggleSaveToCollection} />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;