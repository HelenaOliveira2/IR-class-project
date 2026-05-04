import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import SearchBox from './components/SearchBox'; // Importamos o novo componente
import ConfigPanel from './components/ConfigPanel';
import './styles/main.scss';

// ... (imports mantêm-se iguais) ...

function App() {
  // Estados antigos
  const [method, setMethod] = useState('stemming');
  const [excludeStopWords, setExcludeStopWords] = useState(false);
  const [language, setLanguage] = useState('pt');

  // NOVOS Estados para Ranking e Pesos (REQ-F18 e REQ-F20)
  const [rankingAlgorithm, setRankingAlgorithm] = useState('custom_tfidf');
  const [weightingScheme, setWeightingScheme] = useState('log_normalization');

  return (
    <Router>
      <div className="app-wrapper">
        <Header />
        
        <main className="main-container" role="main">
          <Routes>
            <Route path="/" element={
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', color: '#2D3748', marginBottom: '0.5rem' }}>
                  Motor de Recuperação de Informação
                </h2>
                <p style={{ color: '#718096', marginBottom: '2rem' }}>
                  Pesquise metadados de publicações científicas do RepositóriUM
                </p>
                
                {/* Atualizamos a SearchBox para receber tudo (para enviar ao backend depois) */}
                <SearchBox 
                  method={method} 
                  excludeStopWords={excludeStopWords} 
                  language={language}
                  rankingAlgorithm={rankingAlgorithm}
                  weightingScheme={weightingScheme}
                >
                  {/* Passamos as novas props para o ConfigPanel */}
                  <ConfigPanel 
                    method={method} setMethod={setMethod}
                    excludeStopWords={excludeStopWords} setExcludeStopWords={setExcludeStopWords}
                    language={language} setLanguage={setLanguage}
                    rankingAlgorithm={rankingAlgorithm} setRankingAlgorithm={setRankingAlgorithm}
                    weightingScheme={weightingScheme} setWeightingScheme={setWeightingScheme}
                  />
                </SearchBox>

              </div>
            } />
            <Route path="/authors" element={<h2>Pesquisa por Autores (Em breve)</h2>} />
            <Route path="/about" element={<h2>Funcionalidades Educativas (Em breve)</h2>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;