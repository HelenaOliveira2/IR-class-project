import React from 'react';
import { Download, Trash2, Clock, Star, FileText } from 'lucide-react';

const HistoryPage = ({ history, saved, onExport, onClearHistory, onRemoveSaved }) => {
  
  // Estilos comuns
  const sectionStyle = {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    marginBottom: '30px'
  };

  return (
    <div className="main-container" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* --- SECÇÃO 1: HISTÓRICO DE PESQUISA --- */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Clock size={24} color="#64748b" /> Histórico de Pesquisa
          </h2>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => onExport('csv')} 
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={16} /> Exportar CSV
            </button>
            <button 
              onClick={onClearHistory} 
              className="btn-danger" 
              style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}
            >
              <Trash2 size={16} /> Limpar Tudo
            </button>
          </div>
        </div>

        {history.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>Nenhum histórico registado.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {history.map((item, index) => (
              <li key={index} style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ color: '#1e293b' }}>"{item.query}"</strong>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {new Date(item.timestamp).toLocaleString()} • {item.resultsCount} resultados
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', alignSelf: 'center' }}>
                  {item.engine}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
};

export default HistoryPage;