/**
 * 行程模块工具函数
 * @module modules/itinerary/utils/itineraryUtils
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import type { Itinerary, Schedule, BudgetBreakdown, InterestType, CompanionType, ItineraryStatus } from '../types';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

/**
 * 计算预算分配
 * @param totalBudget - 总预算
 * @returns 预算分配明细
 */
export const calculateBudgetBreakdown = (totalBudget: number): BudgetBreakdown => {
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
 * 按天分组日程
 * @param schedules - 日程数组
 * @returns 按天分组的日程对象
 */
export const groupSchedulesByDay = (schedules: Schedule[]): Record<number, Schedule[]> => {
  if (!schedules || !Array.isArray(schedules)) return {};

  return schedules.reduce((acc, schedule) => {
    if (!acc[schedule.day]) {
      acc[schedule.day] = [];
    }
    acc[schedule.day].push(schedule);
    return acc;
  }, {} as Record<number, Schedule[]>);
};

/**
 * 计算行程进度
 * @param itinerary - 行程对象
 * @returns 进度百分比 (0-100)
 */
export const calculateProgress = (itinerary: Itinerary): number => {
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
 * 格式化货币
 * @param amount - 金额
 * @param currency - 货币符号
 * @returns 格式化后的金额字符串
 */
export const formatCurrency = (amount: number, currency = '¥'): string => {
  if (amount === null || amount === undefined) return `${currency}0`;
  return `${currency}${amount.toLocaleString()}`;
};

/**
 * 格式化日期
 * @param date - 日期
 * @param format - 格式化模板
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: string | Date, format = 'YYYY-MM-DD'): string => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

/**
 * 获取相对时间
 * @param date - 日期
 * @returns 相对时间字符串
 */
export const getRelativeTime = (date: string | Date): string => {
  if (!date) return '-';
  return dayjs(date).fromNow();
};

/**
 * 获取状态颜色
 * @param status - 行程状态
 * @returns 颜色值
 */
export const getStatusColor = (status: ItineraryStatus): string => {
  const colors: Record<ItineraryStatus, string> = {
    planning: 'default',
    confirmed: 'processing',
    ongoing: 'active',
    completed: 'success',
    cancelled: 'error'
  };
  return colors[status] || 'default';
};

/**
 * 获取状态文本
 * @param status - 行程状态
 * @returns 状态文本
 */
export const getStatusText = (status: ItineraryStatus): string => {
  const texts: Record<ItineraryStatus, string> = {
    planning: '规划中',
    confirmed: '已确认',
    ongoing: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  };
  return texts[status] || '未知';
};

/**
 * 获取同行人员颜色
 * @param type - 同行人员类型
 * @returns 颜色值
 */
export const getCompanionColor = (type: CompanionType): string => {
  const colors: Record<CompanionType, string> = {
    '情侣': 'pink',
    '亲子': 'orange',
    '独行': 'blue',
    '朋友': 'green',
    '家庭': 'purple'
  };
  return colors[type] || 'default';
};

/**
 * 获取同行人员图标
 * @param type - 同行人员类型
 * @returns 图标字符
 */
export const getCompanionIcon = (type: CompanionType): string => {
  const icons: Record<CompanionType, string> = {
    '情侣': '💑',
    '亲子': '👨‍👩‍👧‍👦',
    '独行': '🚶',
    '朋友': '👥',
    '家庭': '🏠'
  };
  return icons[type] || '👤';
};

/**
 * 获取兴趣颜色
 * @param interest - 兴趣类型
 * @returns 颜色值
 */
export const getInterestColor = (interest: InterestType): string => {
  const colors: Record<InterestType, string> = {
    '自然风光': '#52c41a',
    '历史文化': '#722ed1',
    '美食购物': '#fa8c16',
    '城市漫步': '#1890ff',
    '摄影打卡': '#eb2f96',
    '休闲度假': '#13c2c2',
    '亲子游玩': '#faad14',
    '户外探险': '#f5222d'
  };
  return colors[interest] || '#1890ff';
};

/**
 * 获取预算分类颜色
 * @param category - 预算分类
 * @returns 颜色值
 */
export const getBudgetCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    transport: '#52c41a',
    accommodation: '#1890ff',
    food: '#fa8c16',
    tickets: '#722ed1',
    shopping: '#eb2f96',
    other: '#607D8B'
  };
  return colors[category] || '#999999';
};

/**
 * 获取预算分类标签
 * @param category - 预算分类
 * @returns 分类标签
 */
export const getBudgetCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    transport: '交通',
    accommodation: '住宿',
    food: '餐饮',
    tickets: '门票',
    shopping: '购物',
    other: '其他'
  };
  return labels[category] || category;
};

/**
 * 获取目的地图片
 * @param destinations - 目的地数组
 * @returns 图片URL
 */
export const getDestinationImage = (destinations?: string[]): string => {
  const images: Record<string, string> = {
    '杭州': '/images/cities/hangzhou.jpg',
    '上海': '/images/cities/shanghai.jpg',
    '苏州': '/images/cities/suzhou.jpg',
    '南京': '/images/cities/nanjing.jpg',
    '无锡': '/images/cities/wuxi.jpg',
    '宁波': '/images/cities/ningbo.jpg',
    '嘉兴': '/images/cities/jiaxing.jpg',
    '舟山': '/images/cities/zhoushan.jpg'
  };

  if (!destinations || destinations.length === 0) {
    return '/images/cities/hangzhou.jpg';
  }

  return images[destinations[0]] || images['杭州'];
};

/**
 * 下载文件
 * @param content - 文件内容
 * @param filename - 文件名
 * @param mimeType - MIME类型
 */
export const downloadFile = (
  content: string,
  filename: string,
  mimeType = 'text/plain;charset=utf-8'
): void => {
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
 * @param text - 要复制的文本
 * @returns Promise<boolean> 是否复制成功
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('复制失败:', err);
    return false;
  }
};

/**
 * 防抖函数
 * @param func - 要执行的函数
 * @param wait - 等待时间（毫秒）
 * @returns 防抖后的函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
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
 * @param func - 要执行的函数
 * @param limit - 限制时间（毫秒）
 * @returns 节流后的函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * 生成唯一ID
 * @returns 唯一ID字符串
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 深拷贝对象
 * @param obj - 要拷贝的对象
 * @returns 拷贝后的对象
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (Array.isArray(obj)) return obj.map((item) => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const cloned = {} as T;
    Object.keys(obj).forEach((key) => {
      (cloned as any)[key] = deepClone((obj as any)[key]);
    });
    return cloned;
  }
  return obj;
};

/**
 * 截断文本
 * @param text - 文本内容
 * @param maxLength - 最大长度
 * @returns 截断后的文本
 */
export const truncateText = (text: string, maxLength = 100): string => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * 验证邮箱格式
 * @param email - 邮箱地址
 * @returns 是否有效
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证手机号格式
 * @param phone - 手机号
 * @returns 是否有效
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};
