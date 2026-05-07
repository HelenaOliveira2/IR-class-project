import React, { useState } from 'react';
import ResultItem from '../components/ResultItem'; // Reutilizamos o teu componente!

export default function ComparePage({ collection, toggleSaveToCollection }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Configurações do Lado A (Ex: Stemming)
  const [configA, setConfigA] = useState({ method: 'stemming', ranking: 'custom_tfidf' });
  const [resultsA, setResultsA] = useState([]);
  const [metricsA, setMetricsA] = useState({ time: 0, indexTime: 1.2, total: 0 }); // indexTime fixo/simulado para já

  // Configurações do Lado B (Ex: Lemmatization)
  const [configB, setConfigB] = useState({ method: 'lemmatization', ranking: 'custom_tfidf' });
  const [resultsB, setResultsB] = useState([]);
  const [metricsB, setMetricsB] = useState({ time: 0, indexTime: 1.5, total: 0 }); // indexTime fixo/simulado para já

  const handleCompare = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);

    try {
      // IDEALMENTE: Fazer dois fetch() em paralelo usando Promise.all
      // const [resA, resB] = await Promise.all([ fetch(urlA), fetch(urlB) ]);
      
      // Aqui simulo dados para poderes ver a UI a funcionar imediatamente!
      setTimeout(() => {
        setResultsA([
          { id: '1', title: 'Artificial Intelligence in Health', abstract: '...', authors: ['John Doe'], date: '2023' },
          { id: '2', title: 'Medical AI Systems', abstract: '...', authors: ['Jane Smith'], date: '2022' }
        ]);
        setMetricsA({ time: 0.12, indexTime: 1.2, total: 45 });

        setResultsB([
          { id: '2', title: 'Medical AI Systems', abstract: '...', authors: ['Jane Smith'], date: '2022' },
          { id: '3', title: 'AI for Healthcare', abstract: '...', authors: ['Bob AI'], date: '2024' }
        ]);
        setMetricsB({ time: 0.18, indexTime: 1.5, total: 52 }); // Lemmatization costuma demorar mais!
        
        setLoading(false);
      }, 1000);

    } catch (error) {
      console.error("Erro na comparação:", error);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', textAlign: 'left' }}>
      <h2 style={{ color: '#2D3748', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        Análise e Comparação de Algoritmos
      </h2>

      {/* Barra de Pesquisa de Comparação */}
      <form onSubmit={handleCompare} style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Termo para comparar (ex: health intelligence)"
          style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '12px 24px', backgroundColor: '#4F46E5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          {loading ? 'A comparar...' : 'Comparar Lado a Lado'}
        </button>
      </form>

      {/* REQ-F53 e REQ-F54: Gráficos de Relatório e Performance */}
      {(resultsA.length > 0 || resultsB.length > 0) && (
        <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
          <h3 style={{ marginTop: 0, color: '#334155' }}>Relatório de Performance</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            {/* Gráfico 1: Tempo de Pesquisa */}
            <div>
              <p style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px' }}>Tempo de Pesquisa (Search Time)</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ width: '60px', fontSize: '0.8rem' }}>Lado A</span>
                <div style={{ flex: 1, backgroundColor: '#e2e8f0', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${(metricsA.time / Math.max(metricsA.time, metricsB.time)) * 100}%`, backgroundColor: '#3b82f6', height: '100%' }}></div>
                </div>
                <span style={{ width: '60px', fontSize: '0.8rem', textAlign: 'right' }}>{metricsA.time}s</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '60px', fontSize: '0.8rem' }}>Lado B</span>
                <div style={{ flex: 1, backgroundColor: '#e2e8f0', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${(metricsB.time / Math.max(metricsA.time, metricsB.time)) * 100}%`, backgroundColor: '#ef4444', height: '100%' }}></div>
                </div>
                <span style={{ width: '60px', fontSize: '0.8rem', textAlign: 'right' }}>{metricsB.time}s</span>
              </div>
            </div>

            {/* Gráfico 2: Total de Resultados */}
            <div>
              <p style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px' }}>Total de Resultados Encontrados</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ width: '60px', fontSize: '0.8rem' }}>Lado A</span>
                <div style={{ flex: 1, backgroundColor: '#e2e8f0', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${(metricsA.total / Math.max(metricsA.total, metricsB.total)) * 100}%`, backgroundColor: '#3b82f6', height: '100%' }}></div>
                </div>
                <span style={{ width: '60px', fontSize: '0.8rem', textAlign: 'right' }}>{metricsA.total} docs</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '60px', fontSize: '0.8rem' }}>Lado B</span>
                <div style={{ flex: 1, backgroundColor: '#e2e8f0', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${(metricsB.total / Math.max(metricsA.total, metricsB.total)) * 100}%`, backgroundColor: '#ef4444', height: '100%' }}></div>
                </div>
                <span style={{ width: '60px', fontSize: '0.8rem', textAlign: 'right' }}>{metricsB.total} docs</span>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '15px', fontSize: '0.85rem', color: '#64748b' }}>
            * Tempo de Indexação do Corpus (Aproximado): Lado A ({metricsA.indexTime}s) vs Lado B ({metricsB.indexTime}s).
          </div>
        </div>
      )}

      {/* REQ-F51: Side-by-side ranking comparison views */}
      <div style={{ display: 'flex', gap: '20px' }}>
        
        {/* COLUNA A */}
        <div style={{ flex: 1, border: '2px solid #bfdbfe', borderRadius: '8px', padding: '15px', backgroundColor: '#eff6ff' }}>
          <h3 style={{ marginTop: 0, color: '#1e3a8a', textAlign: 'center' }}>Lado A</h3>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <select value={configA.method} onChange={(e) => setConfigA({...configA, method: e.target.value})} style={{ flex: 1, padding: '5px' }}>
              <option value="stemming">Stemming</option>
              <option value="lemmatization">Lemmatization</option>
            </select>
            <select value={configA.ranking} onChange={(e) => setConfigA({...configA, ranking: e.target.value})} style={{ flex: 1, padding: '5px' }}>
              <option value="custom_tfidf">TF-IDF</option>
              <option value="boolean">Boolean</option>
            </select>
          </div>

          <div className="results-list">
            {resultsA.map((doc, index) => (
              <div key={doc.id} style={{ opacity: resultsB.find(d => d.id === doc.id) ? 1 : 0.6 }}> 
                {/* REQ-F52: Destaca visualmente se o documento não apareceu do outro lado */}
                <ResultItem doc={doc} rank={index + 1} isSaved={collection.some(item => item.id === doc.id)} onSave={() => toggleSaveToCollection(doc)} />
              </div>
            ))}
          </div>
        </div>

        {/* COLUNA B */}
        <div style={{ flex: 1, border: '2px solid #fecaca', borderRadius: '8px', padding: '15px', backgroundColor: '#fef2f2' }}>
          <h3 style={{ marginTop: 0, color: '#991b1b', textAlign: 'center' }}>Lado B</h3>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <select value={configB.method} onChange={(e) => setConfigB({...configB, method: e.target.value})} style={{ flex: 1, padding: '5px' }}>
              <option value="stemming">Stemming</option>
              <option value="lemmatization">Lemmatization</option>
            </select>
            <select value={configB.ranking} onChange={(e) => setConfigB({...configB, ranking: e.target.value})} style={{ flex: 1, padding: '5px' }}>
              <option value="custom_tfidf">TF-IDF</option>
              <option value="boolean">Boolean</option>
            </select>
          </div>

          <div className="results-list">
            {resultsB.map((doc, index) => (
              <div key={doc.id} style={{ opacity: resultsA.find(d => d.id === doc.id) ? 1 : 0.6 }}>
                <ResultItem doc={doc} rank={index + 1} isSaved={collection.some(item => item.id === doc.id)} onSave={() => toggleSaveToCollection(doc)} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}