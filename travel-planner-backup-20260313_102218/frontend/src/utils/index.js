/**
 * 工具函数集合
 * @module utils
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

export * from './amapSecurity';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 限制时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * 格式化货币
 * @param {number} amount - 金额
 * @param {string} currency - 货币符号
 * @returns {string} 格式化后的金额字符串
 */
export const formatCurrency = (amount, currency = '¥') => {
  if (amount === null || amount === undefined) return `${currency}0`;
  return `${currency}${amount.toLocaleString()}`;
};

/**
 * 格式化日期
 * @param {string|Date} date - 日期
 * @param {string} format - 格式化模板
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

/**
 * 获取相对时间
 * @param {string|Date} date - 日期
 * @returns {string} 相对时间字符串
 */
export const getRelativeTime = (date) => {
  if (!date) return '-';
  return dayjs(date).fromNow();
};

/**
 * 计算行程进度百分比
 * @param {Object} itinerary - 行程对象
 * @returns {number} 进度百分比
 */
export const calculateProgress = (itinerary) => {
  if (!itinerary?.start_date || !itinerary?.end_date) return 0;

  const now = dayjs();
  const start = dayjs(itinerary.start_date);
  const end = dayjs(itinerary.end_date);

  if (now.isBefore(start)) return 0;
  if (now.isAfter(end)) return 100;

  const total = end.diff(start, 'day');
  const elapsed = now.diff(start, 'day');
  return Math.round((elapsed / total) * 100);
};

/**
 * 根据目的地获取图片
 * @param {string[]} destinations - 目的地数组
 * @returns {string} 图片URL
 */
export const getDestinationImage = (destinations) => {
  const images = {
    杭州: '/images/cities/hangzhou.jpg',
    上海: '/images/cities/shanghai.jpg',
    苏州: '/images/cities/suzhou.jpg',
    南京: '/images/cities/nanjing.jpg',
    无锡: '/images/cities/wuxi.jpg',
    宁波: '/images/cities/ningbo.jpg',
    嘉兴: '/images/cities/jiaxing.jpg',
    舟山: '/images/cities/zhoushan.jpg'
  };

  if (!destinations || destinations.length === 0) {
    return '/images/cities/hangzhou.jpg';
  }

  return images[destinations[0]] || images['杭州'];
};

/**
 * 生成行程文本内容
 * @param {Object} itinerary - 行程对象
 * @returns {string} 格式化的行程文本
 */
export const generateItineraryText = (itinerary) => {
  if (!itinerary) return '';

  let text = `行程标题：${itinerary.title}\n`;
  text += `出行天数：${itinerary.days}天\n`;
  text += `预算：${itinerary.budget}元\n`;
  text += `出发地：${itinerary.departure}\n`;
  text += `同行人员：${itinerary.companion_type}\n`;
  text += `兴趣偏好：${itinerary.interests}\n\n`;

  const groupedSchedules = groupSchedulesByDay(itinerary.schedules);

  Object.keys(groupedSchedules)
    .sort((a, b) => a - b)
    .forEach((day) => {
      text += `=== 第${day}天 ===\n`;
      groupedSchedules[day].forEach((schedule) => {
        const periodMap = { morning: '上午', afternoon: '下午', evening: '晚上' };
        text += `${periodMap[schedule.period]}：${schedule.activity}\n`;
        text += `  地点：${schedule.location}\n`;
        if (schedule.notes) {
          text += `  提示：${schedule.notes}\n`;
        }
        text += '\n';
      });
    });

  return text;
};

/**
 * 按天分组行程
 * @param {Array} schedules - 行程数组
 * @returns {Object} 按天分组的行程对象
 */
export const groupSchedulesByDay = (schedules) => {
  if (!schedules || !Array.isArray(schedules)) return {};

  return schedules.reduce((acc, schedule) => {
    if (!acc[schedule.day]) {
      acc[schedule.day] = [];
    }
    acc[schedule.day].push(schedule);
    return acc;
  }, {});
};

/**
 * 计算预算分配
 * @param {number} totalBudget - 总预算
 * @returns {Object} 预算分配对象
 */
export const calculateBudgetBreakdown = (totalBudget) => {
  if (totalBudget <= 0) {
    return { transport: 0, accommodation: 0, food: 0, tickets: 0, shopping: 0, other: 0 };
  }

  const transport = Math.round(totalBudget * 0.25);
  const accommodation = Math.round(totalBudget * 0.35);
  const food = Math.round(totalBudget * 0.2);
  const tickets = Math.round(totalBudget * 0.1);
  const shopping = Math.round(totalBudget * 0.05);
  const other = totalBudget - transport - accommodation - food - tickets - shopping;

  return { transport, accommodation, food, tickets, shopping, other };
};

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @returns {boolean} 是否有效
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * 深拷贝对象
 * @param {Object} obj - 要拷贝的对象
 * @returns {Object} 拷贝后的对象
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map((item) => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach((key) => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
  return obj;
};

/**
 * 截断文本
 * @param {string} text - 文本内容
 * @param {number} maxLength - 最大长度
 * @returns {string} 截断后的文本
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * 下载文件
 * @param {string} content - 文件内容
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME类型
 */
export const downloadFile = (content, filename, mimeType = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * 复制到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 是否复制成功
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('复制失败:', err);
    return false;
  }
};

/**
 * 获取本地存储
 * @param {string} key - 键名
 * @param {any} defaultValue - 默认值
 * @returns {any} 存储的值
 */
export const getLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('获取本地存储失败:', error);
    return defaultValue;
  }
};

/**
 * 设置本地存储
 * @param {string} key - 键名
 * @param {any} value - 值
 */
export const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('设置本地存储失败:', error);
  }
};

/**
 * 移除本地存储
 * @param {string} key - 键名
 */
export const removeLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('移除本地存储失败:', error);
  }
};

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 数组去重
 * @param {Array} array - 数组
 * @param {string} key - 对象键名（用于对象数组）
 * @returns {Array} 去重后的数组
 */
export const uniqueArray = (array, key = null) => {
  if (!Array.isArray(array)) return [];
  if (!key) return [...new Set(array)];
  const seen = new Set();
  return array.filter((item) => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
};

/**
 * 数组分组
 * @param {Array} array - 数组
 * @param {Function|string} key - 分组键
 * @returns {Object} 分组后的对象
 */
export const groupBy = (array, key) => {
  if (!Array.isArray(array)) return {};
  return array.reduce((acc, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {});
};

/**
 * 随机打乱数组
 * @param {Array} array - 数组
 * @returns {Array} 打乱后的数组
 */
export const shuffleArray = (array) => {
  if (!Array.isArray(array)) return [];
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * 睡眠函数
 * @param {number} ms - 毫秒数
 * @returns {Promise<void>}
 */
export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * 重试函数
 * @param {Function} fn - 要执行的函数
 * @param {number} retries - 重试次数
 * @param {number} delay - 延迟时间
 * @returns {Promise<any>}
 */
export const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay);
  }
};

/**
 * 检查对象是否为空
 * @param {Object} obj - 对象
 * @returns {boolean} 是否为空
 */
export const isEmptyObject = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * 安全获取嵌套对象属性
 * @param {Object} obj - 对象
 * @param {string} path - 属性路径
 * @param {any} defaultValue - 默认值
 * @returns {any} 属性值
 */
export const getNestedValue = (obj, path, defaultValue = null) => {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result === null || result === undefined) return defaultValue;
    result = result[key];
  }
  return result !== undefined ? result : defaultValue;
};
