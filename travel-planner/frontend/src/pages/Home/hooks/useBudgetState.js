import { useState, useCallback } from 'react';

const useBudgetState = (initialBudget) => {
  const [budget, setBudget] = useState(initialBudget || {
    total: 5000,
    transport: 1000,
    accommodation: 2000,
    food: 1200,
    tickets: 500,
    shopping: 300
  });

  const updateBudget = useCallback((newBudget) => {
    setBudget(newBudget);
  }, []);

  const resetBudget = useCallback(() => {
    setBudget({
      total: 5000,
      transport: 1000,
      accommodation: 2000,
      food: 1200,
      tickets: 500,
      shopping: 300
    });
  }, []);

  return {
    budget,
    updateBudget,
    resetBudget
  };
};

export default useBudgetState;
