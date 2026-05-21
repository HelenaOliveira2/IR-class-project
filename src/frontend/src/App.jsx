import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import SearchBox from './components/SearchBox'; 
import ConfigPanel from './components/ConfigPanel';
import ResultItem from './components/ResultItem';
import { startTransition } from 'react';

// 📊 IMPORTS ESTÁTICOS (Correção para os gráficos do Recharts não colapsarem no arranque)
import DashboardPage from './pages/DashboardPage';
import AdminDashboard from './pages/AdminDashboard';

// 🚀 IMPORTS PREGUIÇOSOS / LAZY LOADING (Para as páginas normais de texto)
const HistoryPage = lazy(() => import('./components/HistoryPage'));
const HelpPage = lazy(() => import('./components/HelpPage'));
const CollectionPage = lazy(() => import('./components/CollectionPage'));
const AuthorPage = lazy(() => import('./pages/AuthorPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));

import './styles/main.scss';

// --- REQ-F63 & REQ-F64: Carregar Configurações Preferidas ---
const getSavedConfig = (key, defaultValue) => {
  const saved = localStorage.getItem(`config_${key}`);
  return saved !== null ? JSON.parse(saved) : defaultValue;
};

function App() {
  const activeRequestRef = useRef(null);
  // REQ-F43: Estado para intervalo de datas e REQ-F44: Tipos de documento
  const [dateRange, setDateRange] = useState({ min: '', max: '' });
  const [docTypes, setDocTypes] = useState([]);
  
  // --- Estados de Configuração ---
  const [method, setMethod] = useState(() => getSavedConfig('method', 'stemming'));
  const [excludeStopWords, setExcludeStopWords] = useState(() => getSavedConfig('stopWords', false));
  const [language, setLanguage] = useState(() => getSavedConfig('language', 'pt'));
  const [rankingAlgorithm, setRankingAlgorithm] = useState(() => getSavedConfig('ranking', 'custom_tfidf'));
  const [weightingScheme, setWeightingScheme] = useState(() => getSavedConfig('weighting', 'log_normalization'));
  const [searchTarget, setSearchTarget] = useState('all');
  // --- Estados de Dados e Resultados ---
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchStats, setSearchStats] = useState({ total: 0, time: "0s" });
  const [lastQuery, setLastQuery] = useState('');
  
  // REQ-F90: Estado para mensagens de erro claras
  const [errorMsg, setErrorMsg] = useState(null); 

  // --- Novos Estados para Paginação e Ordenação ---
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('relevance');

  // --- Estados de Histórico e Coleções ---
  const [searchHistory, setSearchHistory] = useState(() => JSON.parse(localStorage.getItem('searchHistory') || '[]'));
  const [savedSearches, setSavedSearches] = useState(() => JSON.parse(localStorage.getItem('savedSearches') || '[]'));
  const [collection, setCollection] = useState([]); 
  const [showHistory, setShowHistory] = useState(false);

  // REQ-F78 e REQ-F86: Cache em memória para evitar pedidos repetidos à API
  const queryCache = useRef({});
  
  // REQ-F83: Referência para o gatilho do Infinite Scroll
  const observerTarget = useRef(null);

  // --- Opções de Exibição e Sessão ---
  const [density, setDensity] = useState(() => getSavedConfig('pref_density', 'comfortable'));
  const [showSnippet, setShowSnippet] = useState(() => getSavedConfig('showSnippet', true));
  const [showTour, setShowTour] = useState(() => !localStorage.getItem('tour_completed'));

  const [searchMode, setSearchMode] = useState('general');

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
  }, []); 

  // Sincronização do Histórico e Coleções
  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    localStorage.setItem('savedSearches', JSON.stringify(savedSearches));
  }, [searchHistory, savedSearches]);

  // Pesquisa automática ao mudar paginação ou filtros
  useEffect(() => {
    if (lastQuery) handlePerformSearch(lastQuery, searchMode, searchTarget, currentPage);
  }, [currentPage, resultsPerPage, sortBy, searchMode, searchTarget, weightingScheme, rankingAlgorithm, dateRange]);

  // REQ-F83: Infinite Scroll (Carrega mais resultados ao chegar ao fim da página)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Só dispara se não estiver a carregar e se tivermos resultados (evita disparos em falso)
        if (entries[0].isIntersecting && !loading && results.length > 0) {
          // Verifique se já carregou todos os resultados disponíveis antes de somar +1
          if (results.length < searchStats.total) {
            setCurrentPage((prev) => prev + 1);
          }
        }
      },
      { threshold: 0.1 , // Mudar para 0.1 para detetar o início do elemento
        rootMargin: "50px"} 
      
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [loading, results, searchStats.total]);

  // --- Handlers de Ações ---
  const handleSaveSearch = (queryText, collectionName) => {
    if (!queryText) return alert("Nada para guardar");

    const resultsToSave = results.map(doc => ({
      id: doc.id, title: doc.title, authors: doc.authors, pdf_link: doc.pdf_link
    }));

    const newSaved = { 
      id: Date.now(), 
      name: `Pesquisa: ${queryText}`, 
      collectionName: collectionName || 'Geral',
      query: queryText,
      results: resultsToSave, 
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
      id: Date.now(), query, timestamp: new Date().toISOString(),
      resultsCount: count, engine: rankingAlgorithm 
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

  const handlePerformSearch = async (query, mode = 'general', target = searchTarget, page = 1) => {

    if (!query) return;
    if (page === 1) {
      addToHistory(query);
      // Só limpamos a lista se for uma pesquisa TOTALMENTE nova (página 1)
      setResults([]); 
    }
    setSearchMode(mode);
    setLastQuery(query);
    setCurrentPage(page);
    setLoading(true);
    setErrorMsg(null); // Limpa erros antigos

    // 🌟 SE JÁ HOUVER UM PEDIDO A CORRER, CANCELA-O IMEDIATAMENTE!
    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
    }
    // Criamos um novo controlador para o pedido atual
    const controller = new AbortController();
    activeRequestRef.current = controller;

    const newUrlParams = new URL(window.location);
    newUrlParams.searchParams.set('q', query);
    newUrlParams.searchParams.set('mode', mode);
    window.history.pushState({}, '', newUrlParams);
    
    try {
      let url = "";
      if (mode === 'author') {
        url = `/api/authors/search?name=${encodeURIComponent(query)}`;
      } else {

        const params = new URLSearchParams({
          q: query,
          search_in: target, // 🎯 Passa diretamente o valor ('title', 'abstract', 'document' ou 'all')
          method: method,
          ranking: rankingAlgorithm,
          weighting: rankingAlgorithm === 'boolean' ? 'none' : weightingScheme,
          page: page,
          limit: resultsPerPage,
          method: method,                 // 'stemming' ou 'lemmatization'
          exclude_stopwords: excludeStopWords, // true ou false
          language: language,             // 'pt' ou 'en'
          date_min: dateRange.min, // Envia o valor do Ano Min
          date_max: dateRange.max, // Envia o valor do Ano Max
          doc_types: docTypes.join(','),
        });
        url = `/api/search?${params}`;
      }

      // REQ-F78 e F86: Carregar da Cache
      if (queryCache.current[url]) {
        console.log("A carregar resultados a partir da cache!");
        startTransition(() => {
          setResults(queryCache.current[url].results);
          setSearchStats(queryCache.current[url].stats); // Prioriza a interação do utilizador sobre a renderização da lista
        });
        setLoading(false);
        return; 
      }

      const response = await fetch(url, { signal: controller.signal });
      const data = await response.json();
      
      const finalResults = mode === 'author' ? data : (data.results || []);
      const finalStats = { 
        total: mode === 'author' ? data.length : (data.total_count || finalResults.length), 
        time: data.search_time || "0s" 
      };
      
      queryCache.current[url] = { results: finalResults, stats: finalStats };

      // --- REQ-F97: OTIMIZAÇÃO AQUI ---
      // Envolvemos a atualização de estado pesada numa transição
      // Isto mantém a interface (scroll, cliques) fluida enquanto a lista renderiza
      startTransition(() => {
        // CORREÇÃO: Se a página for > 1, somamos aos resultados existentes
        setResults(prev => (page === 1 ? finalResults : [...prev, ...finalResults]));
        setSearchStats(finalStats);
      });

      // Limpa a referência já que o pedido terminou com sucesso
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
      }

    } catch (error) {
      // 🌟 CORREÇÃO CRÍTICA: Se o erro for um cancelamento nosso, ignora-o em silêncio!
      if (error.name === 'AbortError') {
        console.log("Pedido duplicado cancelado com sucesso nos bastidores. 🛡️");
        return; 
      }
      
      console.error("Erro real na pesquisa:", error);
      // REQ-F90: Só mostra esta mensagem se o erro for real (ex: servidor desligado)
      setErrorMsg("Erro na ligação ao servidor. Verifique se o backend Python está a correr.");
      
    } finally {
      // 🌟 CORREÇÃO CRÍTICA: Só desativamos o loading se este for o último pedido ativo real
      if (activeRequestRef.current === controller) {
        setLoading(false);
      }
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
          <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2rem', color: '#64748b' }}>A carregar a página... 🚀</div>}>
            <Routes>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/" element={
                <div style={{ textAlign: 'center', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
                  <h2>Motor de Recuperação de Informação</h2>
                  
                  {/* 1. A SearchBox fecha-se aqui. Não ponhas nada dentro dela! */}
                  <SearchBox 
                    onSearch={handlePerformSearch} 
                    onSaveSearch={handleSaveSearch} 
                    savedSearches={savedSearches}
                    method={method} 
                    excludeStopWords={excludeStopWords} 
                    language={language}
                    rankingAlgorithm={rankingAlgorithm} 
                    weightingScheme={weightingScheme}
                    searchTarget={searchTarget} 
                    setSearchTarget={setSearchTarget}
                    searchMode={searchMode} 
                    setSearchMode={setSearchMode}
                  />

                  {/* 2. O Painel de Configuração Horizontal vive aqui, como componente irmão */}
                  <div style={{ marginTop: '20px', marginBottom: '30px' }}>
                    <ConfigPanel 
                      method={method} setMethod={setMethod} 
                      excludeStopWords={excludeStopWords} setExcludeStopWords={setExcludeStopWords}
                      language={language} setLanguage={setLanguage} 
                      rankingAlgorithm={rankingAlgorithm} setRankingAlgorithm={setRankingAlgorithm}
                      weightingScheme={weightingScheme} setWeightingScheme={setWeightingScheme}
                      dateRange={dateRange} setDateRange={setDateRange} 
                      docTypes={docTypes} setDocTypes={setDocTypes}
                      searchTarget={searchTarget} setSearchTarget={setSearchTarget} 
                    />
                  </div>

     

                  {/* REQ-F90: Error Messages Semânticas (role="alert") */}
                  {errorMsg && (
                    <div role="alert" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #f87171', borderRadius: '8px', fontWeight: 'bold' }}>
                      ⚠️ {errorMsg}
                      <button onClick={() => setErrorMsg(null)} style={{ float: 'right', background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer' }}>✖</button>
                    </div>
                  )}

                  {/* REQ-F88: Region invisível para os leitores de ecrã falarem o resultado */}
                  <div aria-live="polite" className="sr-only">
                    {loading ? 'A pesquisar documentos...' : `Pesquisa terminada. Foram encontrados ${searchStats.total} resultados.`}
                  </div>

                  <div className="results-container" style={{ marginTop: '40px', textAlign: 'left' }}>
  
                    {/* 1. SE ESTIVER A CARREGAR (Aqui o comentário com chavetas é válido porque está fora da lógica) */}
                    {loading && results.length === 0 ? (
                      <p>A pesquisar...</p>
                    ) : 
                    
                    /* 2. SE ENCONTROU DOCUMENTOS (Repara que tirei as chavetas do comentário!) */
                    results.length > 0 ? (
                      <div className="results-content">
                        <div className="stats-bar" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                          <div>Encontrados <strong>{searchStats?.total || 0}</strong> resultados ({searchStats?.time || 0}ms)</div>
                          {/* ... os teus botões de densidade, checkbox, etc ... */}
                        </div>
                        
                        <div className="results-list">
                          {results.map((doc, idx) => (
                            <ResultItem key={doc.id || idx} doc={doc} rank={((currentPage - 1) * resultsPerPage) + idx + 1} density={density} showSnippet={showSnippet} isSaved={collection.some(i => i.id === doc.id)} onSave={() => toggleSaveToCollection(doc)} />
                          ))}
                        </div>

                        <div ref={observerTarget} style={{ height: '40px', margin: '20px 0', textAlign: 'center' }}>
                          {loading && <p style={{ color: '#64748b', fontWeight: 'bold' }}>A carregar mais documentos... ⏳</p>}
                        </div>
                      </div>
                    ) : 
                    
                    /* 3. SE JÁ FEZ A PESQUISA MAS NÃO ENCONTROU NADA (Sem chavetas no comentário) */
                    lastQuery ? (
                      <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b' }}>
                        <p style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 5px 0', color: '#1e293b' }}>
                          Nenhum documento encontrado
                        </p>
                        <p style={{ margin: 0, fontSize: '0.95rem' }}>
                          Não encontrámos nenhuma publicação correspondente a <strong>"{lastQuery}"</strong>.
                        </p>
                      </div>
                    ) : 
                    
                    /* 4. CASO CONTRÁRIO (Sem chavetas) */
                    null}

                  </div>
                </div>
              } />

              <Route path="/authors" element={<AuthorPage collection={collection} toggleSaveToCollection={toggleSaveToCollection} addToHistory={addToHistory} />} />
              <Route path="/history" element={<HistoryPage history={searchHistory} saved={collection} onExport={exportHistory} onClearHistory={() => setSearchHistory([])} onRemoveSaved={toggleSaveToCollection} />} />
              <Route path="/collection" element={<CollectionPage collection={collection} savedSearches={savedSearches} toggleSaveToCollection={toggleSaveToCollection} onRemoveSavedSearch={(id) => setSavedSearches(prev => prev.filter(s => s.id !== id))} />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/compare" element={<ComparePage collection={collection} toggleSaveToCollection={toggleSaveToCollection} />} />
              </Routes>
            </Suspense>
          </main>
      </div>
    </Router>
  );
}

export default App;