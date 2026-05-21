import React, { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Filler, Tooltip, Legend, Title
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Filler, Tooltip, Legend, Title
);

export default function DashboardPage() {
  const [yearData, setYearData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/stats')
      .then(res => {
        if (!res.ok) throw new Error("A API respondeu com um erro crítico.");
        return res.json();
      })
      .then(json => {
        let raw = [];
        if (json && json.by_year && Array.isArray(json.by_year)) raw = json.by_year;
        else if (Array.isArray(json)) raw = json;

        const groups = raw.reduce((acc, item) => {
          if (!item) return acc;
          const rawYear = item.year != null ? String(item.year).trim() : '';
          if (!rawYear || rawYear === 'N/D' || rawYear === '0') return acc;
          const year = rawYear.substring(0, 4);
          const count = parseInt(item.count, 10) || 0;
          acc[year] = (acc[year] || 0) + count;
          return acc;
        }, {});

        setYearData(Object.keys(groups).sort().map(y => ({ year: y, count: groups[y] })));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalDocuments = useMemo(() => yearData.reduce((a, i) => a + i.count, 0), [yearData]);
  const mostProductiveYear = useMemo(() => !yearData.length ? '-' : [...yearData].sort((a, b) => b.count - a.count)[0]?.year, [yearData]);
  const averagePerYear = useMemo(() => !yearData.length ? 0 : Math.round(totalDocuments / yearData.length), [yearData, totalDocuments]);

  const labels = yearData.map(d => d.year);
  const counts = yearData.map(d => d.count);
  const COLORS = ['#2563eb', '#7c3aed', '#0f766e', '#ea580c', '#dc2626', '#0891b2', '#b45309'];

  const barData = {
    labels,
    datasets: [{ label: 'Publicações', data: counts, backgroundColor: '#2563eb', borderRadius: 6 }]
  };

  const pieData = {
    labels: labels.slice(0, 5),
    datasets: [{ data: counts.slice(0, 5), backgroundColor: COLORS }]
  };

  const areaData = {
    labels,
    datasets: [{
      label: 'Publicações', data: counts, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.15)',
      fill: true, tension: 0.4, pointRadius: 4
    }]
  };

  const lineData = {
    labels,
    datasets: [{
      label: 'Tendência', data: counts, borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.1)',
      tension: 0.4, pointRadius: 5, borderWidth: 3
    }]
  };

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
  const chartOptionsLegend = { responsive: true, maintainAspectRatio: false };

  if (loading) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '1.2rem' }}>
      A ler estatísticas do repositório... 📊
    </div>
  );

  if (error) return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '40px auto', backgroundColor: '#fef2f2', border: '1px solid #f87171', borderRadius: '12px', color: '#991b1b' }}>
      <h3>⚠️ Erro</h3><p>{error}</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px', textAlign: 'left' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', margin: 0, color: '#0f172a' }}>Dashboard Analítico</h1>
          <p style={{ marginTop: '10px', color: '#64748b', fontSize: '1.05rem' }}>Estatísticas e visualização da produção científica</p>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: 'white', padding: '20px 30px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(37,99,235,0.25)' }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total de Publicações</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '5px' }}>{totalDocuments}</div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '25px', marginBottom: '35px' }}>
        <DashboardCard title="Ano Mais Produtivo" value={mostProductiveYear} subtitle="Maior número de publicações" gradient="linear-gradient(135deg, #2563eb, #1d4ed8)" />
        <DashboardCard title="Média Anual" value={averagePerYear} subtitle="Publicações por ano" gradient="linear-gradient(135deg, #7c3aed, #6d28d9)" />
        <DashboardCard title="Anos Indexados" value={yearData.length} subtitle="Intervalo temporal disponível" gradient="linear-gradient(135deg, #0f766e, #115e59)" />
        <DashboardCard title="Estado do Sistema" value="Online" subtitle="API e motor de pesquisa ativos" gradient="linear-gradient(135deg, #10b981, #047857)" />
      </div>

      {/* MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px', marginBottom: '25px' }}>
        <ChartContainer title="Produção Científica por Ano">
          <Bar data={barData} options={chartOptions} />
        </ChartContainer>
        <ChartContainer title="Distribuição Temporal (Top 5)">
          <Pie data={pieData} options={chartOptionsLegend} />
        </ChartContainer>
      </div>

      {/* SECOND ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
        <ChartContainer title="Evolução Temporal">
          <Line data={areaData} options={chartOptions} />
        </ChartContainer>
        <ChartContainer title="Tendência de Crescimento">
          <Line data={lineData} options={chartOptions} />
        </ChartContainer>
      </div>

    </div>
  );
}

function DashboardCard({ title, value, subtitle, gradient }) {
  return (
    <div style={{ background: gradient, color: 'white', borderRadius: '22px', padding: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)' }}>
      <div style={{ fontSize: '0.95rem', opacity: 0.9, marginBottom: '10px' }}>{title}</div>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>{value}</div>
      <div style={{ fontSize: '0.9rem', opacity: 0.85 }}>{subtitle}</div>
    </div>
  );
}

function ChartContainer({ title, children }) {
  return (
    <div style={{ background: 'white', borderRadius: '24px', padding: '25px', boxShadow: '0 10px 30px rgba(15,23,42,0.06)', border: '1px solid #e2e8f0' }}>
      <h2 style={{ marginBottom: '20px', color: '#0f172a', fontSize: '1.2rem', fontWeight: '600' }}>{title}</h2>
      <div style={{ position: 'relative', height: '300px' }}>
        {children}
      </div>
    </div>
  );
}
