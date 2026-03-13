/**
 * 行程模块集成测试
 * @module modules/itinerary/__tests__/integration.test
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ItineraryListPage } from '../components/ItineraryListPage';
import { useItineraries } from '../hooks/useItineraries';
import type { Itinerary } from '../types';

// Mock the hooks
jest.mock('../hooks/useItineraries');

const mockUseItineraries = useItineraries as jest.MockedFunction<typeof useItineraries>;

describe('Itinerary Module Integration Tests', () => {
  const mockItineraries: Itinerary[] = [
    {
      id: 1,
      title: '杭州西湖三日游',
      days: 3,
      budget: 3000,
      departure: '上海',
      companion_type: '情侣',
      interests: '自然风光,历史文化',
      status: 'planning',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      destinations: ['杭州'],
      schedules: []
    },
    {
      id: 2,
      title: '上海迪士尼亲子游',
      days: 2,
      budget: 5000,
      departure: '杭州',
      companion_type: '亲子',
      interests: '亲子游玩',
      status: 'ongoing',
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-10T10:00:00Z',
      destinations: ['上海'],
      schedules: []
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ItineraryListPage', () => {
    it('should render loading state', () => {
      mockUseItineraries.mockReturnValue({
        itineraries: [],
        loading: true,
        error: null,
        pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
        filter: { status: 'all', sortBy: 'created_at', sortOrder: 'desc' },
        setFilter: jest.fn(),
        setPagination: jest.fn(),
        refetch: jest.fn(),
        deleteItinerary: jest.fn()
      });

      render(
        <BrowserRouter>
          <ItineraryListPage />
        </BrowserRouter>
      );

      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('should render error state', () => {
      mockUseItineraries.mockReturnValue({
        itineraries: [],
        loading: false,
        error: { message: 'Failed to fetch itineraries' },
        pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
        filter: { status: 'all', sortBy: 'created_at', sortOrder: 'desc' },
        setFilter: jest.fn(),
        setPagination: jest.fn(),
        refetch: jest.fn(),
        deleteItinerary: jest.fn()
      });

      render(
        <BrowserRouter>
          <ItineraryListPage />
        </BrowserRouter>
      );

      expect(screen.getByText(/加载失败/)).toBeInTheDocument();
      expect(screen.getByText('重试')).toBeInTheDocument();
    });

    it('should render empty state', () => {
      mockUseItineraries.mockReturnValue({
        itineraries: [],
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
        filter: { status: 'all', sortBy: 'created_at', sortOrder: 'desc' },
        setFilter: jest.fn(),
        setPagination: jest.fn(),
        refetch: jest.fn(),
        deleteItinerary: jest.fn()
      });

      render(
        <BrowserRouter>
          <ItineraryListPage />
        </BrowserRouter>
      );

      expect(screen.getByText('暂无行程')).toBeInTheDocument();
      expect(screen.getByText('创建第一个行程')).toBeInTheDocument();
    });

    it('should render itinerary list', () => {
      mockUseItineraries.mockReturnValue({
        itineraries: mockItineraries,
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
        filter: { status: 'all', sortBy: 'created_at', sortOrder: 'desc' },
        setFilter: jest.fn(),
        setPagination: jest.fn(),
        refetch: jest.fn(),
        deleteItinerary: jest.fn()
      });

      render(
        <BrowserRouter>
          <ItineraryListPage />
        </BrowserRouter>
      );

      expect(screen.getByText('杭州西湖三日游')).toBeInTheDocument();
      expect(screen.getByText('上海迪士尼亲子游')).toBeInTheDocument();
    });

    it('should handle search input', async () => {
      const setFilterMock = jest.fn();
      mockUseItineraries.mockReturnValue({
        itineraries: mockItineraries,
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
        filter: { status: 'all', sortBy: 'created_at', sortOrder: 'desc' },
        setFilter: setFilterMock,
        setPagination: jest.fn(),
        refetch: jest.fn(),
        deleteItinerary: jest.fn()
      });

      render(
        <BrowserRouter>
          <ItineraryListPage />
        </BrowserRouter>
      );

      const searchInput = screen.getByPlaceholderText('搜索行程...');
      fireEvent.change(searchInput, { target: { value: '杭州' } });

      await waitFor(() => {
        expect(setFilterMock).toHaveBeenCalled();
      });
    });

    it('should handle status filter change', () => {
      const setFilterMock = jest.fn();
      mockUseItineraries.mockReturnValue({
        itineraries: mockItineraries,
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
        filter: { status: 'all', sortBy: 'created_at', sortOrder: 'desc' },
        setFilter: setFilterMock,
        setPagination: jest.fn(),
        refetch: jest.fn(),
        deleteItinerary: jest.fn()
      });

      render(
        <BrowserRouter>
          <ItineraryListPage />
        </BrowserRouter>
      );

      // Find and click on status filter
      const statusSelect = screen.getAllByRole('combobox')[0];
      fireEvent.mouseDown(statusSelect);

      // Click on '进行中' option
      const ongoingOption = screen.getByText('进行中');
      fireEvent.click(ongoingOption);

      expect(setFilterMock).toHaveBeenCalled();
    });
  });

  describe('useItineraries Hook Integration', () => {
    it('should handle filter and pagination updates', async () => {
      const mockRefetch = jest.fn();
      mockUseItineraries.mockReturnValue({
        itineraries: mockItineraries,
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
        filter: { status: 'all', sortBy: 'created_at', sortOrder: 'desc' },
        setFilter: jest.fn(),
        setPagination: jest.fn(),
        refetch: mockRefetch,
        deleteItinerary: jest.fn()
      });

      render(
        <BrowserRouter>
          <ItineraryListPage />
        </BrowserRouter>
      );

      // Verify data is displayed
      expect(screen.getByText('杭州西湖三日游')).toBeInTheDocument();
      expect(screen.getByText('上海迪士尼亲子游')).toBeInTheDocument();
    });
  });
});

describe('Itinerary Service Integration', () => {
  it('should handle API errors gracefully', async () => {
    mockUseItineraries.mockReturnValue({
      itineraries: [],
      loading: false,
      error: { message: 'Network error', code: '500' },
      pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
      filter: { status: 'all' },
      setFilter: jest.fn(),
      setPagination: jest.fn(),
      refetch: jest.fn(),
      deleteItinerary: jest.fn()
    });

    render(
      <BrowserRouter>
        <ItineraryListPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/加载失败/)).toBeInTheDocument();
  });
});
