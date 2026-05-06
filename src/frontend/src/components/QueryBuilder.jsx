import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Move } from 'lucide-react';

const QueryBuilder = ({ onQueryChange }) => {
  // REQ-F39: Interface visual para construção de queries
  const [rules, setRules] = useState([{ id: Date.now(), term: '', operator: 'AND' }]);

  // REQ-F42: Converte a estrutura visual em sintaxe de texto booleana
  useEffect(() => {
    const textQuery = rules
      .filter(r => r.term.trim() !== '')
      .map((r, index) => {
        if (index === 0) return r.term;
        return `${r.operator} ${r.term}`;
      })
      .join(' ');
    
    onQueryChange(textQuery);
  }, [rules]);

  const addRule = () => {
    // REQ-F40: Adição de novas regras de construção
    setRules([...rules, { id: Date.now(), term: '', operator: 'AND' }]);
  };

  const removeRule = (id) => {
    if (rules.length > 1) {
      setRules(rules.filter(r => r.id !== id));
    }
  };

  const updateRule = (id, field, value) => {
    setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  return (
    <div className="query-builder-container fade-in">
      <p className="builder-title">Visual Query Builder</p>
      
      {rules.map((rule, index) => (
        <div key={rule.id} className="query-rule-row slide-up">
          {/* REQ-F41: Exibição visual do operador e precedência */}
          {index > 0 && (
            <div className="operator-select">
              <select 
                value={rule.operator} 
                onChange={(e) => updateRule(rule.id, 'operator', e.target.value)}
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
                <option value="NOT">NOT</option>
              </select>
            </div>
          )}

          <div className="term-input-wrapper">
            <span className="drag-handle"><Move size={14} /></span>
            <input 
              type="text" 
              placeholder="Termo de pesquisa..."
              value={rule.term}
              onChange={(e) => updateRule(rule.id, 'term', e.target.value)}
            />
            {rules.length > 1 && (
              <button className="remove-btn" onClick={() => removeRule(rule.id)}>
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      ))}

      <button className="add-rule-btn" onClick={addRule}>
        <Plus size={16} /> Adicionar Condição 
      </button>
    </div>
  );
};

export default QueryBuilder;