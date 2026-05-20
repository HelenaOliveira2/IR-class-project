import React, { useState, useEffect } from 'react';
import { Search, Star, Zap, Target, Tag, Book, User, ChevronDown } from 'lucide-react';
import QueryBuilder from './QueryBuilder';


export default function SearchBox({
  onSearch, onSaveSearch, savedSearches = [],
  method, excludeStopWords, language, children,
  searchTarget, setSearchTarget,
  searchMode, setSearchMode,
  ...props
}) {
  const [query, setQuery] = useState('');
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);


  const collections = [...new Set(savedSearches.map(s => s.collectionName))].filter(Boolean);


  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim() !== '') {
        console.log("Sugestões/Autocomplete a ser processado para:", query);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, searchMode]);


  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (query.trim() && onSearch) onSearch(query, searchMode, searchTarget, 1);
  };


  const handleConfirmSave = (e, folderName) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const name = folderName || newCollectionName;
    if (!name) return alert("Escolha ou crie uma coleção.");
    if (!query.trim()) return alert("Pesquise algo antes de guardar.");
   
    onSaveSearch(query, name);
    setShowSaveMenu(false);
    setNewCollectionName('');
  };


  // --- ESTILOS MODERNOS (Pills & Layout) ---
  const pillBase = {
    padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', border: '1px solid transparent'
  };
 
  const getPillStyle = (isActive) => ({
    ...pillBase,
    backgroundColor: isActive ? '#fef2f2' : 'transparent',
    color: isActive ? '#b91c1c' : '#64748b',
    border: isActive ? '1px solid #fca5a5' : '1px solid #e2e8f0',
  });


  return (
    <div role="search" style={{ maxWidth: '900px', margin: '0 auto 40px auto', textAlign: 'center' }}>
     
      {/* 1. BARRA DE PESQUISA PRINCIPAL (Sleek & Shadowed) */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <form
          onSubmit={handleSearch}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white',
            padding: '8px 8px 8px 24px', borderRadius: '50px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0', transition: 'box-shadow 0.3s'
          }}
        >
          <Search size={22} color="#94a3b8" />
         
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchMode === 'author' ? "Pesquisar pelo nome do investigador..." : "Ex: artificial intelligence AND healthcare"}
            aria-label="Escreva a sua pesquisa aqui"
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: '1.1rem',
              color: '#1e293b', background: 'transparent', padding: '10px 0'
            }}
          />


          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setIsBuilderOpen(!isBuilderOpen)}
              title="Construtor Visual Booleano"
              style={{
                background: isBuilderOpen ? '#eff6ff' : '#f8fafc',
                color: isBuilderOpen ? '#2563eb' : '#64748b',
                border: '1px solid #e2e8f0', borderRadius: '50%', width: '42px', height: '42px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <Zap size={18} fill={isBuilderOpen ? "#2563eb" : "none"} />
            </button>


            <button
              type="button"
              onClick={() => setShowSaveMenu(!showSaveMenu)}
              title="Guardar Pesquisa"
              style={{
                background: showSaveMenu ? '#fef3c7' : '#f8fafc',
                color: showSaveMenu ? '#d97706' : '#64748b',
                border: '1px solid #e2e8f0', borderRadius: '50%', width: '42px', height: '42px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <Star size={18} fill={showSaveMenu ? "#f59e0b" : "none"} />
            </button>


            <button
              type="submit"
              style={{
                padding: '12px 30px', backgroundColor: '#B91C1C', color: 'white',
                border: 'none', borderRadius: '30px', cursor: 'pointer',
                fontSize: '1rem', fontWeight: 'bold', letterSpacing: '0.5px', transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#991b1b'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#B91C1C'}
            >
              Pesquisar
            </button>
          </div>
        </form>


        {/* Menu Flutuante de Guardar Pesquisa */}
        {showSaveMenu && (
          <div style={{ position: 'absolute', right: '100px', top: '70px', width: '280px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', padding: '15px', textAlign: 'left' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '12px', color: '#1e293b' }}>Guardar Pesquisa Em:</p>
            <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {collections.map(folder => (
                <button key={folder} type="button" onClick={(ev) => handleConfirmSave(ev, folder)} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: '6px', border: '1px solid #f1f5f9', background: '#f8fafc', cursor: 'pointer', fontSize: '0.85rem' }}>📁 {folder}</button>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              <input type="text" placeholder="Criar nova coleção..." value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
              <button type="button" onClick={(ev) => handleConfirmSave(ev)} style={{ width: '100%', padding: '8px', background: '#B91C1C', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Guardar</button>
            </div>
          </div>
        )}
      </div>


      {/* 2. CONSTRUTOR VISUAL (Abre por baixo da barra principal) */}
      {isBuilderOpen && (
        <div style={{ marginTop: '15px', padding: '20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: '#1e293b', fontWeight: 'bold' }}>
            <Zap size={18} color="#2563eb" /> Construtor Booleano Avançado
          </div>
          <QueryBuilder onQueryChange={(text) => setQuery(text)} />
        </div>
      )}


      {/* 3. FILTROS RÁPIDOS EM PILLS (Design Super Limpo Horizontal) */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', marginTop: '20px', flexWrap: 'wrap' }}>
       
        {/* Switch Modo: Geral vs Autor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '4px', borderRadius: '30px', border: '1px solid #e2e8f0' }}>
          <button type="button" onClick={() => setSearchMode('general')} style={getPillStyle(searchMode === 'general')}>
            <Book size={14} /> Texto Livre
          </button>
          <button type="button" onClick={() => setSearchMode('author')} style={getPillStyle(searchMode === 'author')}>
            <User size={14} /> Por Autor
          </button>
        </div>


        <div style={{ width: '1px', height: '24px', backgroundColor: '#cbd5e1' }}></div>


        {/* Switch Zonas: Título, Resumo, Todos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
             <Target size={14}/> Pesquisar em:
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="button" onClick={() => setSearchTarget('title')} style={getPillStyle(searchTarget === 'title')}>Títulos</button>
            <button type="button" onClick={() => setSearchTarget('abstract')} style={getPillStyle(searchTarget === 'abstract')}>Resumos</button>
            <button type="button" onClick={() => setSearchTarget('all')} style={getPillStyle(searchTarget === 'all')}>Tudo</button>
          </div>
        </div>


      </div>


      {/* 4. TÓPICOS SUGERIDOS (Discretos em baixo) */}
      <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}>
          <Tag size={12} /> Sugestões:
        </span>
        {['information', 'Data Science', 'forward'].map(topic => (
          <button
            key={topic}
            type="button"
            onClick={() => { setQuery(topic); onSearch(topic, searchMode, searchTarget, 1); }}
            style={{
                background: 'transparent', color: '#64748b', border: '1px dashed #cbd5e1',
                padding: '4px 12px', borderRadius: '15px', fontSize: '0.75rem',
                cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
          >
            {topic}
          </button>
        ))}
      </div>


    </div>
  );
}

