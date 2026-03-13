/**
 * 行程列表管理Hook
 * @module modules/itinerary/hooks/useItineraries
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  Itinerary,
  ItineraryFilter,
  PaginationParams,
  PaginatedResult,
  ApiError
} from '../types';
import { itineraryService } from '../services/itineraryService';

interface UseItinerariesOptions {
  initialFilter?: ItineraryFilter;
  initialPagination?: PaginationParams;
  autoFetch?: boolean;
}

interface UseItinerariesReturn {
  itineraries: Itinerary[];
  loading: boolean;
  error: ApiError | null;
  pagination: PaginationParams & { total: number; totalPages: number };
  filter: ItineraryFilter;
  setFilter: (filter: ItineraryFilter | ((prev: ItineraryFilter) => ItineraryFilter)) => void;
  setPagination: (pagination: PaginationParams | ((prev: PaginationParams) => PaginationParams)) => void;
  refetch: () => Promise<void>;
  deleteItinerary: (id: number) => Promise<void>;
}

/**
 * 行程列表管理Hook
 * 提供行程列表的获取、筛选、分页等功能
 */
export const useItineraries = (options: UseItinerariesOptions = {}): UseItinerariesReturn => {
  const {
    initialFilter = {},
    initialPagination = { page: 1, pageSize: 10 },
    autoFetch = true
  } = options;

  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [filter, setFilterState] = useState<ItineraryFilter>(initialFilter);
  const [pagination, setPaginationState] = useState<PaginationParams & { total: number; totalPages: number }>({
    ...initialPagination,
    total: 0,
    totalPages: 0
  });

  const isMounted = useRef(true);

  // 获取行程列表
  const fetchItineraries = useCallback(async () => {
    if (!isMounted.current) return;

    setLoading(true);
    setError(null);

    try {
      const result = await itineraryService.getItineraries(filter, {
        page: pagination.page,
        pageSize: pagination.pageSize
      });

      if (isMounted.current) {
        setItineraries(result.data);
        setPaginationState(prev => ({
          ...prev,
          total: result.total,
          totalPages: result.totalPages
        }));
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err as ApiError);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [filter, pagination.page, pagination.pageSize]);

  // 删除行程
  const deleteItinerary = useCallback(async (id: number) => {
    try {
      await itineraryService.deleteItinerary(id);
      // 重新获取列表
      await fetchItineraries();
    } catch (err) {
      setError(err as ApiError);
      throw err;
    }
  }, [fetchItineraries]);

  // 设置筛选条件（支持函数式更新）
  const setFilter = useCallback((
    newFilter: ItineraryFilter | ((prev: ItineraryFilter) => ItineraryFilter)
  ) => {
    setFilterState(prev => {
      const updated = typeof newFilter === 'function' ? newFilter(prev) : newFilter;
      // 重置到第一页
      setPaginationState(p => ({ ...p, page: 1 }));
      return updated;
    });
  }, []);

  // 设置分页（支持函数式更新）
  const setPagination = useCallback((
    newPagination: PaginationParams | ((prev: PaginationParams) => PaginationParams)
  ) => {
    setPaginationState(prev => {
      const updated = typeof newPagination === 'function'
        ? newPagination(prev)
        : newPagination;
      return { ...prev, ...updated };
    });
  }, []);

  // 重新获取数据
  const refetch = useCallback(async () => {
    await fetchItineraries();
  }, [fetchItineraries]);

  // 自动获取数据
  useEffect(() => {
    if (autoFetch) {
      fetchItineraries();
    }
  }, [fetchItineraries, autoFetch]);

  // 清理
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    itineraries,
    loading,
    error,
    pagination,
    filter,
    setFilter,
    setPagination,
    refetch,
    deleteItinerary
  };
};

export default useItineraries;
