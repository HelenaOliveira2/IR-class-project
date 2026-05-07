import React from 'react';

// Adicionamos valores padrão (= []) para evitar que a página fique branca se as props falharem
export default function HistoryPage({ history = [], saved = [], onClearHistory }) {

    // REQ-F61: Agrupa as pesquisas guardadas pelo nome da coleção
  const groupedCollections = saved.reduce((acc, item) => {
    const folder = item.collectionName || "Sem Coleção";
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(item);
    return acc;
  }, {});
  
  const exportData = () => {
    const data = { history, savedCollections: saved };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'meu_historico_pesquisa.json';
    link.click();
  };

  return (
    <div className="main-container" style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#1e293b' }}>O Meu Espaço</h1>
        <button onClick={exportData} className="btn-primary" style={{ padding: '10px 20px', backgroundColor: '#B91C1C', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          📥 Exportar Dados (JSON)
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        
        {/* REQ-F61: Coleções Agrupadas por Pastas */}
        <section>
          <h2 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>📂 Minhas Coleções</h2>
          {Object.keys(groupedCollections).length === 0 ? (
            <p style={{ color: '#64748b' }}>Nenhuma coleção guardada.</p>
          ) : (
            Object.entries(groupedCollections).map(([folderName, items]) => (
              <div key={folderName} style={{ marginBottom: '25px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', backgroundColor: '#fff' }}>
                <h3 style={{ color: '#B91C1C', marginTop: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📁 {folderName}
                </h3>
                
                {items.map(item => (
                  <div key={item.id} style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', marginBottom: '10px' }}>
                    <strong style={{ color: '#334155' }}>{item.name}</strong>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0' }}>Busca: "{item.query}"</p>
                    
                    {/* EXIBIÇÃO DOS DOCUMENTOS GUARDADOS (REQ-F61) */}
                    {item.savedResults && item.savedResults.length > 0 && (
                      <details style={{ marginTop: '8px' }}>
                        <summary style={{ fontSize: '0.75rem', cursor: 'pointer', color: '#B91C1C', fontWeight: '600' }}>
                          Ver {item.savedResults.length} documentos nesta pesquisa
                        </summary>
                        <ul style={{ fontSize: '0.75rem', paddingLeft: '18px', marginTop: '5px', color: '#475569' }}>
                          {item.savedResults.map((doc, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>
                              {doc.title} <span style={{ color: '#94a3b8' }}>({doc.date})</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </section>

        {/* REQ-F59: Histórico Recente */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '10px' }}>
            <h2>🕒 Histórico Recente</h2>
            <button onClick={onClearHistory} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>Limpar Tudo</button>
          </div>
          {history.length === 0 ? <p style={{ color: '#64748b' }}>Histórico vazio.</p> :
            history.map(item => (
              <div key={item.id} style={{ fontSize: '0.9rem', padding: '10px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#334155' }}>"{item.query}"</span>
                <small style={{ color: '#94a3b8' }}>{item.timestamp}</small>
              </div>
            ))
          }
        </section>
      </div>
    </div>
  );
}