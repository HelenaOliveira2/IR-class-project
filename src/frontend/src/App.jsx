import React, { useState } from 'react';
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

  // --- Função Principal de Pesquisa (Conecta o Frontend ao Backend) ---
  const handlePerformSearch = async (query) => {
    if (!query) return;
    
    setLoading(true);
    setResults([]); // Limpa resultados anteriores ao iniciar nova busca
    
    try {
      // Construção dos parâmetros para a API Python
      const params = new URLSearchParams({
        q: query,
        method: method,
        ranking: rankingAlgorithm,
        weighting: weightingScheme,
        stop_words: excludeStopWords,
        lang: language
      });

      console.log("A enviar pedido para:", `http://localhost:8000/api/search?${params}`);

      const response = await fetch(`http://localhost:8000/api/search?${params}`);

      console.log("Dados crus recebidos:", data);
      
      if (!response.ok) {
        throw new Error("Erro na resposta do servidor");
      }
      
      const data = await response.json();
      console.log("Dados recebidos da API:", data);

      if (data && data.results && Array.isArray(data.results)) {
        console.log("A atualizar resultados com:", data.results.length, "itens");
        setResults(data.results);
        setSearchStats({ 
          total: data.total_count || data.results.length, 
          time: data.search_time || "0s" 
        });
      } else {
        console.error("Estrutura de dados inesperada ou vazia:", data);
        setResults([]);
      }

    } catch (error) {
      console.error("Erro ao procurar documentos:", error);
      alert("Erro na ligação ao servidor Python (Porta 8000).");
    } finally {
      setLoading(false);
    }
  };

  // --- Função para Exportação (REQ-F30) ---
  const handleExport = (format) => {
    window.open(`http://127.0.0.1:8000/api/export/${format}`, '_blank');
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
                      <div className="spinner" style={{ marginBottom: '10px' }}></div>
                      <p style={{ color: '#B91C1C', fontWeight: 'bold' }}>A pesquisar no RepositóriUM...</p>
                    </div>
                  )}

                  {!loading && results.length > 0 && (
                    <div className="results-content">
                      {/* Estatísticas e Exportação */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        borderBottom: '2px solid #edf2f7', 
                        paddingBottom: '15px',
                        marginBottom: '20px' 
                      }}>
                        <p style={{ color: '#4a5568', margin: 0 }}>
                          Encontrados <strong>{searchStats.total}</strong> documentos em <strong>{searchStats.time}</strong>
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => handleExport('csv')} style={{ padding: '8px 15px', cursor: 'pointer' }}>CSV</button>
                          <button onClick={() => handleExport('json')} style={{ padding: '8px 15px', cursor: 'pointer' }}>JSON</button>
                        </div>
                      </div>

                      {/* Renderização da Lista de Resultados */}
                      <div className="results-list">
                        {results.map((doc, index) => (
                          <ResultItem 
                            key={doc.id || index} 
                            doc={doc} 
                            rank={index + 1} 
                          />
                        ))}
                      </div>

                      {/* Paginação Simples */}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '40px', paddingBottom: '40px' }}>
                        <button style={{ padding: '10px 20px' }} disabled>Anterior</button>
                        <span style={{ alignSelf: 'center', fontWeight: 'bold' }}>Página 1</span>
                        <button style={{ padding: '10px 20px' }}>Próxima</button>
                      </div>
                    </div>
                  )}

                  {/* Se NÃO está a carregar e TEM resultados, mostra a lista */}
                  {!loading && results && results.length > 0 ? (
                    <div className="results-list" style={{ marginTop: '20px' }}>
                      {results.map((doc, index) => (
                        <ResultItem 
                          key={doc.id || index} 
                          doc={doc} 
                          rank={index + 1} 
                        />
                      ))}
                    </div>
                  ) : (
                    /* Se NÃO está a carregar e NÃO tem resultados, mostra a mensagem de espera */
                    !loading && (
                      <div style={{ textAlign: 'center', marginTop: '50px', color: '#94a3b8' }}>
                        <p>Aguardando pesquisa ou sem resultados para apresentar.</p>
                      </div>
                    )
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