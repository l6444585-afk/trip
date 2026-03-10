/**
 * Axios 全局配置
 * 配置请求拦截器和响应拦截器
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data) {
      const errorData = error.response.data;
      
      if (Array.isArray(errorData.detail)) {
        const messages = errorData.detail.map(err => {
          if (typeof err === 'object' && err.msg) {
            const field = err.loc ? err.loc.join('.') : '';
            return field ? `${field}: ${err.msg}` : err.msg;
          }
          return String(err);
        });
        error.response.data.detail = messages.join('; ');
      } else if (typeof errorData.detail === 'object' && errorData.detail.msg) {
        error.response.data.detail = errorData.detail.msg;
      }
    }
    
    return Promise.reject(error);
  }
);

export const setupAxiosDefaults = () => {
  axios.defaults.baseURL = API_BASE_URL;
  axios.defaults.timeout = 30000;
  
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (Array.isArray(errorData.detail)) {
          const messages = errorData.detail.map(err => {
            if (typeof err === 'object' && err.msg) {
              const field = err.loc ? err.loc.join('.') : '';
              return field ? `${field}: ${err.msg}` : err.msg;
            }
            return String(err);
          });
          error.response.data.detail = messages.join('; ');
        } else if (typeof errorData.detail === 'object' && errorData.detail.msg) {
          error.response.data.detail = errorData.detail.msg;
        }
      }
      
      return Promise.reject(error);
    }
  );
};

export default apiClient;
