import React from 'react';
import { BookOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  // Hook para identificar a página atual e ativar o estilo no menu (REQ-F03)
  const location = useLocation();

  return (
    // REQ-F05: Uso de tags semânticas <header> e role 'banner' para acessibilidade WCAG 2.1
    <header className="app-header" role="banner">
      
      {/* REQ-F04: Design com branding da universidade e info do projeto */}
      <div className="brand">
        <img src="/logo-uminho.png" alt="Logótipo UMinho" style={{ height: '40px' }} />
        <div>
          <h1>UMinho IR Engine</h1>
          <span>Research Publication Search</span>
        </div>
      </div>

      {/* REQ-F03: Navegação intuitiva entre modos de pesquisa */}
      {/* REQ-F05: Tag <nav> para suporte a leitores de ecrã */}
      <nav aria-label="Navegação Principal">
        <div className="nav-links">
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'active' : ''}
            aria-current={location.pathname === '/' ? 'page' : undefined}
          >
            Pesquisa
          </Link>
          <Link 
            to="/authors" 
            className={location.pathname === '/authors' ? 'active' : ''}
            aria-current={location.pathname === '/authors' ? 'page' : undefined}
          >
            Autores
          </Link>
          <Link 
            to="/about" 
            className={location.pathname === '/about' ? 'active' : ''}
            aria-current={location.pathname === '/about' ? 'page' : undefined}
          >
            Como Funciona
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;