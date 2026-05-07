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
      maxHeight: '400px', 
      overflowY: 'auto',  
      boxSizing: 'border-box'
    }}>
      <h4 style={{ margin: '0 0 15px 0', color: '#334155' }}>Configurações de Processamento</h4>

      {/* --- SECÇÃO 1: PROCESSAMENTO DE TEXTO --- */}
      <div style={{ paddingBottom: '15px', marginBottom: '15px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ marginBottom: '15px' }}>
        <p style={{ fontWeight: '600' }} title="O Stemming reduz a palavra à raiz (ex: 'gatos' vira 'gat'), enquanto a Lemmatization usa o dicionário.">
          Método de Processamento ℹ️
        </p>
        <p style={{ fontWeight: '600' }} title="O sistema ignora palavras frequentes (ex: o, de, para) para focar nos termos importantes.">
          Stop Words ℹ️
        </p>

        <p style={{ fontWeight: '600' }} title="Cosine Similarity: Mede o ângulo entre os vetores da pesquisa e do documento.">
          Métrica de Similaridade ℹ️
        </p>
          <label style={{ marginRight: '15px', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input type="radio" value="stemming" checked={method === 'stemming'} onChange={(e) => setMethod(e.target.value)} /> Stemming
          </label>
          <label style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
            <input type="radio" value="lemmatization" checked={method === 'lemmatization'} onChange={(e) => setMethod(e.target.value)} /> Lemmatization
          </label>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div>
            <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px', color: '#475569' }}>Stop Words:</p>
            <label style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={excludeStopWords} onChange={(e) => setExcludeStopWords(e.target.checked)} /> Excluir
            </label>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px', color: '#475569' }}>Idioma:</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ padding: '4px', borderRadius: '4px' }}>
              <option value="pt">Português</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- SECÇÃO 2: RANKING E PESOS --- */}
      <div style={{ marginBottom: '15px' }}>
        <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px', color: '#475569' }}>Algoritmo:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' }}>
          <label style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
            <input type="radio" value="custom_tfidf" checked={rankingAlgorithm === 'custom_tfidf'} onChange={(e) => setRankingAlgorithm(e.target.value)} /> Custom TF-IDF
          </label>
          <label style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
            <input type="radio" value="sklearn_tfidf" checked={rankingAlgorithm === 'sklearn_tfidf'} onChange={(e) => setRankingAlgorithm(e.target.value)} /> Scikit-Learn
          </label>
          <label style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
            <input type="radio" value="boolean" checked={rankingAlgorithm === 'boolean'} onChange={(e) => setRankingAlgorithm(e.target.value)} /> Booleano
          </label>
        </div>

        <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px', color: '#475569' }}>Esquema de Pesos:</label>
        <select 
          value={weightingScheme} 
          onChange={(e) => setWeightingScheme(e.target.value)} 
          disabled={rankingAlgorithm === 'boolean'}
          style={{ width: '100%', padding: '6px', marginBottom: '15px' }}
        >
          <option value="standard">Standard TF</option>
          <option value="log_normalization">Log Normalization</option>
          <option value="double_normalization">Double Normalization</option>
        </select>

        <div style={{ padding: '10px', backgroundColor: '#e0f2fe', borderRadius: '5px', fontSize: '0.8rem' }}>
          <strong>Métrica: </strong> 
          {rankingAlgorithm === 'boolean' ? 'Exact Match' : 'Cosine Similarity'}
        </div>
      </div>
    </div>
  );
}