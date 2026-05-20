import React from 'react';
import { Sliders, Filter, Activity, Calendar, FileText, Database, Code, Braces } from 'lucide-react';

export default function ConfigPanel({ 
  method, setMethod, 
  excludeStopWords, setExcludeStopWords, 
  language, setLanguage,
  rankingAlgorithm, setRankingAlgorithm,
  weightingScheme, setWeightingScheme,
  dateRange, setDateRange, 
  docTypes, setDocTypes
  // Removi o searchTarget pois já está tratado na SearchBox!
}) {

  const availableTypes = ['Artigo', 'Tese de Mestrado', 'Doutoramento'];

  const handleTypeChange = (type) => {
    setDocTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

// --- ESTILOS HORIZONTAIS ---
  // Ajustamos o cardStyle para ser um elemento flexível
  const cardStyle = {
    backgroundColor: 'white', padding: '16px', borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)', border: '1px solid #e2e8f0',
    flex: '1 1 300px', // Ocupa espaço proporcional, mínimo 300px
    minHeight: '200px'
  };

  const titleStyle = {
    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem',
    color: '#1e293b', margin: '0 0 12px 0', fontWeight: '700',
    borderBottom: '1px solid #f1f5f9', paddingBottom: '8px'
  };

  const labelStyle = { fontWeight: '600', fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' };

  // Componente interno para botões segmentados (Modern UI)
  const SegmentedControl = ({ options, value, onChange }) => (
    <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px', gap: '4px' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1, padding: '6px 10px', fontSize: '0.85rem', fontWeight: '600',
            backgroundColor: value === opt.value ? 'white' : 'transparent',
            color: value === opt.value ? '#0f172a' : '#64748b',
            border: 'none', borderRadius: '6px', cursor: 'pointer',
            boxShadow: value === opt.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', width: '100%', marginBottom: '30px' }}>
      {/* --- CARTÃO 1: MOTOR DE BUSCA (ALGORITMOS) --- */}
      <div style={cardStyle}>
        <h4 style={titleStyle}><Activity size={18} color="#10b981" /> Motor e Ranking</h4>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}><Code size={14}/> Algoritmo Principal</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button 
              onClick={() => setRankingAlgorithm('custom_tfidf')}
              style={{ padding: '10px', borderRadius: '8px', border: rankingAlgorithm === 'custom_tfidf' ? '1px solid #10b981' : '1px solid #e2e8f0', backgroundColor: rankingAlgorithm === 'custom_tfidf' ? '#ecfdf5' : 'white', color: rankingAlgorithm === 'custom_tfidf' ? '#047857' : '#475569', cursor: 'pointer', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s' }}
            >
              Custom TF-IDF <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'normal', color: rankingAlgorithm === 'custom_tfidf' ? '#059669' : '#94a3b8' }}>Algoritmo vetorial nativo</span>
            </button>
            
            <button 
              onClick={() => setRankingAlgorithm('sklearn_tfidf')}
              style={{ padding: '10px', borderRadius: '8px', border: rankingAlgorithm === 'sklearn_tfidf' ? '1px solid #3b82f6' : '1px solid #e2e8f0', backgroundColor: rankingAlgorithm === 'sklearn_tfidf' ? '#eff6ff' : 'white', color: rankingAlgorithm === 'sklearn_tfidf' ? '#1d4ed8' : '#475569', cursor: 'pointer', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s' }}
            >
              Scikit-Learn <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'normal', color: rankingAlgorithm === 'sklearn_tfidf' ? '#2563eb' : '#94a3b8' }}>Alta performance (Numpy)</span>
            </button>

            <button 
              onClick={() => setRankingAlgorithm('boolean')}
              style={{ padding: '10px', borderRadius: '8px', border: rankingAlgorithm === 'boolean' ? '1px solid #8b5cf6' : '1px solid #e2e8f0', backgroundColor: rankingAlgorithm === 'boolean' ? '#f5f3ff' : 'white', color: rankingAlgorithm === 'boolean' ? '#6d28d9' : '#475569', cursor: 'pointer', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s' }}
            >
              Booleano Exato <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'normal', color: rankingAlgorithm === 'boolean' ? '#7c3aed' : '#94a3b8' }}>Interseção matemática pura</span>
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={labelStyle}><Database size={14}/> Esquema de Pesos</label>
          <select 
            value={weightingScheme} 
            onChange={(e) => setWeightingScheme(e.target.value)} 
            disabled={rankingAlgorithm === 'boolean'} 
            style={{ 
              width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', 
              fontSize: '0.9rem', outline: 'none', backgroundColor: rankingAlgorithm === 'boolean' ? '#f8fafc' : 'white', 
              cursor: rankingAlgorithm === 'boolean' ? 'not-allowed' : 'pointer', color: '#1e293b'
            }}
          >
            <option value="standard">Standard TF (Term Frequency)</option>
            <option value="log_normalization">Log Normalization (Recomendado)</option>
            <option value="double_normalization">Double Normalization (K=0.5)</option>
          </select>
        </div>
      </div>

      {/* --- CARTÃO 2: PROCESSAMENTO DE LÍNGUA NATURAL (NLP) --- */}
      <div style={cardStyle}>
        <h4 style={titleStyle}><Sliders size={18} color="#3b82f6" /> Processamento (NLP)</h4>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle} title="Redução ao radical ou ao dicionário">Redução Morfológica</label>
          <SegmentedControl 
            options={[{ label: 'Stemming', value: 'stemming' }, { label: 'Lemmatization', value: 'lemmatization' }]}
            value={method}
            onChange={setMethod}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Ruído Semântico</label>
          <SegmentedControl 
            options={[{ label: 'Sem Stop Words', value: true }, { label: 'Com Stop Words', value: false }]}
            value={excludeStopWords}
            onChange={setExcludeStopWords}
          />
        </div>

        <div>
          <label style={labelStyle}>Léxico / Idioma</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}>
            <option value="pt">Português (PT)</option>
            <option value="en">Inglês (EN)</option>
          </select>
        </div>
      </div>

      {/* --- CARTÃO 3: METADADOS E FILTROS --- */}
      <div style={cardStyle}>
        <h4 style={titleStyle}><Filter size={18} color="#f59e0b" /> Filtros de Coleção</h4>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}><Calendar size={14}/> Cronologia</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <input 
              type="number" placeholder="Ano Min" min="1950" max="2026"
              value={dateRange.min} onChange={(e) => setDateRange({...dateRange, min: e.target.value})}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
            />
            <input 
              type="number" placeholder="Ano Max" min="1950" max="2026"
              value={dateRange.max} onChange={(e) => setDateRange({...dateRange, max: e.target.value})}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}><FileText size={14}/> Tipologia</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {availableTypes.map(type => (
              <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#334155', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <input 
                  type="checkbox" checked={docTypes.includes(type)} onChange={() => handleTypeChange(type)} 
                  style={{ width: '16px', height: '16px', accentColor: '#f59e0b', cursor: 'pointer' }}
                /> 
                {type}
              </label>
            ))}
          </div>
        </div>

        {(docTypes.length > 0 || dateRange.min || dateRange.max) && (
          <button 
            onClick={() => { setDocTypes([]); setDateRange({min: '', max: ''}); }}
            style={{ width: '100%', padding: '8px', marginTop: '10px', backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }}
          >
            Limpar Filtros ✖
          </button>
        )}
      </div>

    </div>
  );
}