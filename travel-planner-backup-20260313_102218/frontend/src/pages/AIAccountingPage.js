/**
 * AI智能记账页面
 * 完整的记账功能页面
 * @module pages/AIAccountingPage
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import AIAccounting from '../components/AIAccounting';

const AIAccountingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="fade-in">
      <AIAccounting
        onBack={() => navigate('/')} 
        initialBudget={5000}
        compact={false}
        onBudgetUpdate={(budgetData) => {
          console.log('预算更新:', budgetData);
        }}
      />
    </div>
  );
};

export default AIAccountingPage;
