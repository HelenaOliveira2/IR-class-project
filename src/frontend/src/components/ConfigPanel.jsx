import React from 'react';

export default function ConfigPanel({ 
  method, setMethod, 
  excludeStopWords, setExcludeStopWords, 
  language, setLanguage,
  rankingAlgorithm, setRankingAlgorithm,
  weightingScheme, setWeightingScheme
}) {

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #e2e8f0', 
      borderRadius: '8px',
      textAlign: 'left',
      backgroundColor: '#f8fafc',
      height: '100%', 
      maxHeight: '400px', // Limita a altura para alinhar com os filtros
      overflowY: 'auto',  // Adiciona scroll se as opções não couberem
      boxSizing: 'border-box'
    }}>
      <h4 style={{ margin: '0 0 15px 0', color: '#334155' }}>Configurações de Processamento</h4>

      {/* --- SECÇÃO 1: PROCESSAMENTO DE TEXTO --- */}
      <div style={{ paddingBottom: '15px', marginBottom: '15px', borderBottom: '1px solid #e2e8f0' }}>
        
        <div style={{ marginBottom: '15px' }}>
          <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px', color: '#475569' }}>Método de Processamento:</p>
          <label style={{ marginRight: '15px', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input type="radio" value="stemming" checked={method === 'stemming'} onChange={(e) => setMethod(e.target.value)} style={{ marginRight: '5px' }} />
            Stemming
          </label>
          <label style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
            <input type="radio" value="lemmatization" checked={method === 'lemmatization'} onChange={(e) => setMethod(e.target.value)} style={{ marginRight: '5px' }} />
            Lemmatization
          </label>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div>
            <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px', color: '#475569' }}>Stop Words:</p>
            <label style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={excludeStopWords} onChange={(e) => setExcludeStopWords(e.target.checked)} style={{ marginRight: '5px' }} />
              Excluir
            </label>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px', color: '#475569' }}>Idioma:</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
              <option value="pt">Português</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- SECÇÃO 2: RANKING E PESOS --- */}
      <div style={{ marginBottom: '15px' }}>
        
        {/* REQ-F18: Seleção de Algoritmo de Ranking */}
        <div style={{ marginBottom: '15px' }}>
          <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px', color: '#475569' }}>Algoritmo de Ranking:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="radio" value="custom_tfidf" checked={rankingAlgorithm === 'custom_tfidf'} onChange={(e) => setRankingAlgorithm(e.target.value)} style={{ marginRight: '5px' }} />
              Custom TF-IDF
            </label>
            <label style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="radio" value="sklearn_tfidf" checked={rankingAlgorithm === 'sklearn_tfidf'} onChange={(e) => setRankingAlgorithm(e.target.value)} style={{ marginRight: '5px' }} />
              Scikit-Learn TF-IDF
            </label>
            <label style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="radio" value="boolean" checked={rankingAlgorithm === 'boolean'} onChange={(e) => setRankingAlgorithm(e.target.value)} style={{ marginRight: '5px' }} />
              Boolean Ranking
            </label>
          </div>
        </div>

        {/* REQ-F20: Esquema de Pesos */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px', color: '#475569' }}>Esquema de Pesos (Weighting):</label>
          <select 
            value={weightingScheme} 
            onChange={(e) => setWeightingScheme(e.target.value)} 
            disabled={rankingAlgorithm === 'boolean'} // Desativa pesos se o algoritmo for booleano
            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem', backgroundColor: rankingAlgorithm === 'boolean' ? '#e2e8f0' : 'white' }}
          >
            <option value="standard">Standard Term Frequency</option>
            <option value="log_normalization">Log Normalization (1 + log(tf))</option>
            <option value="double_normalization">Double Normalization</option>
          </select>
        </div>

        {/* REQ-F19: Exibir método de similaridade consoante o algoritmo */}
        <div style={{ padding: '10px', backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '5px', fontSize: '0.85rem', color: '#0369a1' }}>
          <strong>Métrica de Similaridade: </strong> 
          {rankingAlgorithm === 'boolean' ? 'Exact Match (Jaccard / Set Intersection)' : 'Cosine Similarity (Vetorial)'}
        </div>

      </div>
    </div>
  );
}