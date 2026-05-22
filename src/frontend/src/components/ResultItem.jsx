import React, { useState } from 'react';
import { FileText, Calendar, Users, ExternalLink, Bookmark, BookmarkCheck } from 'lucide-react'; // Adicionei ícones para um look moderno

function ResultItem({ doc, density, showSnippet, rank, isSaved, onSave }) {
  const [showAbstract, setShowAbstract] = useState(false);

  // Prevenção contra documentos nulos ou indefinidos
  if (!doc) return null;

  // Lógica para validar se o score existe e é um número
  const hasValidScore = doc.score && doc.score !== "N/A";

  // Determinar a cor da barra baseada no score
  let scoreColor = '#3b82f6'; // Azul por defeito
  if (hasValidScore) {
      if (doc.score > 0.75) scoreColor = '#22c55e'; // Verde para alta relevância
      else if (doc.score < 0.4) scoreColor = '#f59e0b'; // Laranja para baixa relevância
  }

  // REQ-F65: Cálculo dinâmico do padding baseado na densidade
  const cardPadding = density === 'compact' ? '12px 15px' : '20px';
  const cardBorder = isSaved ? '1px solid #bbf7d0' : '1px solid #e2e8f0'; // Borda verde se guardado

  return (
    <div className="result-card" style={{ 
        padding: cardPadding, 
        border: cardBorder,
        backgroundColor: isSaved ? '#f0fdf4' : 'white', // Fundo subtil se guardado
        borderRadius: '8px',
        marginBottom: '10px',
        display: 'flex',
        gap: '15px',
        position: 'relative'
    }}>
      
      {/* Indicador de Ranking Moderno */}
      <div style={{
          backgroundColor: '#f1f5f9',
          color: '#64748b',
          fontWeight: 'bold',
          padding: '4px 10px',
          borderRadius: '20px',
          height: 'fit-content',
          fontSize: '0.85rem'
      }}>
          #{rank}
      </div>

      <div className="result-content" style={{ flex: 1 }}>
        <div className="result-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          
          <a href={doc.pdf_link} target="_blank" rel="noreferrer" className="result-title" 
             style={{ 
                 fontSize: density === 'compact' ? '1.05rem' : '1.25rem',
                 color: '#1e293b',
                 textDecoration: 'none',
                 fontWeight: '600',
                 display: 'block',
                 maxWidth: '85%'
             }}
             dangerouslySetInnerHTML={{ __html: doc.title }}/>
          
          {/* REQ-F22: Score de relevância com barra visual melhorada */}
          {hasValidScore && (
            <div className="score-tag" style={{ width: '100px', textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '2px', fontWeight: 'bold' }}>
                  {doc.score}  {/* já vem "11.0%" da API, mostra diretamente */}
              </div>
              <div style={{ width: '100%', backgroundColor: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: doc.score, backgroundColor: scoreColor, height: '100%' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Metadados: Autores e Data */}
        <div style={{ display: 'flex', gap: '20px', color: '#64748b', fontSize: '0.85rem', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={14} /> 
                {Array.isArray(doc.authors) ? doc.authors.join(', ') : doc.authors || 'Autor Desconhecido'}
            </span>
            {/* Exibição da Data */}
            {(doc.date || doc.year) && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} /> 
                    {doc.date || doc.year}
                </span>
            )}
        </div>
        
        {/* REQ-F65: Snippet */}
        {showSnippet && doc.snippet && (
           <p className="snippet" dangerouslySetInnerHTML={{ __html: doc.snippet }} 
              style={{ fontSize: density === 'compact' ? '0.85rem' : '0.95rem', color: '#475569', margin: '0 0 15px 0', lineHeight: '1.5' }} />
        )}

        {/* Botões de Ação Modernizados */}
        <div className="result-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={onSave} style={{ 
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px', borderRadius: '6px', border: isSaved ? '1px solid #16a34a' : '1px solid #cbd5e1',
              backgroundColor: isSaved ? '#16a34a' : 'white', color: isSaved ? 'white' : '#475569',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500', transition: 'all 0.2s'
          }}>
             {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
             {isSaved ? 'Guardado' : 'Guardar'}
          </button>
          
          {doc.abstract && (
            <button onClick={() => setShowAbstract(!showAbstract)} style={{
                padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1',
                backgroundColor: showAbstract ? '#f8fafc' : 'white', color: '#475569',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500'
            }}>
                {showAbstract ? 'Ocultar Resumo' : 'Ler Resumo'}
            </button>
          )}

          <a href={doc.pdf_link} target="_blank" rel="noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px', borderRadius: '6px', border: 'none',
              backgroundColor: '#b91c1c', color: 'white', textDecoration: 'none',
              fontSize: '0.85rem', fontWeight: '500'
          }}>
              <FileText size={16} /> Ver PDF <ExternalLink size={14} style={{ opacity: 0.7 }} />
          </a>
        </div>

        {/* Caixa de Resumo */}
        {showAbstract && doc.abstract && (
          <div className="abstract-box" style={{
              marginTop: '15px', padding: '15px', backgroundColor: '#f8fafc', 
              borderLeft: '3px solid #b91c1c', borderRadius: '0 6px 6px 0',
              fontSize: '0.9rem', color: '#334155', lineHeight: '1.6'
          }}>
            <p style={{ margin: 0 }}>{doc.abstract}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultItem;