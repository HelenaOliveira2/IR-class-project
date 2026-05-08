import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// Import removido: já não precisas do Router aqui
import App from './App';
import { expect, test, vi } from 'vitest';

// Simular o fetch global
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ 
      results: [{ id: 1, title: 'Resultado Integrado', authors: 'Autor A', pdf_link: '#' }],
      total_count: 1,
      search_time: '0.01s'
    }),
  })
);

test('REQ-F92: Deve realizar fluxo completo de pesquisa e exibir resultados', async () => {
    render(<App />);
  
    // 1. Encontrar a barra de pesquisa pelo label ou placeholder real
    // Usamos aria-label porque o teu log mostra: aria-label="Escreva a sua pesquisa aqui"
    const input = screen.getByLabelText(/Escreva a sua pesquisa aqui/i);
    
    fireEvent.change(input, { target: { value: 'Inteligência Artificial' } });
  
    // 2. Clicar no botão de pesquisa (procurando pelo texto "Pesquisar")
    const searchButton = screen.getByRole('button', { name: /Pesquisar/i });
    fireEvent.click(searchButton);
  
    // 3. Verificar se os resultados aparecem
    // Aumentamos o timeout para 5 segundos para garantir que o fetch simulado completa
    await waitFor(() => {
        // Procuramos o título do resultado mockado
        expect(screen.getByText(/Resultado Integrado/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    
      // CORREÇÃO: Usamos getAllByText porque o texto aparece na barra de stats e na região sr-only
      const statsElements = screen.getAllByText(/Encontrados/i);
      expect(statsElements.length).toBeGreaterThan(0);
      
      // Opcional: verificar se o primeiro elemento (o visível) está no documento
      expect(statsElements[0]).toBeInTheDocument();
    });