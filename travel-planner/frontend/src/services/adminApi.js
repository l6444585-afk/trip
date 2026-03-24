import axios from 'axios';
import { mockServices } from './adminMockData';

const API_BASE = process.env.REACT_APP_API_BASE || '';

const adminApi = axios.create({
  baseURL: `${API_BASE}/api/admin`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

/** 包装 API 调用：真实 API 失败时降级到 mock 数据 */
const withFallback = (apiFn, mockFn) => async (...args) => {
  try {
    return await apiFn(...args);
  } catch {
    if (mockFn) return mockFn(...args);
    throw new Error('操作失败');
  }
};

// ========== Auth（不做 mock，登录必须走真实 API 或 mock 登录）==========
export const adminAuthService = {
  login: async (username, password) => {
    try {
      const response = await adminApi.post('/login', { username, password });
      if (response.data.access_token) {
        localStorage.setItem('admin_token', response.data.access_token);
        localStorage.setItem('admin_user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch {
      // API 不可用时 mock 登录
      if (username === 'admin' && password === 'admin123') {
        const mockUser = {
          id: 1, username: 'admin', real_name: '系统管理员',
          email: 'admin@travel.com', is_superuser: true,
          permissions: ['user:list', 'itinerary:list', 'attraction:list', 'order:list', 'analytics', 'system:role', 'system:log', 'system:backup'],
        };
        localStorage.setItem('admin_token', 'mock_token_admin');
        localStorage.setItem('admin_user', JSON.stringify(mockUser));
        return { access_token: 'mock_token_admin', user: mockUser };
      }
      throw new Error('用户名或密码错误');
    }
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => localStorage.getItem('admin_token'),

  isAuthenticated: () => !!localStorage.getItem('admin_token'),

  getMe: async () => {
    const response = await adminApi.get('/me');
    return response.data;
  },
};

// ========== Dashboard ==========
export const adminDashboardService = {
  getStats: withFallback(
    async () => { const r = await adminApi.get('/dashboard/stats'); return r.data; },
    () => mockServices.dashboard.getStats()
  ),
  getRevenueTrend: withFallback(
    async (days = 30) => { const r = await adminApi.get('/dashboard/revenue-trend', { params: { days } }); return r.data; },
    (days) => mockServices.dashboard.getRevenueTrend(days)
  ),
  getUserActivity: withFallback(
    async (days = 30) => { const r = await adminApi.get('/dashboard/user-activity', { params: { days } }); return r.data; },
    (days) => mockServices.dashboard.getUserActivity(days)
  ),
  getPopularItineraries: withFallback(
    async (limit = 10) => { const r = await adminApi.get('/dashboard/popular-itineraries', { params: { limit } }); return r.data; },
    () => mockServices.dashboard.getPopularItineraries()
  ),
};

// ========== Users ==========
export const adminUserService = {
  getUsers: withFallback(
    async (params) => { const r = await adminApi.get('/users', { params }); return r.data; },
    (params) => mockServices.users.getUsers(params)
  ),
  getUserDetail: withFallback(
    async (userId) => { const r = await adminApi.get(`/users/${userId}`); return r.data; },
    (userId) => mockServices.users.getUserDetail(userId)
  ),
  updateUserStatus: async (userId, status) => {
    const response = await adminApi.put(`/users/${userId}/status`, null, { params: { status } });
    return response.data;
  },
};

// ========== Itineraries ==========
export const adminItineraryService = {
  getItineraries: withFallback(
    async (params) => { const r = await adminApi.get('/itineraries', { params }); return r.data; },
    (params) => mockServices.itineraries.getItineraries(params)
  ),
  reviewItinerary: async (itineraryId, data) => {
    const response = await adminApi.post(`/itineraries/${itineraryId}/review`, data);
    return response.data;
  },
  publishItinerary: async (itineraryId) => {
    const response = await adminApi.post(`/itineraries/${itineraryId}/publish`);
    return response.data;
  },
  offlineItinerary: async (itineraryId, reason) => {
    const response = await adminApi.post(`/itineraries/${itineraryId}/offline`, null, { params: { reason } });
    return response.data;
  },
};

// ========== Attractions ==========
export const adminAttractionService = {
  getAttractions: withFallback(
    async (params) => { const r = await adminApi.get('/attractions', { params }); return r.data; },
    (params) => mockServices.attractions.getAttractions(params)
  ),
  createAttraction: async (data) => {
    const response = await adminApi.post('/attractions', data);
    return response.data;
  },
  updateAttraction: async (attractionId, data) => {
    const response = await adminApi.put(`/attractions/${attractionId}`, data);
    return response.data;
  },
  deleteAttraction: async (attractionId) => {
    const response = await adminApi.delete(`/attractions/${attractionId}`);
    return response.data;
  },
  addAttractionMedia: async (attractionId, data) => {
    const response = await adminApi.post(`/attractions/${attractionId}/media`, data);
    return response.data;
  },
  getCities: withFallback(
    async () => { const r = await adminApi.get('/cities'); return r.data; },
    () => mockServices.attractions.getCities()
  ),
  getCategories: withFallback(
    async () => { const r = await adminApi.get('/categories'); return r.data; },
    () => mockServices.attractions.getCategories()
  ),
};

// ========== Orders ==========
export const adminOrderService = {
  getOrders: withFallback(
    async (params) => { const r = await adminApi.get('/orders', { params }); return r.data; },
    (params) => mockServices.orders.getOrders(params)
  ),
  getOrderDetail: withFallback(
    async (orderId) => { const r = await adminApi.get(`/orders/${orderId}`); return r.data; },
    (orderId) => mockServices.orders.getOrderDetail(orderId)
  ),
  updateOrderStatus: async (orderId, status, remark) => {
    const response = await adminApi.put(`/orders/${orderId}/status`, null, { params: { status, remark } });
    return response.data;
  },
  processRefund: async (orderId, refundReason, refundAmount) => {
    const response = await adminApi.post(`/orders/${orderId}/refund`, null, { params: { refund_reason: refundReason, refund_amount: refundAmount } });
    return response.data;
  },
};

// ========== System ==========
export const adminSystemService = {
  getRoles: withFallback(
    async () => { const r = await adminApi.get('/roles'); return r.data; },
    () => mockServices.system.getRoles()
  ),
  createRole: async (data) => {
    const response = await adminApi.post('/roles', data);
    return response.data;
  },
  updateRole: async (roleId, data) => {
    const response = await adminApi.put(`/roles/${roleId}`, data);
    return response.data;
  },
  deleteRole: async (roleId) => {
    const response = await adminApi.delete(`/roles/${roleId}`);
    return response.data;
  },
  getPermissions: withFallback(
    async () => { const r = await adminApi.get('/permissions'); return r.data; },
    () => mockServices.system.getPermissions()
  ),
  getOperationLogs: withFallback(
    async (params) => { const r = await adminApi.get('/operation-logs', { params }); return r.data; },
    (params) => mockServices.system.getOperationLogs(params)
  ),
  getAdminUsers: withFallback(
    async (params) => { const r = await adminApi.get('/admin-users', { params }); return r.data; },
    (params) => mockServices.system.getAdminUsers(params)
  ),
  createAdminUser: async (data) => {
    const response = await adminApi.post('/admin-users', data);
    return response.data;
  },
  updateAdminUser: async (userId, data) => {
    const response = await adminApi.put(`/admin-users/${userId}`, data);
    return response.data;
  },
  deleteAdminUser: async (userId) => {
    const response = await adminApi.delete(`/admin-users/${userId}`);
    return response.data;
  },
  getConfigs: async (group) => {
    const response = await adminApi.get('/system/configs', { params: { group } });
    return response.data;
  },
  updateConfigs: async (configs) => {
    const response = await adminApi.put('/system/configs', { configs });
    return response.data;
  },
  createBackup: async (data) => {
    const response = await adminApi.post('/system/backup', data);
    return response.data;
  },
  getBackups: withFallback(
    async () => { const r = await adminApi.get('/system/backups'); return r.data; },
    () => mockServices.system.getBackups()
  ),
  getOnlineUsers: async () => {
    const response = await adminApi.get('/online-users');
    return response.data;
  },
  getAnnouncements: async (params) => {
    const response = await adminApi.get('/announcements', { params });
    return response.data;
  },
  createAnnouncement: async (data) => {
    const response = await adminApi.post('/announcements', data);
    return response.data;
  },
  getFeedbacks: async (params) => {
    const response = await adminApi.get('/feedbacks', { params });
    return response.data;
  },
  replyFeedback: async (feedbackId, reply) => {
    const response = await adminApi.post(`/feedbacks/${feedbackId}/reply`, { reply });
    return response.data;
  },
};

export default adminApi;
