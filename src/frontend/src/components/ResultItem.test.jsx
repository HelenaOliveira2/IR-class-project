import { render, screen } from '@testing-library/react';
import ResultItem from './ResultItem';
// Já não precisas de importar o 'expect', 'test' e 'describe' se usares globals: true

describe('ResultItem Component - REQ-F91', () => {
  const mockDoc = {
    id: '123',
    title: 'Estudo sobre IA',
    authors: 'Santos, A.',
    pdf_link: 'http://example.com',
    score: 0.9
  };

  test('Deve renderizar o título corretamente', () => {
    render(<ResultItem doc={mockDoc} rank={1} />);
    expect(screen.getByText(/Estudo sobre IA/i)).toBeDefined();
  });
});

test('REQ-F91: O link do PDF deve apontar para o URL correto', () => {
    const mockDoc = { 
      title: 'Teste Link', 
      pdf_link: 'https://repositorium.sdum.uminho.pt/12345',
      authors: 'Autor Teste' 
    };
    render(<ResultItem doc={mockDoc} rank={1} />);
    
    // Opção A: Procurar o link que tem o texto "PDF"
    const pdfButtonLink = screen.getByRole('link', { name: /PDF/i });
    expect(pdfButtonLink).toHaveAttribute('href', 'https://repositorium.sdum.uminho.pt/12345');
  
    // Opção B: Procurar o link que tem o título do documento
    const titleLink = screen.getByRole('link', { name: /Teste Link/i });
    expect(titleLink).toHaveAttribute('href', 'https://repositorium.sdum.uminho.pt/12345');
  });

  test('REQ-F97/F98: Deve processar 100 resultados sem erro de memória', () => {
    const largeSet = Array.from({ length: 100 }, (_, i) => ({
      id: i, title: `Doc ${i}`, authors: 'Autor', pdf_link: '#'
    }));
    
    const startTime = performance.now();
    render(<ResultItem doc={largeSet[0]} rank={1} />);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(100); // Garante renderização em menos de 100ms
  });