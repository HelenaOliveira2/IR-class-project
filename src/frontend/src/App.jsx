import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import SearchBox from './components/SearchBox'; 
import ConfigPanel from './components/ConfigPanel';
import ResultItem from './components/ResultItem';
import HistoryPage from './components/HistoryPage';
import HelpPage from './components/HelpPage';
import './styles/main.scss';

// --- REQ-F63 & REQ-F64: Carregar Configurações Preferidas ---
const getSavedConfig = (key, defaultValue) => {
  const saved = localStorage.getItem(`config_${key}`);
  return saved !== null ? JSON.parse(saved) : defaultValue;
};

function App() {
  // --- Estados de Configuração (REQ-F18 e REQ-F20) ---
  const [method, setMethod] = useState(() => getSavedConfig('method', 'stemming'));
  const [excludeStopWords, setExcludeStopWords] = useState(() => getSavedConfig('stopWords', false));
  const [language, setLanguage] = useState(() => getSavedConfig('language', 'pt'));
  const [rankingAlgorithm, setRankingAlgorithm] = useState(() => getSavedConfig('ranking', 'custom_tfidf'));
  const [weightingScheme, setWeightingScheme] = useState(() => getSavedConfig('weighting', 'log_normalization'));

  // --- Estados de Dados e Resultados (REQ-F31, F33) ---
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchStats, setSearchStats] = useState({ total: 0, time: "0s" });
  const [lastQuery, setLastQuery] = useState('');

  // --- Novos Estados para REQ-F31, F32 e F34 ---
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('relevance');

  /// Estados de Histórico (F59-F61)
  const [searchHistory, setSearchHistory] = useState(() => JSON.parse(localStorage.getItem('searchHistory') || '[]'));
  const [savedSearches, setSavedSearches] = useState(() => JSON.parse(localStorage.getItem('savedSearches') || '[]'));
  const [showHistory, setShowHistory] = useState(false);

  // --- REQ-F65: Opções de Exibição (Densidade e Destaque) ---
  const [density, setDensity] = useState(() => getSavedConfig('pref_density', 'comfortable'));
  const [showSnippet, setShowSnippet] = useState(() => getSavedConfig('showSnippet', true));
  const [showTour, setShowTour] = useState(() => !localStorage.getItem('tour_completed'));

  // --- REQ-F66: Gestão de Sessão Simples ---
  const [userSession, setUserSession] = useState(() => {
    const session = sessionStorage.getItem('user_session');
    return session ? JSON.parse(session) : { id: `user_${Date.now()}`, startTime: new Date().toISOString() };
  });

  const completeTour = () => {
    setShowTour(false);
    localStorage.setItem('tour_completed', 'true');
  };

  // Local: App.jsx (aproximadamente linha 58-61)
  useEffect(() => {
    localStorage.setItem('config_method', JSON.stringify(method));
    localStorage.setItem('config_stopWords', JSON.stringify(excludeStopWords));
    localStorage.setItem('config_language', JSON.stringify(language));
    localStorage.setItem('config_ranking', JSON.stringify(rankingAlgorithm));
    localStorage.setItem('config_weighting', JSON.stringify(weightingScheme));
    localStorage.setItem('config_density', JSON.stringify(density));
    localStorage.setItem('config_showSnippet', JSON.stringify(showSnippet)); // Corrigido: era showSnippets
  }, [method, excludeStopWords, language, rankingAlgorithm, weightingScheme, density, showSnippet]); // Corrigido aqui também

  // Efeito para a Sessão (REQ-F66)
  useEffect(() => {
    if (!sessionStorage.getItem('user_session')) {
      sessionStorage.setItem('user_session', Date.now().toString());
    }
  }, []);

  // REQ-F31, F32, F34: Dispara a pesquisa sempre que os filtros de visualização mudam
  useEffect(() => {
    if (lastQuery) {
      handlePerformSearch(lastQuery, 'general', currentPage);
    }
    const savedHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    const savedPersonalSearches = JSON.parse(localStorage.getItem('savedSearches') || '[]');
  }, [currentPage, resultsPerPage, sortBy]); // Escuta estas variáveis

  // Sincronizar com LocalStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    localStorage.setItem('savedSearches', JSON.stringify(savedSearches));
  }, [savedSearches]);

  // --- REQ-F59: Tracking do Histórico ---
  const handleSaveSearch = (query, collectionName) => {
    if (!query) return alert("Nada para guardar");
  
    const newSaved = { 
      id: Date.now(), 
      name: `Pesquisa: ${query}`, 
      collectionName: collectionName,
      query: query,
      // GUARDAR OS RESULTADOS ATUAIS (REQ-F61)
      savedResults: results ? [...results] : [], 
      timestamp: new Date().toLocaleString() 
    };
  
    setSavedSearches(prev => {
      const updated = [newSaved, ...prev];
      localStorage.setItem('savedSearches', JSON.stringify(updated));
      return updated;
    });
  
    alert(`Pesquisa e ${results.length} resultados guardados em "${collectionName}"!`);
  };

  const addToHistory = (query) => {
    const newEntry = { id: Date.now(), query, timestamp: new Date().toLocaleString() };
    setSearchHistory(prev => [newEntry, ...prev].slice(0, 20));
  };

  // --- REQ-F60: Guardar e Nomear Pesquisa ---
  const saveCurrentSearch = (name) => {
    if (!lastQuery) return alert("Faça uma pesquisa primeiro!");
    const newSavedSearch = {
      id: Date.now(),
      name: name || `Pesquisa: ${lastQuery}`,
      query: lastQuery,
      config: { method, rankingAlgorithm }
    };
    const updated = [...savedSearches, newSavedSearch];
    setSavedSearches(updated);
    localStorage.setItem('savedSearches', JSON.stringify(updated));
  };

  // --- REQ-F62: Exportar Histórico ---
  const exportHistory = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(searchHistory));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "historico_pesquisa.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- Função Principal de Pesquisa (Conecta o Frontend ao Backend) ---
  const handlePerformSearch = async (query, mode = 'general', page = 1) => {
    if (!query) return;
    if (page === 1) addToHistory(query);
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
      {showTour && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#B91C1C', color: 'white', padding: '20px', borderRadius: '12px', zIndex: 9999, width: '300px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
          <h3>👋 Bem-vindo!</h3>
          <p style={{ fontSize: '0.9rem' }}>Pode configurar o algoritmo de ranking e os pesos no painel à direita da pesquisa.</p>
          <button onClick={completeTour} style={{ background: 'white', color: '#B91C1C', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Entendi!
          </button>
        </div>
      )}
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
                  onSaveSearch={handleSaveSearch}
                  savedSearches={savedSearches}
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
                      <div className="stats-bar" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '15px' }}>
                        <div>
                          Encontrados <strong>{searchStats.total}</strong> resultados ({searchStats.time})
                        </div>

                        <div className="right-controls" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                          
                          {/* REQ-F65: Customização de Exibição (Densidade) */}
                          <button 
                            onClick={() => setDensity(density === 'compact' ? 'comfortable' : 'compact')}
                            className="btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '5px 10px', cursor: 'pointer' }}
                          >
                            {density === 'compact' ? '📂 Vista Normal' : '📑 Vista Compacta'}
                          </button>

                          {/* REQ-F65: Customização de Exibição (Snippets) */}
                          <label style={{ fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input 
                              type="checkbox" 
                              checked={showSnippet} 
                              onChange={(e) => setShowSnippet(e.target.checked)} 
                            />
                            Resumos
                          </label>

                          {/* REQ-F32: Resultados por página */}
                          <select style={{ padding: '4px', fontSize: '0.8rem' }} value={resultsPerPage} onChange={(e) => { setResultsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                            <option value={10}>10 pág.</option>
                            <option value={20}>20 pág.</option>
                            <option value={50}>50 pág.</option>
                          </select>

                          {/* REQ-F34: Ordenação */}
                          <select style={{ padding: '4px', fontSize: '0.8rem' }} value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}>
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
                          rank={((currentPage - 1) * resultsPerPage) + index + 1} 
                          density={density}       
                          showSnippet={showSnippet} 
                          isSaved={savedSearches.some(s => s.query === doc.title)} 
                          onSave={() => handleSaveSearch(doc.title, "Geral")}
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

                  {showHistory && (
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <h3>Meu Histórico e Coleções Personalizadas</h3>
                        <button onClick={exportHistory} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                          📥 Exportar Histórico (JSON)
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <h4>Últimas Pesquisas</h4>
                          <ul style={{ listStyle: 'none', padding: 0 }}>
                            {searchHistory.map(item => (
                              <li key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #edf2f7', fontSize: '0.9rem' }}>
                                <span style={{ cursor: 'pointer', color: '#3182ce' }} onClick={() => handlePerformSearch(item.query)}>
                                  "{item.query}"
                                </span>
                                <small style={{ color: '#a0aec0', marginLeft: '10px' }}>{item.timestamp}</small>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4>Pesquisas Guardadas (Coleção)</h4>
                          <ul style={{ listStyle: 'none', padding: 0 }}>
                            {savedSearches.map(item => (
                              <li key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #edf2f7', fontSize: '0.9rem' }}>
                                <strong>{item.name}</strong> - 
                                <button onClick={() => handlePerformSearch(item.query)} style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer', marginLeft: '5px' }}>
                                  Refazer
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            } />
            <Route path="/history" element={
              <HistoryPage 
                history={searchHistory} 
                saved={savedSearches} 
                onExport={exportHistory}onClearHistory={() => {
                  if(window.confirm("Deseja apagar todo o histórico e coleções?")) {
                    setSearchHistory([]);
                    setSavedSearches([]);
                    localStorage.removeItem('searchHistory');
                    localStorage.removeItem('savedSearches');
                  }
                }}
              />
            } />
            <Route path="/authors" element={<div className="main-container"><h2>Pesquisa por Autores (Em breve)</h2></div>} />
            <Route path="/about" element={<div className="main-container"><h2>Sobre o Projecto</h2></div>} />
            <Route path="/help" element={<HelpPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );}

export default App;