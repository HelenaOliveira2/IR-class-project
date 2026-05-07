import React from 'react';

export default function AdminDashboard() {
  // Dados simulados para o Dashboard
  const stats = { totalDocs: 14502, totalTerms: 85230, avgDocLength: 450 }; // REQ-F55
  const frequentQueries = [ { query: 'artificial intelligence', count: 342 }, { query: 'health data', count: 215 }, { query: 'machine learning', count: 198 }, { query: 'climate change', count: 156 }, { query: 'quantum computing', count: 102 } ]; // REQ-F57
  const frequentTerms = [ { term: 'data', count: 8900 }, { term: 'model', count: 7450 }, { term: 'system', count: 6800 }, { term: 'network', count: 5200 }, { term: 'analysis', count: 4900 } ]; // REQ-F57
  const indexGrowth = [ { month: 'Jan', size: 120 }, { month: 'Fev', size: 145 }, { month: 'Mar', size: 190 }, { month: 'Abr', size: 250 }, { month: 'Mai', size: 310 }, { month: 'Jun', size: 420 } ]; // REQ-F56 (Tamanho em MB)
  const classification = { precision: 88, recall: 82, f1Score: 85, accuracy: 91 }; // REQ-F58 (%)

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', textAlign: 'left' }}>
      <h2 style={{ color: '#2D3748', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '30px' }}>
        Admin Dashboard: Estatísticas do Motor
      </h2>

      {/* REQ-F55: Collection statistics (Cartões no topo) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ color: '#1e40af', margin: '0 0 10px 0', fontWeight: 'bold' }}>Total de Documentos</p>
          <h3 style={{ margin: 0, fontSize: '2.5rem', color: '#1d4ed8' }}>{stats.totalDocs.toLocaleString()}</h3>
        </div>
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ color: '#166534', margin: '0 0 10px 0', fontWeight: 'bold' }}>Termos no Índice (Vocabulário)</p>
          <h3 style={{ margin: 0, fontSize: '2.5rem', color: '#15803d' }}>{stats.totalTerms.toLocaleString()}</h3>
        </div>
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ color: '#991b1b', margin: '0 0 10px 0', fontWeight: 'bold' }}>Tamanho Médio do Documento</p>
          <h3 style={{ margin: 0, fontSize: '2.5rem', color: '#b91c1c' }}>{stats.avgDocLength} <span style={{ fontSize: '1rem' }}>palavras</span></h3>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        
        {/* REQ-F56: Show index size and growth over time (Gráfico de Barras CSS) */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 20px 0', color: '#334155' }}>Crescimento do Índice Invertido (MB)</h4>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', paddingBottom: '30px', position: 'relative' }}>
            {indexGrowth.map((data, index) => {
              const maxVal = Math.max(...indexGrowth.map(d => d.size));
              const heightPercent = (data.size / maxVal) * 100;
              return (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '5px' }}>{data.size}</span>
                  <div style={{ width: '100%', height: `${heightPercent}%`, backgroundColor: '#3b82f6', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }}></div>
                  <span style={{ position: 'absolute', bottom: 0, fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>{data.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* REQ-F58: Create classification accuracy visualizations */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 20px 0', color: '#334155' }}>Métricas de Precisão do Algoritmo</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[
              { label: 'Accuracy Geral', value: classification.accuracy, color: '#8b5cf6' },
              { label: 'Precision (Relevância)', value: classification.precision, color: '#10b981' },
              { label: 'Recall (Cobertura)', value: classification.recall, color: '#f59e0b' },
              { label: 'F1-Score (Média Harmónica)', value: classification.f1Score, color: '#3b82f6' }
            ].map((metric, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>{metric.label}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: metric.color }}>{metric.value}%</span>
                </div>
                <div style={{ width: '100%', backgroundColor: '#e2e8f0', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${metric.value}%`, backgroundColor: metric.color, height: '100%' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* REQ-F57: Display most frequent queries and terms */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#334155' }}>Top 5 Pesquisas Frequentes</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {frequentQueries.map((item, index) => (
              <li key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: index !== 4 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ color: '#475569' }}>"{item.query}"</span>
                <span style={{ backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', color: '#334155' }}>{item.count}x</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#334155' }}>Top 5 Termos no Corpus</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {frequentTerms.map((item, index) => (
              <li key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: index !== 4 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ color: '#475569', fontWeight: '600' }}>{item.term}</span>
                <span style={{ backgroundColor: '#fee2e2', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', color: '#991b1b' }}>{item.count.toLocaleString()}x</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}