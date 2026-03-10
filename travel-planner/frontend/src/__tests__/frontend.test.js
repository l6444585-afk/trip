import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import ItineraryList from '../src/pages/ItineraryList';
import ItineraryForm from '../src/pages/ItineraryForm';
import Home from '../src/pages/Home';

jest.mock('axios');

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('ItineraryList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders itinerary list', async () => {
    const mockItineraries = [
      {
        id: 1,
        title: '杭州三日游',
        days: 3,
        budget: 3000,
        departure: '杭州',
        companion_type: '情侣',
        interests: '美食,人文历史',
        created_at: '2024-01-23T00:00:00'
      }
    ];

    axios.get.mockResolvedValue({ data: mockItineraries });

    render(
      <TestWrapper>
        <ItineraryList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('杭州三日游')).toBeInTheDocument();
    });
  });

  test('handles delete', async () => {
    const mockItineraries = [
      {
        id: 1,
        title: '杭州三日游',
        days: 3,
        budget: 3000,
        departure: '杭州',
        companion_type: '情侣',
        interests: '美食,人文历史',
        created_at: '2024-01-23T00:00:00'
      }
    ];

    axios.get.mockResolvedValue({ data: mockItineraries });
    axios.delete.mockResolvedValue({ data: { message: '删除成功' } });

    render(
      <TestWrapper>
        <ItineraryList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('杭州三日游')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText('delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/api/itineraries/1');
    });
  });
});

describe('ItineraryForm', () => {
  test('renders form correctly', () => {
    render(
      <TestWrapper>
        <ItineraryForm />
      </TestWrapper>
    );

    expect(screen.getByText('创建您的专属行程')).toBeInTheDocument();
    expect(screen.getByText('行程标题')).toBeInTheDocument();
    expect(screen.getByText('出发地')).toBeInTheDocument();
  });

  test('submits form successfully', async () => {
    axios.post.mockResolvedValue({
      data: {
        itinerary_id: 1,
        generated_itinerary: {}
      }
    });

    render(
      <TestWrapper>
        <ItineraryForm />
      </TestWrapper>
    );

    const titleInput = screen.getByPlaceholderText('例如：杭州三日游');
    fireEvent.change(titleInput, { target: { value: '杭州三日游' } });

    const submitButton = screen.getByText('生成行程');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });
});

describe('Home', () => {
  test('renders home page', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    expect(screen.getByText('江浙沪旅游行程规划系统')).toBeInTheDocument();
    expect(screen.getByText('创建新行程')).toBeInTheDocument();
    expect(screen.getByText('我的行程')).toBeInTheDocument();
  });

  test('navigates to create page', () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);

    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    const createButton = screen.getByText('立即开始规划');
    fireEvent.click(createButton);

    expect(mockNavigate).toHaveBeenCalledWith('/create');
  });
});
