// src/components/HelpPage.jsx
import React from 'react';
import { BookOpen, Settings, Filter, Lightbulb } from 'lucide-react'; // Instala lucide-react se não tiveres

export default function HelpPage() {
  const Section = ({ icon: Icon, title, children }) => (
    <div style={{ 
      backgroundColor: '#fff', borderRadius: '12px', padding: '25px', 
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '20px',
      borderTop: '4px solid #B91C1C' 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
        <Icon size={24} color="#B91C1C" />
        <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b' }}>{title}</h2>
      </div>
      <div style={{ color: '#475569', lineHeight: '1.6' }}>{children}</div>
    </div>
  );

  const exampleCardStyle = {
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    borderLeft: '5px solid #B91C1C',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  };
  
  const exampleTitleStyle = {
    margin: '0 0 10px 0',
    color: '#334155',
    fontSize: '1.1rem'
  };
  
  const codeStyle = {
    display: 'block',
    padding: '10px',
    backgroundColor: '#f1f5f9',
    borderRadius: '6px',
    color: '#B91C1C',
    fontWeight: 'bold',
    fontSize: '0.95rem',
    marginBottom: '10px'
  };
  
  const exampleDescStyle = {
    margin: 0,
    fontSize: '0.9rem',
    color: '#64748b',
    lineHeight: '1.5'
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#1e293b', marginBottom: '10px' }}>Guia de Pesquisa e Configuração</h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Aprenda a extrair o máximo potencial do UMinho IR Engine.</p>
        </div>

        {/* SECÇÃO 1: FILTROS DE PESQUISA */}
        <Section icon={Filter} title="Filtros de Pesquisa">
          <p>Estes filtros definem <b>onde</b> e <b>como</b> o motor procura a informação:</p>
          <ul style={{ paddingLeft: '20px' }}>
            <li><b>Modo Geral:</b> Procura termos no texto. <b>Modo Autor:</b> Procura especificamente nomes de investigadores.</li>
            <li><b>Pesquisar em:</b> Restringe a busca apenas a <i>Títulos</i>, <i>Resumos</i> ou ao <i>Documento Completo</i> para maior precisão.</li>
            <li><b>Área de Investigação:</b> Filtra resultados por domínios científicos (ex: Saúde, Engenharia).</li>
          </ul>
        </Section>

        {/* SECÇÃO 2: PROCESSAMENTO TÉCNICO */}
        <Section icon={Settings} title="Configurações de Processamento">
          <p>Controla como o texto é interpretado antes do cálculo de relevância:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
            <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 5px 0' }}>Método</h4>
              <small><b>Stemming:</b> Corta as palavras para a raiz (ex: "pesquisa" → "pesqu"). Mais rápido.<br/>
              <b>Lemmatization:</b> Usa o dicionário para a forma base (ex: "melhores" → "bom"). Mais preciso.</small>
            </div>
            <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 5px 0' }}>Stop Words</h4>
              <small>Ao ativar, o sistema ignora palavras comuns (o, a, de, que) que não acrescentam valor à pesquisa, tornando o ranking mais justo.</small>
            </div>
          </div>
        </Section>

        {/* SECÇÃO 3: ALGORITMOS DE RANKING */}
        <Section icon={BookOpen} title="Algoritmos e Pesos">
          <p>Define a fórmula matemática que decide qual documento aparece em #1:</p>
          <ul style={{ paddingLeft: '20px' }}>
            <li><b>Custom TF-IDF:</b> A nossa fórmula otimizada que equilibra a frequência do termo no documento com a sua raridade na coleção.</li>
            <li><b>Scikit-Learn:</b> Utiliza a biblioteca padrão da indústria para cálculos vetoriais.</li>
            <li><b>Booleano:</b> Um sistema binário (Sim/Não). O documento ou tem a palavra ou não tem, sem "notas" intermédias.</li>
            <li><b>Esquema de Pesos (Log Normalization):</b> Suaviza documentos que repetem a mesma palavra centenas de vezes, evitando spam.</li>
          </ul>
        </Section>

        {/* SECÇÃO 4: ESTRATÉGIAS (REQ-F70) */}
        <section style={{ marginTop: '40px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
                <Lightbulb size={24} color="#B91C1C" /> 
                Exemplos de Estratégias de Pesquisa
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                
                {/* Exemplo 1: Pesquisa por Frase Exata */}
                <div style={exampleCardStyle}>
                <h4 style={exampleTitleStyle}>1. Pesquisa por Termos Exatos</h4>
                <code style={codeStyle}>"Deep Learning" AND "Natural Language Processing"</code>
                <p style={exampleDescStyle}>
                    Útil para encontrar documentos que discutem especificamente a interseção de duas áreas sem separar as palavras das frases.
                </p>
                </div>

                {/* Exemplo 2: Expansão de Sinónimos */}
                <div style={exampleCardStyle}>
                <h4 style={exampleTitleStyle}>2. Expansão com Sinónimos (OR)</h4>
                <code style={codeStyle}>cancer OR oncology OR "malignant tumor"</code>
                <p style={exampleDescStyle}>
                    Aumenta a abrangência da pesquisa ao incluir diferentes termos técnicos para o mesmo conceito médico.
                </p>
                </div>

                {/* Exemplo 3: Filtragem por Exclusão */}
                <div style={exampleCardStyle}>
                <h4 style={exampleTitleStyle}>3. Exclusão de Tópicos Irrelevantes</h4>
                <code style={codeStyle}>robotics NOT military NOT drones</code>
                <p style={exampleDescStyle}>
                    Ideal quando queres estudar robótica civil ou industrial, removendo resultados focados em aplicações militares.
                </p>
                </div>

                {/* Exemplo 4: Pesquisa Complexa Agrupada */}
                <div style={exampleCardStyle}>
                <h4 style={exampleTitleStyle}>4. Combinação Complexa com Parênteses</h4>
                <code style={codeStyle}>(Portugal OR Brazil) AND "sustainable energy" AND NOT solar</code>
                <p style={exampleDescStyle}>
                    Procura por energia sustentável em países lusófonos, mas exclui especificamente a energia solar dos resultados.
                </p>
                </div>

            </div>
            </section>
      </div>
    </div>
  );
}