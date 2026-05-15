import React, { useState } from 'react';

function ResultItem({ doc, density, showSnippet, rank, isSaved, onSave }) {
  const [showAbstract, setShowAbstract] = useState(false);

  // Prevenção contra documentos nulos ou indefinidos (Merge branch 3d49af)
  if (!doc) return null;

  // Lógica para validar se o score existe e é um número (Merge branch 3d49af)
  const hasValidScore = doc.score !== undefined && doc.score !== null && !isNaN(doc.score);

  // REQ-F65: Cálculo dinâmico do padding baseado na densidade (Merge branch HEAD)
  const cardPadding = density === 'compact' ? '8px 15px' : '20px';

  return (
    <div className="result-card" style={{ padding: cardPadding }}>
      {/* Indicador de Ranking */}
      <div className="rank-indicator">#{rank}</div>

      <div className="result-content">
        <div className="result-header">
          <a href={doc.pdf_link} target="_blank" rel="noreferrer" className="result-title" 
             style={{ fontSize: density === 'compact' ? '1rem' : '1.2rem' }}>
            {doc.title}
          </a>
          
          {/* REQ-F22: Score de relevância com barra visual (Merge branch 3d49af) */}
          {hasValidScore && (
            <div className="score-tag">
              <div className="score-bar" style={{ width: `${Number(doc.score) * 100}%` }}></div>
              <span>
                {(Number(doc.score) * 100).toFixed(1)}% 
                {density !== 'compact' && ' Relevância'}
              </span>
            </div>
          )}
        </div>

        <p><strong>Autores:</strong> {Array.isArray(doc.authors) ? doc.authors.join(', ') : doc.authors}</p>
        
        {/* REQ-F65: O Snippet só aparece se showSnippet for true */}
        {showSnippet && (
           <p className="snippet" dangerouslySetInnerHTML={{ __html: doc.snippet }} 
              style={{ fontSize: density === 'compact' ? '0.85rem' : '0.95rem' }} />
        )}

        <div className="result-actions" style={{ marginTop: density === 'compact' ? '5px' : '15px' }}>
          <button onClick={onSave} className="btn-secondary">
             {isSaved ? '★ Guardado' : '☆ Guardar'}
          </button>
          
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