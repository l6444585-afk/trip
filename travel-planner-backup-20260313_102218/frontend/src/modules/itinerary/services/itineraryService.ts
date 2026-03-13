/**
 * 行程业务逻辑服务
 * @module modules/itinerary/services/itineraryService
 */

import type {
  Itinerary,
  ItineraryFilter,
  CreateItineraryRequest,
  UpdateItineraryRequest,
  GenerateItineraryResponse,
  PaginatedResult,
  PaginationParams,
  BudgetBreakdown,
  InterestType,
  CompanionType,
  TravelStyle,
  ItineraryStatus
} from '../types';
import { itineraryApi } from '../api/itineraryApi';
import { calculateBudgetBreakdown, groupSchedulesByDay, calculateProgress } from '../utils/itineraryUtils';

/**
 * 行程服务类
 * 封装所有行程相关的业务逻辑
 */
class ItineraryService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 获取行程列表
   * @param filter - 筛选条件
   * @param pagination - 分页参数
   * @returns 分页后的行程列表
   */
  async getItineraries(
    filter: ItineraryFilter = {},
    pagination: PaginationParams = { page: 1, pageSize: 10 }
  ): Promise<PaginatedResult<Itinerary>> {
    const cacheKey = `itineraries_${JSON.stringify(filter)}_${JSON.stringify(pagination)}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const itineraries = await itineraryApi.getItineraries();
      let filteredData = this.applyFilter(itineraries, filter);
      filteredData = this.applySort(filteredData, filter.sortBy || 'created_at', filter.sortOrder || 'desc');
      
      const total = filteredData.length;
      const totalPages = Math.ceil(total / pagination.pageSize);
      const start = (pagination.page - 1) * pagination.pageSize;
      const paginatedData = filteredData.slice(start, start + pagination.pageSize);

      const result: PaginatedResult<Itinerary> = {
        data: paginatedData,
        total,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('获取行程列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个行程详情
   * @param id - 行程ID
   * @returns 行程详情
   */
  async getItineraryById(id: number): Promise<Itinerary> {
    const cacheKey = `itinerary_${id}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const itinerary = await itineraryApi.getItineraryById(id);
      this.setCache(cacheKey, itinerary);
      return itinerary;
    } catch (error) {
      console.error(`获取行程详情失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 创建行程
   * @param data - 创建行程请求数据
   * @returns 创建的行程
   */
  async createItinerary(data: CreateItineraryRequest): Promise<GenerateItineraryResponse> {
    try {
      const response = await itineraryApi.generateItinerary(data);
      this.clearCache();
      return response;
    } catch (error) {
      console.error('创建行程失败:', error);
      throw error;
    }
  }

  /**
   * 更新行程
   * @param id - 行程ID
   * @param data - 更新数据
   * @returns 更新后的行程
   */
  async updateItinerary(id: number, data: UpdateItineraryRequest): Promise<Itinerary> {
    try {
      const itinerary = await itineraryApi.updateItinerary(id, data);
      this.clearCache(`itinerary_${id}`);
      return itinerary;
    } catch (error) {
      console.error(`更新行程失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 删除行程
   * @param id - 行程ID
   */
  async deleteItinerary(id: number): Promise<void> {
    try {
      await itineraryApi.deleteItinerary(id);
      this.clearCache();
    } catch (error) {
      console.error(`删除行程失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 分享行程
   * @param id - 行程ID
   * @param config - 分享配置
   * @returns 分享结果
   */
  async shareItinerary(id: number, config: { share_type: string; permission: string; custom_message?: string }) {
    try {
      return await itineraryApi.shareItinerary(id, config);
    } catch (error) {
      console.error(`分享行程失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 导出行程
   * @param itinerary - 行程数据
   * @param format - 导出格式
   * @returns 导出的内容
   */
  exportItinerary(itinerary: Itinerary, format: 'txt' | 'json' = 'txt'): string {
    if (format === 'json') {
      return JSON.stringify(itinerary, null, 2);
    }

    let text = `行程标题：${itinerary.title}\n`;
    text += `出行天数：${itinerary.days}天\n`;
    text += `预算：¥${itinerary.budget.toLocaleString()}\n`;
    text += `出发地：${itinerary.departure}\n`;
    text += `同行人员：${itinerary.companion_type}\n`;
    text += `兴趣偏好：${itinerary.interests}\n\n`;

    const groupedSchedules = groupSchedulesByDay(itinerary.schedules);

    Object.keys(groupedSchedules)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach((day) => {
        text += `=== 第${day}天 ===\n`;
        groupedSchedules[day].forEach((schedule) => {
          const periodMap: Record<string, string> = { morning: '上午', afternoon: '下午', evening: '晚上' };
          text += `${periodMap[schedule.period]}：${schedule.activity}\n`;
          text += `  地点：${schedule.location}\n`;
          if (schedule.notes) {
            text += `  提示：${schedule.notes}\n`;
          }
          text += '\n';
        });
      });

    return text;
  }

  /**
   * 计算预算分配
   * @param totalBudget - 总预算
   * @returns 预算分配明细
   */
  calculateBudgetBreakdown(totalBudget: number): BudgetBreakdown {
    return calculateBudgetBreakdown(totalBudget);
  }

  /**
   * 计算行程进度
   * @param itinerary - 行程数据
   * @returns 进度百分比
   */
  calculateProgress(itinerary: Itinerary): number {
    return calculateProgress(itinerary);
  }

  /**
   * 按天分组日程
   * @param schedules - 日程数组
   * @returns 按天分组的日程
   */
  groupSchedulesByDay(schedules: Itinerary['schedules']) {
    return groupSchedulesByDay(schedules);
  }

  /**
   * 应用筛选条件
   * @param itineraries - 行程列表
   * @param filter - 筛选条件
   * @returns 筛选后的列表
   */
  private applyFilter(itineraries: Itinerary[], filter: ItineraryFilter): Itinerary[] {
    let result = [...itineraries];

    if (filter.status && filter.status !== 'all') {
      result = result.filter(item => item.status === filter.status);
    }

    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      result = result.filter(item =>
        item.title?.toLowerCase().includes(searchLower) ||
        item.departure?.toLowerCase().includes(searchLower) ||
        item.interests?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }

  /**
   * 应用排序
   * @param itineraries - 行程列表
   * @param sortBy - 排序字段
   * @param sortOrder - 排序顺序
   * @returns 排序后的列表
   */
  private applySort(
    itineraries: Itinerary[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): Itinerary[] {
    const sorted = [...itineraries];

    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'created_at':
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
        case 'budget':
          comparison = b.budget - a.budget;
          break;
        case 'days':
          comparison = b.days - a.days;
          break;
        case 'start_date':
          const aDate = a.start_date ? new Date(a.start_date).getTime() : 0;
          const bDate = b.start_date ? new Date(b.start_date).getTime() : 0;
          comparison = bDate - aDate;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return sorted;
  }

  /**
   * 从缓存获取数据
   * @param key - 缓存键
   * @returns 缓存数据或null
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * 设置缓存
   * @param key - 缓存键
   * @param data - 缓存数据
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * 清除缓存
   * @param key - 缓存键，不传则清除所有
   */
  private clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

// 导出单例实例
export const itineraryService = new ItineraryService();
