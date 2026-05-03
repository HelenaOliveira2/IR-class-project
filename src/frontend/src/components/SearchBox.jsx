import React, { useState, useEffect } from 'react';
import { Search, Info, AlertCircle } from 'lucide-react';

const SearchBox = () => {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // REQ-F08: Base de dados simulada para auto-completion
  const searchHistory = [
    "machine learning AND health",
    "covid-19 OR sars-cov-2",
    "artificial intelligence NOT robotics",
    "information retrieval",
    "boolean search operators"
  ];

  // REQ-F10: Real-time query validation
  useEffect(() => {
    if (query.length === 0) {
      setError('');
      return;
    }

    // Regras de validação Booleana
    const upperQuery = query.toUpperCase();
    if (upperQuery.endsWith(' AND') || upperQuery.endsWith(' OR') || upperQuery.endsWith(' NOT')) {
      setError('A query não pode terminar com um operador booleano solto.');
    } else if ((query.match(/\(/g) || []).length !== (query.match(/\)/g) || []).length) {
      setError('Parênteses abertos/fechados incorretamente.');
    } else {
      setError(''); // Query válida!
    }
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!error && query) {
      alert(`A pesquisar por: ${query} \n(A ligar à API na Fase 2...)`);
      setShowSuggestions(false);
    }
  };

  return (
    <div className="search-section">
      
      <div className="search-box-container">
        {/* REQ-F06: Main search box supporting Boolean queries */}
        <form onSubmit={handleSearch}>
          <div className={`search-input-wrapper ${error ? 'has-error' : ''}`}>
            
            {/* REQ-F07: Query syntax help/tooltip functionality */}
            <button 
              type="button" 
              className="icon-btn" 
              onClick={() => setShowHelp(!showHelp)}
              title="Ajuda com pesquisa Booleana"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 0.5rem' }}
            >
              <Info size={20} color="#718096" />
            </button>

            {/* REQ-F05: Accessible design (aria-label) */}
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="Ex: (health OR medical) AND artificial intelligence"
              aria-label="Caixa de pesquisa principal"
            />
            
            <button type="submit" className="search-btn" disabled={!!error}>
              <Search size={20} />
              <span>Pesquisar</span>
            </button>
          </div>
        </form>

        {/* REQ-F10: Show real-time error highlighting */}
        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* REQ-F08: Search suggestions and auto-completion */}
        {showSuggestions && query.length > 2 && !error && (
          <ul className="search-suggestions">
            {searchHistory
              .filter(item => item.toLowerCase().includes(query.toLowerCase()))
              .map((suggestion, index) => (
                <li 
                  key={index} 
                  onClick={() => {
                    setQuery(suggestion);
                    setShowSuggestions(false);
                  }}
                >
                  {suggestion}
                </li>
            ))}
          </ul>
        )}
      </div>

      {/* REQ-F09: Display query syntax examples */}
      {showHelp && (
        <div className="syntax-help">
          <h4><Info size={18} /> Guia de Operadores Booleanos</h4>
          <p>Otimize a sua pesquisa usando os nossos operadores em maiúsculas:</p>
          <ul style={{ marginTop: '0.5rem' }}>
            <li><code>AND</code> : Encontra publicações com ambas as palavras. Ex: <i>cancer <b>AND</b> treatment</i></li>
            <li><code>OR</code> : Encontra publicações com pelo menos uma palavra. Ex: <i>covid-19 <b>OR</b> sars-cov-2</i></li>
            <li><code>NOT</code> : Exclui palavras da pesquisa. Ex: <i>apple <b>NOT</b> fruit</i></li>
            <li><code>( )</code> : Agrupa operações. Ex: <i>(health <b>OR</b> medical) <b>AND</b> technology</i></li>
          </ul>
        </div>
      )}

    </div>
  );
};

export default SearchBox;