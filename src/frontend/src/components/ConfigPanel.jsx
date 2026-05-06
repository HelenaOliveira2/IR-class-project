import React from 'react';
import { Sliders, Filter, Activity, Calendar, FileText } from 'lucide-react';

export default function ConfigPanel({ 
  method, setMethod, 
  excludeStopWords, setExcludeStopWords, 
  language, setLanguage,
  rankingAlgorithm, setRankingAlgorithm,
  weightingScheme, setWeightingScheme,
  dateRange, setDateRange, 
  docTypes, setDocTypes 
}) {

  const availableTypes = ['Artigo', 'Tese de Mestrado', 'Doutoramento'];

  const handleTypeChange = (type) => {
    setDocTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Estilos reutilizáveis para manter o código limpo
  const cardStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0',
    marginBottom: '20px'
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
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  return (
    <div style={{ 
      height: '100%', 
      maxHeight: '600px',
      overflowY: 'auto',  
      paddingRight: '5px',
      boxSizing: 'border-box'
    }}>
      
      {/* --- CARTÃO 1: PROCESSAMENTO DE TEXTO --- */}
      <div style={cardStyle}>
        <h4 style={titleStyle}><Sliders size={18} color="#2563eb" /> Processamento</h4>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}>Método Principal</label>
          <div style={{ display: 'flex', gap: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
              <input type="radio" value="stemming" checked={method === 'stemming'} onChange={(e) => setMethod(e.target.value)} />
              Stemming
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
              <input type="radio" value="lemmatization" checked={method === 'lemmatization'} onChange={(e) => setMethod(e.target.value)} />
              Lemmatization
            </label>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={labelStyle}>Stop Words</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
              <input type="checkbox" checked={excludeStopWords} onChange={(e) => setExcludeStopWords(e.target.checked)} />
              Excluir
            </label>
          </div>
          <div>
            <label style={labelStyle}>Idioma</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}>
              <option value="pt">Português</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- CARTÃO 2: FILTROS AVANÇADOS --- */}
      <div style={cardStyle}>
        <h4 style={titleStyle}><Filter size={18} color="#B91C1C" /> Filtros Avançados</h4>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}><Calendar size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/> Intervalo de Datas</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input 
              type="date" 
              value={dateRange.min} 
              onChange={(e) => setDateRange({...dateRange, min: e.target.value})}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#334155', outline: 'none' }}
              title="Data Inicial"
            />
            <input 
              type="date" 
              value={dateRange.max} 
              onChange={(e) => setDateRange({...dateRange, max: e.target.value})}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#334155', outline: 'none' }}
              title="Data Final"
            />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}><FileText size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/> Tipo de Documento</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {availableTypes.map(type => (
              <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#334155', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={docTypes.includes(type)} 
                  onChange={() => handleTypeChange(type)} 
                  style={{ width: '16px', height: '16px', accentColor: '#B91C1C' }}
                /> 
                {type}
              </label>
            ))}
          </div>
        </div>

        {(docTypes.length > 0 || dateRange.min || dateRange.max) && (
          <button 
            onClick={() => { setDocTypes([]); setDateRange({min: '', max: ''}); }}
            style={{ 
              width: '100%', padding: '10px', marginTop: '10px',
              backgroundColor: '#fee2e2', color: '#b91c1c', 
              border: 'none', borderRadius: '6px', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 'bold', transition: 'background 0.2s'
            }}
          >
            ✕ Limpar Filtros
          </button>
        )}
      </div>

      {/* --- CARTÃO 3: RANKING E PESOS --- */}
      <div style={cardStyle}>
        <h4 style={titleStyle}><Activity size={18} color="#059669" /> Motor de Busca</h4>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Algoritmo de Ranking</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
              <input type="radio" value="custom_tfidf" checked={rankingAlgorithm === 'custom_tfidf'} onChange={(e) => setRankingAlgorithm(e.target.value)} />
              Custom TF-IDF
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
              <input type="radio" value="sklearn_tfidf" checked={rankingAlgorithm === 'sklearn_tfidf'} onChange={(e) => setRankingAlgorithm(e.target.value)} />
              Scikit-Learn TF-IDF
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
              <input type="radio" value="boolean" checked={rankingAlgorithm === 'boolean'} onChange={(e) => setRankingAlgorithm(e.target.value)} />
              Boolean Ranking
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Esquema de Pesos</label>
          <select 
            value={weightingScheme} 
            onChange={(e) => setWeightingScheme(e.target.value)} 
            disabled={rankingAlgorithm === 'boolean'} 
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', backgroundColor: rankingAlgorithm === 'boolean' ? '#f1f5f9' : 'white', cursor: rankingAlgorithm === 'boolean' ? 'not-allowed' : 'pointer' }}
          >
            <option value="standard">Standard Term Frequency</option>
            <option value="log_normalization">Log Normalization (1 + log(tf))</option>
            <option value="double_normalization">Double Normalization</option>
          </select>
        </div>

        <div style={{ padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.85rem', color: '#166534', textAlign: 'center' }}>
          <strong style={{ display: 'block', marginBottom: '4px' }}>Métrica de Similaridade</strong> 
          {rankingAlgorithm === 'boolean' ? 'Exact Match (Set Intersection)' : 'Cosine Similarity (Vetorial)'}
        </div>
      </div>

    </div>
  );
}