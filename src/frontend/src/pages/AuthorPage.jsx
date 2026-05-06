import React, { useState } from 'react';
import { Search, User, Users, BarChart2, BookOpen } from 'lucide-react';
import ResultItem from '../components/ResultItem';

const AuthorPage = ({ collection = [], toggleSaveToCollection }) => {
  const [authorProfile, setAuthorProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const handleAuthorSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/authors/profile?name=${encodeURIComponent(query)}`);
      const data = await response.json();
      setAuthorProfile(data);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px', textAlign: 'left' }}>
      
      {/* Cabeçalho e Barra de Pesquisa */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2rem', color: '#2D3748', marginBottom: '0.5rem' }}>Perfil do Investigador</h2>
        <p style={{ color: '#718096', marginBottom: '2rem' }}>Explore a rede de co-autoria e o impacto das publicações.</p>
        
        <form onSubmit={handleAuthorSearch} style={{ display: 'flex', gap: '10px', maxWidth: '600px', margin: '0 auto' }}>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: Nome do Autor..."
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }}
          />
          {/* BOTÃO VERMELHO */}
          <button 
            type="submit" 
            style={{ padding: '12px 24px', backgroundColor: '#B91C1C', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 'bold' }}
          >
            <Search size={20} /> Procurar
          </button>
        </form>
      </div>

      {loading && <div style={{ textAlign: 'center', marginTop: '50px' }}><div className="spinner"></div><p>A carregar perfil...</p></div>}

      {/* RESULTADOS */}
      {!loading && authorProfile && authorProfile.publications.length > 0 && (
        <div className="fade-in">
          
          {/* SECÇÃO SUPERIOR: 2 Colunas (Perfil + Timeline) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
            
            {/* Esquerda: Cartão e Rede */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '70px', height: '70px', backgroundColor: '#cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={35} color="#475569" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', color: '#1e293b', margin: '0 0 5px 0' }}>{authorProfile.name}</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Universidade do Minho</p>
                </div>
              </div>

              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', margin: '0 0 15px 0' }}>
                  <Users size={18} /> Rede de Co-autoria
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {authorProfile.collaborators.length > 0 ? (
                    authorProfile.collaborators.map(colab => (
                      <span key={colab} style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '5px 12px', borderRadius: '15px', fontSize: '0.85rem', border: '1px solid #cbd5e1' }}>
                        {colab}
                      </span>
                    ))
                  ) : (
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Nenhuma colaboração registada.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Direita: Gráfico Melhorado */}
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', margin: '0 0 20px 0' }}>
                <BarChart2 size={18} /> Produção Científica por Ano
              </h4>
              
              {/* Container do Gráfico Limpo e Bonito */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '20px', height: '220px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginTop: 'auto', overflowX: 'auto' }}>
                {authorProfile.timeline.map((item) => (
                  <div key={item.year} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#B91C1C' }}>
                      {item.count}
                    </span>
                    {/* Barra */}
                    <div style={{ 
                      width: '45px', 
                      height: `${Math.min(item.count * 30, 160)}px`, 
                      minHeight: '10px',
                      backgroundColor: '#fca5a5', 
                      borderRadius: '4px 4px 0 0'
                    }}></div>
                    <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 'bold' }}>
                      {item.year}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* SECÇÃO INFERIOR: Obras Publicadas em LARGURA TOTAL */}
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', margin: 0, fontSize: '1.2rem' }}>
                <BookOpen size={22} color="#B91C1C" /> Obras Publicadas ({authorProfile.publications.length})
              </h4>
            </div>
            
            <div className="results-list">
              {authorProfile.publications.map((doc, index) => (
                <ResultItem 
                  key={doc.id || index} 
                  doc={doc} 
                  rank={index + 1} 
                  isSaved={collection.some(item => item.id === doc.id)} 
                  onSave={() => toggleSaveToCollection(doc)}
                />
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Sem Resultados */}
      {!loading && authorProfile && authorProfile.publications.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '40px', color: '#64748b' }}>
          <p>Nenhum documento encontrado para "{authorProfile.name}".</p>
        </div>
      )}

    </div>
  );
};

export default AuthorPage;