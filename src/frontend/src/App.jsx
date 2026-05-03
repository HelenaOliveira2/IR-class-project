import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import SearchBox from './components/SearchBox'; // Importamos o novo componente
import './styles/main.scss';

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        {/* REQ-F04 e REQ-F05 estão aqui dentro */}
        <Header />
        
        {/* REQ-F01: Contentor principal com tag <main> */}
        <main className="main-container" role="main">
          
          <Routes>
            <Route path="/" element={
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', color: '#2D3748', marginBottom: '0.5rem' }}>
                  Motor de Recuperação de Informação
                </h2>
                <p style={{ color: '#718096', marginBottom: '2rem' }}>
                  Pesquise metadados de publicações científicas do RepositóriUM
                </p>
                
                {/* REQ-F06 a REQ-F10 estão todos aqui dentro */}
                <SearchBox />
              </div>
            } />
            <Route path="/authors" element={<h2>Pesquisa por Autores (Em breve)</h2>} />
            <Route path="/about" element={<h2>Funcionalidades Educativas (Em breve)</h2>} />
          </Routes>

        </main>
      </div>
    </Router>
  );
}

export default App;