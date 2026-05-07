import React, { useState } from 'react';

function ResultItem({ doc, density, showSnippet, rank, isSaved, onSave }) {
  const [showAbstract, setShowAbstract] = useState(false);

  const cardPadding = density === 'compact' ? '8px 15px' : '20px';

  return (
    <div className="result-card" style={{ padding: cardPadding }}>
      {/* Indicador de Ranking só aparece na vista normal para poupar espaço se quiseres */}
      <div className="rank-indicator">#{rank}</div>

      <div className="result-content">
        <div className="result-header">
          <a href={doc.pdf_link} target="_blank" rel="noreferrer" className="result-title" 
             style={{ fontSize: density === 'compact' ? '1rem' : '1.2rem' }}>
            {doc.title}
          </a>
          
          <div className="score-tag">
            <span>{(doc.score * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* Na vista compacta, podemos ocultar os autores se quiseres algo radical */}
        <p className="authors"><strong>Autores:</strong> {doc.authors}</p>
        
        {/* REQ-F65: O Snippet (resumo rápido) só aparece se showSnippet for true */}
        {showSnippet && (
           <p className="snippet" dangerouslySetInnerHTML={{ __html: doc.snippet }} 
              style={{ fontSize: density === 'compact' ? '0.85rem' : '0.95rem' }} />
        )}

        <div className="result-actions" style={{ marginTop: density === 'compact' ? '5px' : '15px' }}>
          <button onClick={onSave} className="btn-secondary">
             {isSaved ? '★ Guardado' : '☆ Guardar'}
          </button>
          
          {/* Se estiver em modo compacto, talvez o utilizador queira ver o resumo expandido */}
          <button onClick={() => setShowAbstract(!showAbstract)} className="btn-secondary">
            {showAbstract ? 'Ocultar' : 'Resumo'}
          </button>

          <a href={doc.pdf_link} target="_blank" rel="noreferrer" className="btn-primary">PDF</a>
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