import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Tooltip, Legend, Title
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Title);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/admin-stats')
      .then(res => {
        if (!res.ok) throw new Error("Não foi possível obter dados do motor de busca.");
        return res.json();
      })
      .then(fetchedData => { setData(fetchedData); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', fontSize: '1.2rem' }}>
      A ler metadados do motor de busca... 🚀
    </div>
  );

  if (error || !data) return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '8px', border: '1px solid #f87171' }}>
      <h4>⚠️ Erro de Ligação ao Painel de Administração</h4>
      <p><strong>Detalhe:</strong> {error || "Dados nulos recebidos"}</p>
    </div>
  );

  const stats = data.stats || { totalDocs: 0, totalTerms: 0, avgDocLength: 0 };
  const frequentQueries = data.frequentQueries || [];
  const frequentTerms = data.frequentTerms || [];
  const indexGrowth = data.indexGrowth || [];
  const classification = data.classification || { precision: 0, recall: 0, f1Score: 0, accuracy: 0 };

  const lineData = {
    labels: indexGrowth.map(d => d.month),
    datasets: [{
      label: 'Tamanho (MB)',
      data: indexGrowth.map(d => d.size),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37,99,235,0.1)',
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 4,
    }]
  };

  const barData = {
    labels: ['Precisão', 'Recall', 'F1-Score', 'Accuracy'],
    datasets: [{
      label: 'Percentagem',
      data: [classification.precision, classification.recall, classification.f1Score, classification.accuracy],
      backgroundColor: '#10b981',
      borderRadius: 6,
    }]
  };

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
  const barOptions = { ...chartOptions, scales: { y: { min: 0, max: 100 } } };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px', textAlign: 'left', fontFamily: 'system-ui, sans-serif' }}>

      <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '30px' }}>
        <h2 style={{ color: '#1e293b', margin: 0, fontSize: '2rem' }}>Painel de Administração do Motor</h2>
        <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Métricas de indexação, performance do sistema e logs de qualidade</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {[
          { label: 'Documentos Processados', value: stats.totalDocs.toLocaleString(), color: '#0f172a' },
          { label: 'Termos Únicos Indexados', value: stats.totalTerms.toLocaleString(), color: '#2563eb' },
          { label: 'Média de Palavras / Doc', value: stats.avgDocLength, color: '#10b981' },
        ].map((kpi, i) => (
          <div key={i} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <h5 style={{ margin: '0 0 10px 0', color: '#64748b', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>{kpi.label}</h5>
            <span style={{ fontSize: '2.2rem', fontWeight: 'bold', color: kpi.color }}>{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* GRÁFICOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '30px', marginBottom: '40px' }}>
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '25px', borderRadius: '16px' }}>
          <h4 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>Crescimento do Índice Invertido (MB)</h4>
          <div style={{ position: 'relative', height: '300px' }}>
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '25px', borderRadius: '16px' }}>
          <h4 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>Métricas de Avaliação do Motor (%)</h4>
          <div style={{ position: 'relative', height: '300px' }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* LISTAGENS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '30px' }}>
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>Top 5 Pesquisas Frequentes</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {frequentQueries.map((item, index) => (
              <li key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 10px', borderBottom: index !== frequentQueries.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ color: '#475569', fontWeight: '500' }}>"{item.query}"</span>
                <span style={{ backgroundColor: '#eff6ff', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', color: '#1e40af' }}>{item.count} pesquisas</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>Top 5 Termos Mais Comuns no Corpus</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {frequentTerms.map((item, index) => (
              <li key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 10px', borderBottom: index !== frequentTerms.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ color: '#475569', fontStyle: 'italic' }}>{item.term}</span>
                <span style={{ backgroundColor: '#f0fdf4', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', color: '#166534' }}>{item.count} vezes</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}