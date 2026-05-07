import React, { useState } from 'react';
import { Star, Folder, Trash2, ChevronDown, ChevronUp, FileText, Search } from 'lucide-react';
import ResultItem from '../components/ResultItem';

const CollectionPage = ({ 
  collection, 
  savedSearches, 
  toggleSaveToCollection, 
  onRemoveSavedSearch,
  density,
  showSnippet 
}) => {
  const [expandedTerm, setExpandedTerm] = useState(null);

  // 1. Agrupar as pesquisas por nome da coleção
  const groupedCollections = savedSearches.reduce((acc, curr) => {
    const name = curr.collectionName || 'Geral';
    if (!acc[name]) acc[name] = [];
    acc[name].push(curr);
    return acc;
  }, {});

  const boxStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '40px auto', padding: '0 20px', textAlign: 'left' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#1e293b', margin: 0 }}>O Meu Espaço</h1>
        <p style={{ color: '#64748b' }}>Gere as tuas coleções e artigos favoritos.</p>
      </div>

      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
        
        {/* COLUNA ESQUERDA: CAIXINHAS DE COLEÇÕES */}
        <section style={{ flex: '0 0 450px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Folder size={22} color="#B91C1C" />
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Minhas Coleções</h2>
          </div>

          {Object.keys(groupedCollections).length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center' }}>Nenhuma coleção guardada.</p>
          ) : (
            Object.entries(groupedCollections).map(([folderName, searches]) => (
              <div key={folderName} style={boxStyle}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#B91C1C', borderBottom: '1px solid #fee2e2', paddingBottom: '8px' }}>
                  📁 {folderName}
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {searches.map((item) => (
                    <div key={item.id} style={{ border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                      {/* Termo de Pesquisa */}
                      <div 
                        style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: expandedTerm === item.id ? '#f8fafc' : '#fff' }}
                        onClick={() => setExpandedTerm(expandedTerm === item.id ? null : item.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Search size={14} color="#64748b" />
                          <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{item.query}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onRemoveSavedSearch(item.id); }}
                            style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                          {expandedTerm === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>

                      {/* Dentro do expandedTerm === item.id no CollectionPage.jsx */}
                        {expandedTerm === item.id && (
                        <div style={{ padding: '10px', borderTop: '1px solid #f1f5f9', backgroundColor: '#fff' }}>
                            {item.results && item.results.length > 0 ? (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {item.results.map((doc, dIdx) => (
                                <li key={dIdx} style={{ 
                                    padding: '6px 0', 
                                    fontSize: '0.85rem', 
                                    borderBottom: dIdx === item.results.length - 1 ? 'none' : '1px dashed #f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <FileText size={14} color="#3b82f6" />
                                    
                                    {/* Título Clicável */}
                                    <a 
                                    href={doc.pdf_link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ 
                                        textDecoration: 'none', 
                                        color: '#2563eb', 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap',
                                        fontWeight: '500'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                                    title="Abrir no repositório"
                                    >
                                    {doc.title}
                                    </a>
                                </li>
                                ))}
                            </ul>
                            ) : (
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                                Sem documentos capturados.
                            </p>
                            )}
                        </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        {/* COLUNA DIREITA: ARTIGOS COMPLETOS (ESTRELAS) */}
        <section style={{ flex: 2, backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
            <Star size={22} color="#eab308" fill="#eab308" />
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Artigos Individuais</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {collection.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center' }}>Nenhum artigo guardado individualmente.</p>
            ) : (
              collection.map((doc, idx) => (
                <ResultItem 
                  key={doc.id || idx} 
                  doc={doc} 
                  rank={idx + 1} 
                  isSaved={true} 
                  onSave={() => toggleSaveToCollection(doc)} 
                  density={density} 
                  showSnippet={showSnippet} 
                />
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default CollectionPage;