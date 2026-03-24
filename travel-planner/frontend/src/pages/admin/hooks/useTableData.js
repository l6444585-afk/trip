import { useState, useCallback, useRef, useEffect } from 'react';
import { message } from 'antd';

export default function useTableData(fetchService, options = {}) {
  const { pageSize: defaultPageSize = 20, initialFilters = {} } = options;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [filters, _setFilters] = useState({ ...initialFilters });

  const serviceRef = useRef(fetchService);
  serviceRef.current = fetchService;
  const filtersRef = useRef(filters);
  const isUserAction = useRef(false);

  const setFilters = useCallback((val) => {
    const next = typeof val === 'function' ? val(filtersRef.current) : val;
    filtersRef.current = next;
    _setFilters(next);
  }, []);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, [setFilters]);

  const fetchData = useCallback(async (p, ps, f, showError) => {
    setLoading(true);
    try {
      const params = { page: p, page_size: ps };
      Object.entries(f).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) params[k] = v;
      });
      const result = await serviceRef.current(params);
      if (Array.isArray(result)) {
        setData(result);
        setTotal(result.length);
      } else {
        setData(result.items || []);
        setTotal(result.total || 0);
      }
    } catch (err) {
      if (showError) message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(1, defaultPageSize, initialFilters, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPageChange = useCallback((p, ps) => {
    setPage(p);
    setPageSize(ps);
    fetchData(p, ps, filtersRef.current, true);
  }, [fetchData]);

  const search = useCallback(() => {
    setPage(1);
    fetchData(1, pageSize, filtersRef.current, true);
  }, [fetchData, pageSize]);

  const reset = useCallback(() => {
    const f = { ...initialFilters };
    filtersRef.current = f;
    _setFilters(f);
    setPage(1);
    setPageSize(defaultPageSize);
    fetchData(1, defaultPageSize, f, true);
  }, [fetchData, initialFilters, defaultPageSize]);

  const refresh = useCallback(() => {
    fetchData(page, pageSize, filtersRef.current, true);
  }, [fetchData, page, pageSize]);

  return {
    loading, data, total, filters, setFilters, updateFilter,
    pagination: {
      current: page, pageSize, total,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (t) => `共 ${t} 条`,
      onChange: onPageChange,
    },
    search, reset, refresh,
  };
}
