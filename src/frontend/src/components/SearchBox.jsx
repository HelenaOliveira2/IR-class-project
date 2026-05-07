import React, { useState } from 'react';
import { Search, Star } from 'lucide-react';

// 1. ADICIONADO: 'onSearch' incluído nas props para o App.jsx poder receber os dados
export default function SearchBox({ onSearch, onSaveSearch, savedSearches = [], method, excludeStopWords, language, children, ...props }) {
  const [query, setQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState('all');
  const [researchArea, setResearchArea] = useState('all');
  const [searchMode, setSearchMode] = useState('general');
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  // Extrair nomes de coleções únicas para o dropdown
  const collections = [...new Set(savedSearches.map(s => s.collectionName))].filter(Boolean);

  const handleSearch = (e) => {
    e.preventDefault();
    
    // 2. LIGAÇÃO AO APP.JSX: Dispara a função de pesquisa real
    if (query.trim() && onSearch) {
      onSearch(query, searchMode); 
    }

    const searchData = {
      query,
      config: { method, excludeStopWords, language },
      filters: { target: searchTarget, area: researchArea, mode: searchMode }
    };
    console.log("A enviar para o servidor:", searchData);
  };

  const handleConfirmSave = (e, folderName) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const name = folderName || newCollectionName;
    if (!name) return alert("Escolha ou crie uma coleção.");
    if (!query.trim()) return alert("Pesquise algo antes de guardar.");
    
    // Passamos a query e o nome da coleção para o App.jsx
    onSaveSearch(query, name);
    setShowSaveMenu(false);
    setNewCollectionName('');
  };

  return (
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

        {/* BOTAO GUARDAR (REQ-F60) */}
        <button 
          type="button" 
          onClick={() => setShowSaveMenu(!showSaveMenu)}
          className="btn-secondary"
          title="Guardar Pesquisa"
          style={{ padding: '0 15px', background: '#fef3c7', border: '1px solid #f59e0b', color: '#b45309' }}
        >
          ⭐
        </button>
      </form>

      {/* REQ-F60/F61: Menu de Seleção de Coleção */}
      {showSaveMenu && (
        <div style={{ 
          position: 'absolute', right: 0, top: '60px', width: '300px', 
          backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', 
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 1000, padding: '15px' 
        }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '12px', color: '#1e293b' }}>
            Selecionar Coleção Existente:
          </p>
          
          <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {collections.length > 0 ? (
              collections.map(folder => (
                <button 
                  key={folder}
                  type="button"
                  // CORREÇÃO: Passar o evento 'ev' corretamente
                  onClick={(ev) => handleConfirmSave(ev, folder)} 
                  style={{ 
                    width: '100%', textAlign: 'left', padding: '10px 12px', 
                    borderRadius: '8px', border: '1px solid #f1f5f9',
                    background: '#f8fafc', cursor: 'pointer', fontSize: '0.9rem'
                  }}
                >
                  📁 {folder}
                </button>
              ))
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>Ainda não criou coleções.</p>
            )}
          </div>

          {/* Criar Nova */}
          <div style={{ borderTop: '1px solid #eee', paddingTop: '10px' }}>
            <input 
              type="text" 
              placeholder="Nova coleção..." 
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            />
            <button 
              type="button"
              // CORREÇÃO: Função correta é handleConfirmSave e passar o evento
              onClick={(ev) => handleConfirmSave(ev)}
              style={{ width: '100%', padding: '8px', background: '#B91C1C', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Criar e Guardar
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}>
        
        {/* COLUNA ESQUERDA: Filtros */}
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

        {/* COLUNA DIREITA: ConfigPanel */}
        <div style={{ flex: 1 }}>
          {children}
        </div>

      </div>
    </div>
  );
}