import React, { useState } from 'react';
import { Search } from 'lucide-react';

// 1. Recebemos a prop 'children' (que é o nosso ConfigPanel)
export default function SearchBox({ method, excludeStopWords, language, children }) {
  const [query, setQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState('all');
  const [researchArea, setResearchArea] = useState('all');
  const [searchMode, setSearchMode] = useState('general');

  const handleSearch = (e) => {
    e.preventDefault();
    const searchData = {
      query,
      config: { method, excludeStopWords, language },
      filters: { target: searchTarget, area: researchArea, mode: searchMode }
    };
    console.log("A enviar para o servidor:", searchData);
  };

  return (
    // 2. Aumentamos o maxWidth para 1000px para as caixas respirarem lado a lado
    <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
      
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex: (health OR medical) AND artificial intelligence"
          style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }}
        />
        <button 
          type="submit" 
          style={{ padding: '12px 24px', backgroundColor: '#B91C1C', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}
        >
          <Search size={20} />
          Pesquisar
        </button>
      </form>

      {/* 3. Aqui começa a magia das grelhas lado a lado */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}>
        
        {/* COLUNA ESQUERDA: Filtros (flex: 1 significa que ocupa metade do espaço) */}
        <div style={{ flex: 1, padding: '20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#334155' }}>Filtros de Pesquisa</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px', color: '#475569' }}>Modo de Pesquisa:</p>
              <div style={{ display: 'flex', gap: '15px' }}>
                <label style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="radio" value="general" checked={searchMode === 'general'} onChange={(e) => setSearchMode(e.target.value)} style={{ marginRight: '5px' }} />
                  Geral
                </label>
                <label style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="radio" value="author" checked={searchMode === 'author'} onChange={(e) => setSearchMode(e.target.value)} style={{ marginRight: '5px' }} />
                  Por Autor
                </label>
              </div>
            </div>

            <div>
              <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px', color: '#475569' }}>Pesquisar em:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <label style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="radio" value="title" checked={searchTarget === 'title'} onChange={(e) => setSearchTarget(e.target.value)} style={{ marginRight: '5px' }} />
                  Títulos
                </label>
                <label style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="radio" value="abstract" checked={searchTarget === 'abstract'} onChange={(e) => setSearchTarget(e.target.value)} style={{ marginRight: '5px' }} />
                  Resumos
                </label>
                <label style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="radio" value="document" checked={searchTarget === 'document'} onChange={(e) => setSearchTarget(e.target.value)} style={{ marginRight: '5px' }} />
                  Documento Completo
                </label>
                <label style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="radio" value="all" checked={searchTarget === 'all'} onChange={(e) => setSearchTarget(e.target.value)} style={{ marginRight: '5px' }} />
                  Todos os Campos
                </label>
              </div>
            </div>

            <div>
              <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px', color: '#475569' }}>Área de Investigação:</p>
              <select 
                value={researchArea} 
                onChange={(e) => setResearchArea(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              >
                <option value="all">Todas as Áreas</option>
                <option value="health">Saúde / Medicina</option>
                <option value="engineering">Engenharia / Tecnologia</option>
                <option value="science">Ciências Exatas</option>
                <option value="humanities">Ciências Humanas</option>
              </select>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: Renderizamos aqui o ConfigPanel */}
        <div style={{ flex: 1 }}>
          {children}
        </div>

      </div>
    </div>
  );
}