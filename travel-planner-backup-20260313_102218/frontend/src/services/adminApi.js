import axios from 'axios';

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

export const adminAuthService = {
  login: async (username, password) => {
    const response = await adminApi.post('/login', { username, password });
    if (response.data.access_token) {
      localStorage.setItem('admin_token', response.data.access_token);
      localStorage.setItem('admin_user', JSON.stringify(response.data.user));
    }
    return response.data;
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

export const adminDashboardService = {
  getStats: async () => {
    const response = await adminApi.get('/dashboard/stats');
    return response.data;
  },

  getRevenueTrend: async (days = 30) => {
    const response = await adminApi.get('/dashboard/revenue-trend', { params: { days } });
    return response.data;
  },

  getUserActivity: async (days = 30) => {
    const response = await adminApi.get('/dashboard/user-activity', { params: { days } });
    return response.data;
  },

  getPopularItineraries: async (limit = 10) => {
    const response = await adminApi.get('/dashboard/popular-itineraries', { params: { limit } });
    return response.data;
  },
};

export const adminUserService = {
  getUsers: async (params) => {
    const response = await adminApi.get('/users', { params });
    return response.data;
  },

  getUserDetail: async (userId) => {
    const response = await adminApi.get(`/users/${userId}`);
    return response.data;
  },

  updateUserStatus: async (userId, status) => {
    const response = await adminApi.put(`/users/${userId}/status`, null, { params: { status } });
    return response.data;
  },
};

export const adminItineraryService = {
  getItineraries: async (params) => {
    const response = await adminApi.get('/itineraries', { params });
    return response.data;
  },

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

export const adminAttractionService = {
  getAttractions: async (params) => {
    const response = await adminApi.get('/attractions', { params });
    return response.data;
  },

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

  getCities: async () => {
    const response = await adminApi.get('/cities');
    return response.data;
  },

  getCategories: async () => {
    const response = await adminApi.get('/categories');
    return response.data;
  },
};

export const adminOrderService = {
  getOrders: async (params) => {
    const response = await adminApi.get('/orders', { params });
    return response.data;
  },

  getOrderDetail: async (orderId) => {
    const response = await adminApi.get(`/orders/${orderId}`);
    return response.data;
  },

  updateOrderStatus: async (orderId, status, remark) => {
    const response = await adminApi.put(`/orders/${orderId}/status`, null, { params: { status, remark } });
    return response.data;
  },

  processRefund: async (orderId, refundReason, refundAmount) => {
    const response = await adminApi.post(`/orders/${orderId}/refund`, null, { params: { refund_reason: refundReason, refund_amount: refundAmount } });
    return response.data;
  },
};

export const adminSystemService = {
  getRoles: async () => {
    const response = await adminApi.get('/roles');
    return response.data;
  },

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

  getPermissions: async () => {
    const response = await adminApi.get('/permissions');
    return response.data;
  },

  getOperationLogs: async (params) => {
    const response = await adminApi.get('/operation-logs', { params });
    return response.data;
  },

  getAdminUsers: async (params) => {
    const response = await adminApi.get('/admin-users', { params });
    return response.data;
  },

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

  getBackups: async () => {
    const response = await adminApi.get('/system/backups');
    return response.data;
  },

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
