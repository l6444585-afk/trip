/**
 * 行程API接口层
 * @module modules/itinerary/api/itineraryApi
 */

import axios from 'axios';
import type {
  Itinerary,
  CreateItineraryRequest,
  UpdateItineraryRequest,
  GenerateItineraryResponse,
  ChatRequest,
  ChatResponse,
  ShareResult,
  IntentParseResponse,
  GenerateHybridItineraryRequest,
  GenerateHybridItineraryResponse,
  ModifyItineraryResponse,
  UserProfile,
  UpdateUserProfileRequest,
  PersonalizedAttractionsResponse,
  AttractionDetail,
  CityDetail
} from '../types';

// API基础配置
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60秒超时，考虑到AI生成可能需要较长时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证信息
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 优化错误信息提取
    let errorMessage = '请求失败';
    const detail = error.response?.data?.detail;
    
    if (detail) {
      if (Array.isArray(detail)) {
        // 处理 Pydantic 验证错误数组
        errorMessage = detail.map((err: any) => {
          if (typeof err === 'object' && err !== null) {
            const loc = err.loc ? err.loc.join('.') : '未知字段';
            const msg = err.msg || '验证失败';
            return `${loc}: ${msg}`;
          }
          return String(err);
        }).join('；');
      } else if (typeof detail === 'object' && detail !== null) {
        errorMessage = JSON.stringify(detail);
      } else {
        errorMessage = String(detail);
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error('API Error:', errorMessage);
    return Promise.reject({
      message: errorMessage,
      code: error.response?.status?.toString(),
      details: error.response?.data
    });
  }
);

/**
 * 行程API接口
 */
