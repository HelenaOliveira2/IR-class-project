import React, { useState } from 'react';

function ResultItem({ doc, rank, isSaved, onSave }) {
  const [showAbstract, setShowAbstract] = useState(false);

  return (
    <div className="result-card">
      {/* REQ-F21: Indicador de Ranking Claro */}
      <div className="rank-indicator">
        #{rank}
      </div>

      <div className="result-content">
        <div className="result-header">
          {/* REQ-F23: Título clicável */}
          <a href={doc.pdf_link} target="_blank" rel="noreferrer" className="result-title">
            {doc.title}
          </a>
          
          {/* REQ-F22: Score de relevância */}
          <div className="score-tag">
            <div className="score-bar" style={{ width: `${doc.score * 100}%` }}></div>
            <span>{(doc.score * 100).toFixed(1)}% Relevância</span>
          </div>
        </div>

        {/* REQ-F24: Apresentação de autores */}
        <p className="authors"><strong>Autores:</strong> {doc.authors}</p>
        
        {/* REQ-F25: Exibição de Data e Tipo de Documento */}
        <div className="doc-metadata" style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
          <span><strong>Data:</strong> {doc.date}</span>
          <span style={{ margin: '0 10px' }}>|</span>
          <span><strong>Tipo:</strong> {doc.type}</span>
        </div>
        
        {/* REQ-F26: Snippet */}
        <p className="snippet" dangerouslySetInnerHTML={{ __html: doc.snippet }} />

        <div className="result-actions" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          {/* Botão Guardar adaptado ao estilo do site */}
          <button 
            onClick={onSave} 
            className={`btn-secondary ${isSaved ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <span style={{ color: isSaved ? '#f59e0b' : '#94a3b8' }}>★</span> 
            {isSaved ? 'Guardado' : 'Guardar'}
          </button>
          
          <button onClick={() => setShowAbstract(!showAbstract)} className="btn-secondary">
            {showAbstract ? 'Ocultar Resumo' : 'Ver Resumo'}
          </button>

          {/* Botão PDF usando a classe principal b91c1c do site */}
          <a href={doc.pdf_link} target="_blank" rel="noreferrer" className="btn-primary">
            PDF
          </a>
        </div>

        {showAbstract && (
          <div className="abstract-box" style={{ marginTop: '15px', padding: '15px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #cbd5e1' }}>
            <p>{doc.abstract}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultItem;