import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ItineraryForm from '../pages/ItineraryForm';
import '@testing-library/jest-dom';

describe('ItineraryForm Component', () => {
  test('renders empty state message', () => {
    render(
      <BrowserRouter>
        <ItineraryForm />
      </BrowserRouter>
    );
    
    expect(screen.getByText('创建行程')).toBeInTheDocument();
    expect(screen.getByText('此页面内容已被删除')).toBeInTheDocument();
  });
});