export const itineraryApi = {
  /**
   * 获取行程列表
   * @returns 行程列表
   */
  async getItineraries(): Promise<Itinerary[]> {
    return apiClient.get('/api/itineraries/');
  },

  /**
   * 获取单个行程详情
   * @param id - 行程ID
   * @returns 行程详情
   */
  async getItineraryById(id: number): Promise<Itinerary> {
    return apiClient.get(`/api/itineraries/${id}`);
  },

  /**
   * 生成行程
   * @param data - 创建行程请求数据
   * @returns 生成的行程响应
   */
  async generateItinerary(data: CreateItineraryRequest): Promise<GenerateItineraryResponse> {
    return apiClient.post('/api/itineraries/generate', {
      title: data.title,
      days: data.days,
      budget: data.budget,
      departure: data.departure,
      destinations: data.destinations,
      companion_type: data.companion_type,
      interests: data.interests,
      travel_style: data.travel_style,
      budget_breakdown: data.budget_breakdown,
      date_range: data.date_range
    });
  },

  /**
   * 更新行程
   * @param id - 行程ID
   * @param data - 更新数据
   * @returns 更新后的行程
   */
  async updateItinerary(id: number, data: UpdateItineraryRequest): Promise<Itinerary> {
    return apiClient.put(`/api/itineraries/${id}`, {
      title: data.title,
      days: data.days,
      budget: data.budget,
      departure: data.departure,
      companion_type: data.companion_type,
      interests: data.interests,
      status: data.status
    });
  },

  /**
   * 删除行程
   * @param id - 行程ID
   */
  async deleteItinerary(id: number): Promise<void> {
    return apiClient.delete(`/api/itineraries/${id}`);
  },

  /**
   * 分享行程
   * @param id - 行程ID
   * @param config - 分享配置
   * @returns 分享结果
   */
  async shareItinerary(
    id: number,
    config: { share_type: string; permission: string; custom_message?: string }
  ): Promise<ShareResult> {
    return apiClient.post(`/api/itineraries/${id}/share`, config);
  },

  /**
   * 发送聊天消息
   * @param data - 聊天请求数据
   * @returns 聊天响应
   */
  async sendChatMessage(data: ChatRequest): Promise<ChatResponse> {
    return apiClient.post('/api/chat', data);
  },

  /**
   * 更新日程
   * @param scheduleId - 日程ID
   * @param data - 更新数据
   * @returns 更新后的日程
   */
  async updateSchedule(scheduleId: number, data: {
    day?: number;
    period?: string;
    activity?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
  }): Promise<any> {
    return apiClient.put(`/api/schedules/${scheduleId}`, data);
  },

  /**
   * 解析用户意图
   * @param userInput - 用户输入的自然语言
   * @returns 意图解析结果
   */
  async parseIntent(userInput: string): Promise<IntentParseResponse> {
    return apiClient.post(`/api/itineraries/parse-intent?user_input=${encodeURIComponent(userInput)}`);
  },

  /**
   * 混合AI生成行程
   * @param data - 生成请求数据
   * @returns 生成的行程
   */
  async generateHybridItinerary(data: GenerateHybridItineraryRequest): Promise<GenerateHybridItineraryResponse> {
    const params = new URLSearchParams();
    params.append('user_input', data.user_input);
    if (data.start_date) {
      params.append('start_date', data.start_date);
    }
    return apiClient.post(`/api/itineraries/generate-hybrid?${params.toString()}`);
  },

  /**
   * 修改行程
   * @param itineraryId - 行程ID
   * @param modificationRequest - 修改请求描述
   * @returns 修改结果
   */
  async modifyItinerary(itineraryId: number, modificationRequest: string): Promise<ModifyItineraryResponse> {
    return apiClient.post(`/api/itineraries/${itineraryId}/modify?modification_request=${encodeURIComponent(modificationRequest)}`);
  },

  /**
   * 获取用户画像
   * @param userId - 用户ID
   * @returns 用户画像
   */
  async getUserProfile(userId: number): Promise<{ success: boolean; profile: UserProfile }> {
    return apiClient.get(`/api/users/${userId}/profile`);
  },

  /**
   * 更新用户画像
   * @param userId - 用户ID
   * @param data - 更新数据
   * @returns 更新结果
   */
  async updateUserProfile(userId: number, data: UpdateUserProfileRequest): Promise<{ success: boolean; message: string }> {
    return apiClient.put(`/api/users/${userId}/profile`, data);
  },

  /**
   * 添加收藏目的地
   * @param userId - 用户ID
   * @param destination - 目的地名称
   * @returns 添加结果
   */
  async addFavoriteDestination(userId: number, destination: string): Promise<{ success: boolean; favorites: string[] }> {
    return apiClient.post(`/api/users/${userId}/favorites?destination=${encodeURIComponent(destination)}`);
  },

  /**
   * 移除收藏目的地
   * @param userId - 用户ID
   * @param destination - 目的地名称
   * @returns 移除结果
   */
  async removeFavoriteDestination(userId: number, destination: string): Promise<{ success: boolean; favorites: string[] }> {
    return apiClient.delete(`/api/users/${userId}/favorites/${encodeURIComponent(destination)}`);
  },

  /**
   * 获取个性化推荐景点
   * @param userId - 用户ID
   * @param destinations - 目的地列表
   * @param limit - 返回数量限制
   * @returns 推荐景点列表
   */
  async getPersonalizedAttractions(
    userId: number,
    destinations?: string[],
    limit: number = 10
  ): Promise<PersonalizedAttractionsResponse> {
    const params = new URLSearchParams();
    if (destinations && destinations.length > 0) {
      params.append('destinations', destinations.join(','));
    }
    params.append('limit', limit.toString());
    return apiClient.get(`/api/users/${userId}/personalized-attractions?${params.toString()}`);
  },

  /**
   * 获取景点列表
   * @param city - 城市筛选
   * @param category - 分类筛选
   * @param limit - 返回数量限制
   * @returns 景点列表
   */
  async getAttractions(city?: string, category?: string, limit: number = 20): Promise<AttractionDetail[]> {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (category) params.append('category', category);
    params.append('limit', limit.toString());
    return apiClient.get(`/api/attractions/?${params.toString()}`);
  },

  /**
   * 获取景点详情
   * @param attractionId - 景点ID
   * @returns 景点详情
   */
  async getAttractionById(attractionId: number): Promise<AttractionDetail> {
    return apiClient.get(`/api/attractions/${attractionId}`);
  },

  /**
   * 获取城市列表
   * @returns 城市列表
   */
  async getCities(): Promise<CityDetail[]> {
    return apiClient.get('/api/cities/');
  },

  /**
   * 获取城市详情
   * @param cityId - 城市ID
   * @returns 城市详情
   */
  async getCityById(cityId: number): Promise<CityDetail> {
    return apiClient.get(`/api/cities/${cityId}`);
  }
};

export default apiClient;
