import React, { useState } from 'react';

function ResultItem({ doc, rank }) {
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

        <p className="authors"><strong>Autores:</strong> {doc.authors}</p>
        
        {/* REQ-F26: Snippet */}
        <p className="snippet" dangerouslySetInnerHTML={{ __html: doc.snippet }} />

        <div className="result-actions">
          <button onClick={() => setShowAbstract(!showAbstract)} className="btn-secondary">
            {showAbstract ? 'Ocultar Resumo' : 'Ver Resumo'}
          </button>
          <a href={doc.pdf_link} className="btn-primary">PDF</a>
        </div>

        {showAbstract && (
          <div className="abstract-box">
            <p>{doc.abstract}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultItem;