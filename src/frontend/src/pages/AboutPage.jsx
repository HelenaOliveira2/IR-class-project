import React, { useState } from 'react';

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState('inverted-index');

  const tabStyle = (isActive) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    borderBottom: isActive ? '3px solid #B91C1C' : '3px solid transparent',
    color: isActive ? '#B91C1C' : '#475569',
    fontWeight: isActive ? 'bold' : 'normal',
    backgroundColor: isActive ? '#f8fafc' : 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: '1rem',
    transition: 'all 0.3s ease'
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', textAlign: 'left', padding: '0 20px' }}>
      
      {/* REQ-F47: Título e introdução da secção educativa */}
      <h2 style={{ color: '#2D3748', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        Como Funciona o Motor de Busca?
      </h2>
      <p style={{ color: '#718096', marginBottom: '30px' }}>
        Descubra os conceitos teóricos de Recuperação de Informação (Information Retrieval) que dão vida a este motor de busca.
      </p>

      {/* Navegação das Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <button style={tabStyle(activeTab === 'inverted-index')} onClick={() => setActiveTab('inverted-index')}>
          1. Índice Invertido
        </button>
        <button style={tabStyle(activeTab === 'tfidf')} onClick={() => setActiveTab('tfidf')}>
          2. Cálculo TF-IDF
        </button>
        <button style={tabStyle(activeTab === 'boolean')} onClick={() => setActiveTab('boolean')}>
          3. Operações Booleanas
        </button>
      </div>

      {/* CONTEÚDO DAS TABS */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        
        {/* REQ-F48: Visualize inverted index structure */}
        {activeTab === 'inverted-index' && (
          <div className="tab-content fade-in">
            <h3 style={{ color: '#2D3748' }}>Estrutura do Índice Invertido</h3>
            <p>Em vez de procurar palavra a palavra em cada documento (o que seria muito lento), o motor cria um "índice", semelhante ao índice no final de um livro. Ele mapeia cada termo para a lista de documentos onde esse termo aparece.</p>
            
            <div style={{ marginTop: '20px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#B91C1C' }}>Exemplo Visual:</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e2e8f0' }}>
                    <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>Termo (Token)</th>
                    <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>IDs dos Documentos (Postings List)</th>
                    <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>Frequência Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px' }}><strong>artificial</strong></td>
                    <td style={{ padding: '10px', color: '#0369a1' }}>Doc1, Doc3, Doc8</td>
                    <td style={{ padding: '10px' }}>3</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px' }}><strong>intelligence</strong></td>
                    <td style={{ padding: '10px', color: '#0369a1' }}>Doc1, Doc3, Doc8, Doc15</td>
                    <td style={{ padding: '10px' }}>4</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px' }}><strong>health</strong></td>
                    <td style={{ padding: '10px', color: '#0369a1' }}>Doc2, Doc3, Doc5</td>
                    <td style={{ padding: '10px' }}>3</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REQ-F49: Show TF-IDF calculation examples */}
        {activeTab === 'tfidf' && (
          <div className="tab-content fade-in">
            <h3 style={{ color: '#2D3748' }}>Como funciona o TF-IDF?</h3>
            <p>O <strong>TF-IDF</strong> (Term Frequency - Inverse Document Frequency) é usado para calcular a importância de uma palavra num documento, em relação a toda a coleção de documentos.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div style={{ backgroundColor: '#e0f2fe', padding: '15px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <h4 style={{ color: '#0369a1', marginTop: 0 }}>1. TF (Frequência do Termo)</h4>
                <p style={{ fontSize: '0.9rem' }}>Mede a frequência da palavra no documento. Se aparece muitas vezes, é importante nesse contexto.</p>
                <div style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '5px', fontFamily: 'monospace' }}>
                  TF = (Contagem do Termo no Doc) / (Total de Palavras no Doc)
                </div>
              </div>

              <div style={{ backgroundColor: '#fef08a', padding: '15px', borderRadius: '8px', border: '1px solid #fde047' }}>
                <h4 style={{ color: '#a16207', marginTop: 0 }}>2. IDF (Frequência Inversa)</h4>
                <p style={{ fontSize: '0.9rem' }}>Penaliza palavras muito comuns (como "o", "a", "é") e dá peso a palavras raras e específicas na coleção inteira.</p>
                <div style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '5px', fontFamily: 'monospace' }}>
                  IDF = log( Total de Docs / Docs que contêm o termo )
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#B91C1C' }}>A Fórmula Final:</h4>
              <p style={{ fontSize: '1.2rem', textAlign: 'center', fontWeight: 'bold', margin: '10px 0' }}>
                TF-IDF Score = TF × IDF
              </p>
              <p style={{ fontSize: '0.9rem', color: '#475569' }}>
                <em>Exemplo: A palavra "Saúde" aparece 5 vezes no DocA (TF alto). O motor tem 10.000 documentos, mas "Saúde" só aparece em 50 (IDF alto). Logo, o DocA terá um Score TF-IDF altíssimo para a palavra "Saúde".</em>
              </p>
            </div>
          </div>
        )}

        {/* REQ-F50: Display Boolean operation demonstrations */}
        {activeTab === 'boolean' && (
          <div className="tab-content fade-in">
            <h3 style={{ color: '#2D3748' }}>Demonstração de Operações Booleanas</h3>
            <p>O modelo booleano utiliza lógica matemática estrita para filtrar documentos. Um documento ou faz correspondência exata, ou é excluído.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '20px' }}>
              {/* Operador AND */}
              <div style={{ backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <h4 style={{ color: '#166534', marginTop: 0 }}>Operador AND</h4>
                <p style={{ fontSize: '0.85rem' }}>O documento <strong>tem</strong> de conter ambos os termos (Interseção).</p>
                <div style={{ fontWeight: 'bold', margin: '15px 0' }}>
                  A <span style={{ color: '#166534' }}>AND</span> B
                </div>
                <ul style={{ listStyleType: 'none', padding: 0, fontSize: '0.8rem', textAlign: 'left', backgroundColor: '#fff', padding: '10px', borderRadius: '5px' }}>
                  <li><strong>A =</strong> [Doc1, Doc2, Doc3]</li>
                  <li><strong>B =</strong> [Doc2, Doc4]</li>
                  <li style={{ borderTop: '1px solid #eee', marginTop: '5px', paddingTop: '5px', color: '#166534' }}><strong>Resultado: [Doc2]</strong></li>
                </ul>
              </div>

              {/* Operador OR */}
              <div style={{ backgroundColor: '#eff6ff', padding: '15px', borderRadius: '8px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                <h4 style={{ color: '#1e40af', marginTop: 0 }}>Operador OR</h4>
                <p style={{ fontSize: '0.85rem' }}>O documento pode conter <strong>qualquer um</strong> dos termos (União).</p>
                <div style={{ fontWeight: 'bold', margin: '15px 0' }}>
                  A <span style={{ color: '#1e40af' }}>OR</span> B
                </div>
                <ul style={{ listStyleType: 'none', padding: 0, fontSize: '0.8rem', textAlign: 'left', backgroundColor: '#fff', padding: '10px', borderRadius: '5px' }}>
                  <li><strong>A =</strong> [Doc1]</li>
                  <li><strong>B =</strong> [Doc2, Doc4]</li>
                  <li style={{ borderTop: '1px solid #eee', marginTop: '5px', paddingTop: '5px', color: '#1e40af' }}><strong>Resultado: [Doc1, Doc2, Doc4]</strong></li>
                </ul>
              </div>

              {/* Operador NOT */}
              <div style={{ backgroundColor: '#fef2f2', padding: '15px', borderRadius: '8px', border: '1px solid #fecaca', textAlign: 'center' }}>
                <h4 style={{ color: '#991b1b', marginTop: 0 }}>Operador NOT</h4>
                <p style={{ fontSize: '0.85rem' }}>O documento <strong>não pode</strong> conter o termo (Diferença).</p>
                <div style={{ fontWeight: 'bold', margin: '15px 0' }}>
                  A <span style={{ color: '#991b1b' }}>NOT</span> B
                </div>
                <ul style={{ listStyleType: 'none', padding: 0, fontSize: '0.8rem', textAlign: 'left', backgroundColor: '#fff', padding: '10px', borderRadius: '5px' }}>
                  <li><strong>A =</strong> [Doc1, Doc2, Doc3]</li>
                  <li><strong>B =</strong> [Doc2]</li>
                  <li style={{ borderTop: '1px solid #eee', marginTop: '5px', paddingTop: '5px', color: '#991b1b' }}><strong>Resultado: [Doc1, Doc3]</strong></li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}