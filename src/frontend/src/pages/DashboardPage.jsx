import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend } from 'recharts';

// [Código dos componentes DashboardCard e ChartContainer permanece igual...]

export default function DashboardPage() {
  const [yearData, setYearData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/stats')
      .then(res => res.json())
      .then(json => {
        const raw = json.by_year || json || []; 
        
        // 1. Agrupar e somar por ano (apenas os 4 primeiros dígitos)
        const groups = raw.reduce((acc, item) => {
          const year = String(item.year || '2000').substring(0, 4);
          acc[year] = (acc[year] || 0) + parseInt(item.count || 0);
          return acc;
        }, {});

        // 2. Transformar em array e garantir que year é um número para o gráfico
        const formatted = Object.keys(groups)
          .sort()
          .map(y => ({
            year: y, // Mantém como string para o XAxis
            count: groups[y]
          }));
        
        console.log("DADOS FINAIS PARA GRÁFICO:", formatted);
        setYearData(formatted);
      })
      .catch(err => console.error('Erro:', err))
      .finally(() => setLoading(false));
  }, []);

  const totalDocuments = useMemo(() => {
    return yearData.reduce((acc, item) => acc + item.count, 0);
  }, [yearData]);

  const mostProductiveYear = useMemo(() => {
    if (!yearData.length) return '-';

    return [...yearData].sort((a, b) => b.count - a.count)[0]?.year;
  }, [yearData]);

  const averagePerYear = useMemo(() => {
    if (!yearData.length) return 0;

    return Math.round(totalDocuments / yearData.length);
  }, [yearData, totalDocuments]);

  const pieData = useMemo(() => {
    return yearData.slice(0, 5).map(item => ({
      name: item.year,
      value: item.count
    }));
  }, [yearData]);

  const COLORS = ['#2563eb', '#7c3aed', '#0f766e', '#ea580c', '#dc2626'];

  if (loading) return <div style={{ padding: '40px' }}>A carregar estatísticas... 📊</div>;


  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        padding: '40px'
      }}
    >

      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2.5rem',
              margin: 0,
              color: '#0f172a'
            }}
          >
            Dashboard Analítico
          </h1>

          <p
            style={{
              marginTop: '10px',
              color: '#64748b',
              fontSize: '1.05rem'
            }}
          >
            Estatísticas e visualização da produção científica
          </p>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            color: 'white',
            padding: '20px 30px',
            borderRadius: '18px',
            boxShadow: '0 10px 30px rgba(37,99,235,0.25)'
          }}
        >
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            Total de Publicações
          </div>

          <div
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginTop: '5px'
            }}
          >
            {totalDocuments}
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '25px',
          marginBottom: '35px'
        }}
      >

        <DashboardCard
          title="Ano Mais Produtivo"
          value={mostProductiveYear}
          subtitle="Maior número de publicações"
          gradient="linear-gradient(135deg, #2563eb, #1d4ed8)"
        />

        <DashboardCard
          title="Média Anual"
          value={averagePerYear}
          subtitle="Publicações por ano"
          gradient="linear-gradient(135deg, #7c3aed, #6d28d9)"
        />

        <DashboardCard
          title="Anos Indexados"
          value={yearData.length}
          subtitle="Intervalo temporal disponível"
          gradient="linear-gradient(135deg, #0f766e, #115e59)"
        />

        <DashboardCard
          title="Estado do Sistema"
          value="Online"
          subtitle="API e motor de pesquisa ativos"
          gradient="linear-gradient(135deg, #ea580c, #c2410c)"
        />

      </div>

      {/* MAIN GRID - Vamos forçar a visibilidade aqui */}
<div style={{ 
    display: 'grid', 
    gridTemplateColumns: '2fr 1fr', 
    gap: '25px', 
    marginBottom: '25px',
    minHeight: '400px' // Garante que a grelha tem altura
}}>

 <ChartContainer title="Produção Científica por Ano">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={yearData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>
  </ChartContainer>

  {/* PIE CHART */}
  <ChartContainer title="Distribuição Temporal">
    <div style={{ width: '100%', height: '400px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={yearData}
            dataKey="count"
            nameKey="year"
            cx="50%"
            cy="50%"
            outerRadius={120}
            label
          >
            {yearData.map((entry, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </ChartContainer>

</div>




      {/* SECOND ROW */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '25px'
        }}
      >

        {/* AREA CHART */}
        <ChartContainer title="Evolução Temporal">
            <div style={{ width: '100%', height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={yearData}>
                    <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />

                    <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    />
                </AreaChart>
                </ResponsiveContainer>
            </div>
            </ChartContainer>

        {/* LINE CHART */}
        <ChartContainer title="Tendência de Crescimento">
  <div style={{ width: '100%', height: '320px' }}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={yearData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />

        <Line
          type="monotone"
          dataKey="count"
          stroke="#7c3aed"
          strokeWidth={4}
          dot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</ChartContainer>

      </div>

    </div>
  );
}


function DashboardCard({ title, value, subtitle, gradient }) {
    
  return (
    <div
      style={{
        background: gradient,
        color: 'white',
        borderRadius: '22px',
        padding: '25px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
        transition: 'transform 0.2s ease'
      }}
    >
      <div
        style={{
          fontSize: '0.95rem',
          opacity: 0.9,
          marginBottom: '10px'
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: '0.9rem',
          opacity: 0.85
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

function ChartContainer({ title, children }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '24px',
      padding: '25px',
      boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
      border: '1px solid #e2e8f0',
      height: '450px', // Altura fixa aqui
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h2 style={{ marginBottom: '20px', color: '#0f172a', fontSize: '1.2rem' }}>{title}</h2>
      <div style={{ flex: 1, width: '100%' }}>
         {children} 
      </div>
    </div>
  );
}