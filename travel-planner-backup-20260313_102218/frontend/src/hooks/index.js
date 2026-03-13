/**
 * 自定义 Hooks 集合
 * @module hooks
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { debounce, throttle } from '../utils';

/**
 * 使用本地存储的 Hook
 * @param {string} key - 存储键名
 * @param {any} initialValue - 初始值
 * @returns {[any, Function]} 存储的值和设置函数
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
};

/**
 * 使用防抖的 Hook
 * @param {Function} callback - 回调函数
 * @param {number} delay - 延迟时间
 * @returns {Function} 防抖后的函数
 */
export const useDebounce = (callback, delay = 500) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useMemo(() => debounce((...args) => callbackRef.current(...args), delay), [delay]);
};

/**
 * 使用节流的 Hook
 * @param {Function} callback - 回调函数
 * @param {number} limit - 限制时间
 * @returns {Function} 节流后的函数
 */
export const useThrottle = (callback, limit = 200) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useMemo(() => throttle((...args) => callbackRef.current(...args), limit), [limit]);
};

/**
 * 使用窗口大小的 Hook
 * @returns {Object} 窗口宽度和高度
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

/**
 * 使用滚动位置的 Hook
 * @returns {Object} 滚动位置
 */
export const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition({
        x: window.scrollX,
        y: window.scrollY
      });
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { ...scrollPosition, isScrolled };
};

/**
 * 使用点击外部的 Hook
 * @param {Function} callback - 点击外部时的回调
 * @returns {Object} ref 对象
 */
export const useClickOutside = (callback) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [callback]);

  return ref;
};

/**
 * 使用异步操作的 Hook
 * @param {Function} asyncFunction - 异步函数
 * @param {boolean} immediate - 是否立即执行
 * @returns {Object} 执行状态和函数
 */
export const useAsync = (asyncFunction, immediate = true) => {
  const [status, setStatus] = useState('idle');
  const [value, setValue] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...params) => {
      setStatus('pending');
      setValue(null);
      setError(null);

      try {
        const response = await asyncFunction(...params);
        setValue(response);
        setStatus('success');
        return response;
      } catch (error) {
        setError(error);
        setStatus('error');
        throw error;
      }
    },
    [asyncFunction]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, value, error };
};

/**
 * 使用定时器的 Hook
 * @param {Function} callback - 回调函数
 * @param {number} delay - 延迟时间
 * @returns {Object} 控制函数
 */
export const useInterval = (callback, delay) => {
  const savedCallback = useRef(callback);
  const intervalId = useRef(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const start = useCallback(() => {
    if (delay !== null) {
      intervalId.current = setInterval(() => savedCallback.current(), delay);
    }
  }, [delay]);

  const stop = useCallback(() => {
    if (intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    start();
  }, [start, stop]);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  return { start, stop, reset };
};

/**
 * 使用倒计时器的 Hook
 * @param {number} initialTime - 初始时间（秒）
 * @returns {Object} 倒计时状态和控制函数
 */
export const useCountdown = (initialTime) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(initialTime);
  }, [initialTime]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  return { timeLeft, isRunning, start, pause, reset };
};

/**
 * 使用表单处理的 Hook
 * @param {Object} initialValues - 初始值
 * @param {Function} validate - 验证函数
 * @returns {Object} 表单状态和处理函数
 */
export const useForm = (initialValues = {}, validate = null) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (touched[name] && validate) {
      const fieldErrors = validate({ ...values, [name]: value });
      setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
    }
  }, [values, touched, validate]);

  const handleBlur = useCallback((name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    if (validate) {
      const fieldErrors = validate(values);
      setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
    }
  }, [values, validate]);

  const handleSubmit = useCallback((onSubmit) => (event) => {
    if (event) event.preventDefault();
    
    if (validate) {
      const formErrors = validate(values);
      setErrors(formErrors);
      setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      
      if (Object.keys(formErrors).length === 0) {
        onSubmit(values);
      }
    } else {
      onSubmit(values);
    }
  }, [values, validate]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValues
  };
};

/**
 * 使用分页的 Hook
 * @param {Array} data - 数据数组
 * @param {number} itemsPerPage - 每页项目数
 * @returns {Object} 分页状态和函数
 */
export const usePagination = (data, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  const goToPage = useCallback((page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    currentPage,
    totalPages,
    currentData,
    goToPage,
    nextPage,
    prevPage
  };
};

/**
 * 使用搜索过滤的 Hook
 * @param {Array} data - 数据数组
 * @param {string[]} searchFields - 搜索字段
 * @returns {Object} 过滤状态和函数
 */
export const useSearchFilter = (data, searchFields = []) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});

  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) =>
          String(getNestedValue(item, field, '')).toLowerCase().includes(term)
        )
      );
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        result = result.filter((item) => getNestedValue(item, key) === value);
      }
    });

    return result;
  }, [data, searchTerm, filters, searchFields]);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const handleFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilters({});
  }, []);

  return {
    searchTerm,
    filters,
    filteredData,
    handleSearch,
    handleFilter,
    clearFilters
  };
};

/**
 * 使用排序的 Hook
 * @param {Array} data - 数据数组
 * @param {string} defaultSortKey - 默认排序键
 * @param {string} defaultOrder - 默认排序方向
 * @returns {Object} 排序状态和函数
 */
export const useSort = (data, defaultSortKey = '', defaultOrder = 'asc') => {
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortOrder, setSortOrder] = useState(defaultOrder);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aVal = getNestedValue(a, sortKey);
      const bVal = getNestedValue(b, sortKey);

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortOrder]);

  const handleSort = useCallback((key) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  }, [sortKey]);

  return {
    sortKey,
    sortOrder,
    sortedData,
    handleSort
  };
};

/**
 * 使用开关状态的 Hook
 * @param {boolean} initialValue - 初始值
 * @returns {Object} 状态和控制函数
 */
export const useToggle = (initialValue = false) => {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue((prev) => !prev), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return {
    value,
    toggle,
    setTrue,
    setFalse,
    setValue
  };
};

/**
 * 使用布尔状态的 Hook
 * @param {boolean} initialValue - 初始值
 * @returns {[boolean, Object]} 状态和控制函数
 */
export const useBoolean = (initialValue = false) => {
  const [value, setValue] = useState(initialValue);

  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue((prev) => !prev), []);

  return [
    value,
    {
      setTrue,
      setFalse,
      toggle,
      setValue
    }
  ];
};

/**
 * 使用数组状态的 Hook
 * @param {Array} initialValue - 初始值
 * @returns {Object} 数组状态和控制函数
 */
export const useArray = (initialValue = []) => {
  const [array, setArray] = useState(initialValue);

  const push = useCallback((item) => {
    setArray((prev) => [...prev, item]);
  }, []);

  const remove = useCallback((index) => {
    setArray((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const update = useCallback((index, item) => {
    setArray((prev) => prev.map((val, i) => (i === index ? item : val)));
  }, []);

  const clear = useCallback(() => {
    setArray([]);
  }, []);

  const reset = useCallback(() => {
    setArray(initialValue);
  }, [initialValue]);

  return {
    array,
    setArray,
    push,
    remove,
    update,
    clear,
    reset
  };
};

// 辅助函数
const getNestedValue = (obj, path, defaultValue = null) => {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result === null || result === undefined) return defaultValue;
    result = result[key];
  }
  return result !== undefined ? result : defaultValue;
};
