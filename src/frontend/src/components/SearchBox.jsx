import React, { useState } from 'react';
import { Search, Zap, Settings2, Target, BookOpen, Tag } from 'lucide-react';
import QueryBuilder from './QueryBuilder';

export default function SearchBox({ onSearch, method, excludeStopWords, language, children, ...props }) {
  const [query, setQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState('all');
  const [researchArea, setResearchArea] = useState('all');
  const [searchMode, setSearchMode] = useState('general');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query, searchMode); 
    }
  };

  // Estilos reutilizáveis para a coluna da esquerda (idênticos ao ConfigPanel)
  const cardStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0',
  };

  const titleStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '1rem',
    color: '#1e293b',
    margin: '0 0 15px 0',
    fontWeight: '600',
    borderBottom: '2px solid #f1f5f9',
    paddingBottom: '10px'
  };

  const labelStyle = {
    fontWeight: '600', 
    fontSize: '0.85rem', 
    color: '#64748b', 
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'left' }}>
      
      {/* ZONA DA BARRA DE PESQUISA */}
      <div style={{ marginBottom: '25px', position: 'relative' }}>
        
        {/* REQ-F39: Botão do Construtor com Design Moderno (Pill) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button 
            type="button"
            onClick={() => setIsBuilderOpen(!isBuilderOpen)}
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem', 
              padding: '6px 14px', 
              cursor: 'pointer',
              backgroundColor: isBuilderOpen ? '#eff6ff' : 'transparent',
              color: isBuilderOpen ? '#2563eb' : '#64748b',
              border: isBuilderOpen ? '1px solid #bfdbfe' : '1px solid transparent',
              borderRadius: '20px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            <Zap size={16} fill={isBuilderOpen ? "#2563eb" : "none"} />
            {isBuilderOpen ? 'Fechar Construtor' : 'Construtor Booleano Visual'}
          </button>
        </div>

        {/* REQ-F39: Interface do Construtor Visual */}
        {isBuilderOpen && (
          <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            <QueryBuilder onQueryChange={(text) => setQuery(text)} />
          </div>
        )}

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: (health OR medical) AND artificial intelligence"
            style={{ flex: 1, padding: '14px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1.05rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
          />
          <button 
            type="submit" 
            style={{ padding: '0 28px', backgroundColor: '#B91C1C', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 'bold', transition: 'background 0.2s' }}
          >
            <Search size={22} />
            Pesquisar
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}>
        
        {/* COLUNA ESQUERDA: Filtros (Agora em Cartão!) */}
        <div style={{ flex: 1, ...cardStyle, height: 'fit-content' }}>
          <h4 style={titleStyle}><Settings2 size={18} color="#475569" /> Parâmetros de Pesquisa</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Modo de Pesquisa */}
            <div>
              <label style={labelStyle}><Search size={14}/> Modo de Pesquisa</label>
              <div style={{ display: 'flex', gap: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
                  <input type="radio" value="general" checked={searchMode === 'general'} onChange={(e) => setSearchMode(e.target.value)} style={{ accentColor: '#B91C1C' }} />
                  Geral
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
                  <input type="radio" value="author" checked={searchMode === 'author'} onChange={(e) => setSearchMode(e.target.value)} style={{ accentColor: '#B91C1C' }} />
                  Por Autor
                </label>
              </div>
            </div>

            {/* Pesquisar Em */}
            <div>
              <label style={labelStyle}><Target size={14}/> Pesquisar em</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
                  <input type="radio" value="title" checked={searchTarget === 'title'} onChange={(e) => setSearchTarget(e.target.value)} style={{ accentColor: '#B91C1C' }} />
                  Títulos
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
                  <input type="radio" value="abstract" checked={searchTarget === 'abstract'} onChange={(e) => setSearchTarget(e.target.value)} style={{ accentColor: '#B91C1C' }} />
                  Resumos
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
                  <input type="radio" value="document" checked={searchTarget === 'document'} onChange={(e) => setSearchTarget(e.target.value)} style={{ accentColor: '#B91C1C' }} />
                  Doc. Completo
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
                  <input type="radio" value="all" checked={searchTarget === 'all'} onChange={(e) => setSearchTarget(e.target.value)} style={{ accentColor: '#B91C1C' }} />
                  Todos
                </label>
              </div>
            </div>

            {/* Área de Investigação */}
            <div>
              <label style={labelStyle}><BookOpen size={14}/> Área de Investigação</label>
              <select 
                value={researchArea} 
                onChange={(e) => setResearchArea(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#334155', outline: 'none' }}
              >
                <option value="all">Todas as Áreas</option>
                <option value="health">Saúde / Medicina</option>
                <option value="engineering">Engenharia / Tecnologia</option>
                <option value="science">Ciências Exatas</option>
                <option value="humanities">Ciências Humanas</option>
              </select>
            </div>

            {/* REQ-F45: Faceted Browsing por Tópicos */}
            <div style={{ marginTop: '5px', borderTop: '1px dashed #e2e8f0', paddingTop: '15px' }}>
              <label style={labelStyle}><Tag size={14}/> Tópicos Sugeridos</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['Machine Learning', 'Data Science', 'Sistemas de Informação', 'Algoritmos'].map(topic => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => { setQuery(topic); onSearch(topic, searchMode); }}
                    style={{ 
                      background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', 
                      padding: '4px 10px', borderRadius: '15px', fontSize: '0.75rem', cursor: 'pointer',
                      transition: 'all 0.2s ease', fontWeight: '500'
                    }}
                    onMouseOver={(e) => { e.target.style.background = '#e2e8f0'; e.target.style.color = '#0f172a'; }}
                    onMouseOut={(e) => { e.target.style.background = '#f1f5f9'; e.target.style.color = '#475569'; }}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* COLUNA DIREITA: ConfigPanel */}
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}