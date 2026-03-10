/**
 * 单个行程管理Hook
 * @module modules/itinerary/hooks/useItinerary
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Itinerary, UpdateItineraryRequest, ApiError, ChatMessage } from '../types';
import { itineraryService } from '../services/itineraryService';
import { itineraryApi } from '../api/itineraryApi';

interface UseItineraryOptions {
  id?: number;
  autoFetch?: boolean;
}

interface UseItineraryReturn {
  itinerary: Itinerary | null;
  loading: boolean;
  error: ApiError | null;
  updateItinerary: (data: UpdateItineraryRequest) => Promise<void>;
  deleteItinerary: () => Promise<void>;
  exportItinerary: (format?: 'txt' | 'json') => void;
  shareItinerary: (config: { share_type: string; permission: string; custom_message?: string }) => Promise<any>;
  refetch: () => Promise<void>;
  // 聊天相关
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  sendChatMessage: (message: string) => Promise<void>;
  clearChatHistory: () => void;
}

/**
 * 单个行程管理Hook
 * 提供单个行程的获取、更新、删除等功能
 */
export const useItinerary = (options: UseItineraryOptions = {}): UseItineraryReturn => {
  const { id, autoFetch = true } = options;

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const isMounted = useRef(true);

  // 获取行程详情
  const fetchItinerary = useCallback(async () => {
    if (!id || !isMounted.current) return;

    setLoading(true);
    setError(null);

    try {
      const data = await itineraryService.getItineraryById(id);
      if (isMounted.current) {
        setItinerary(data);
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
  }, [id]);

  // 更新行程
  const updateItinerary = useCallback(async (data: UpdateItineraryRequest) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const updated = await itineraryService.updateItinerary(id, data);
      if (isMounted.current) {
        setItinerary(updated);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err as ApiError);
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [id]);

  // 删除行程
  const deleteItinerary = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      await itineraryService.deleteItinerary(id);
      if (isMounted.current) {
        setItinerary(null);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err as ApiError);
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [id]);

  // 导出行程
  const exportItinerary = useCallback((format: 'txt' | 'json' = 'txt') => {
    if (!itinerary) return;

    const content = itineraryService.exportItinerary(itinerary, format);
    const filename = `${itinerary.title}.${format}`;

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [itinerary]);

  // 分享行程
  const shareItinerary = useCallback(async (config: { share_type: string; permission: string; custom_message?: string }) => {
    if (!id) return;

    try {
      return await itineraryService.shareItinerary(id, config);
    } catch (err) {
      setError(err as ApiError);
      throw err;
    }
  }, [id]);

  // 发送聊天消息
  const sendChatMessage = useCallback(async (message: string) => {
    if (!id || !message.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatLoading(true);

    try {
      const response = await itineraryApi.sendChatMessage({
        question: message,
        itinerary_id: id,
        chat_history: chatMessages
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString()
      };

      if (isMounted.current) {
        setChatMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err as ApiError);
      }
    } finally {
      if (isMounted.current) {
        setChatLoading(false);
      }
    }
  }, [id, chatMessages]);

  // 清除聊天历史
  const clearChatHistory = useCallback(() => {
    setChatMessages([]);
  }, []);

  // 重新获取数据
  const refetch = useCallback(async () => {
    await fetchItinerary();
  }, [fetchItinerary]);

  // 自动获取数据
  useEffect(() => {
    if (autoFetch && id) {
      fetchItinerary();
    }
  }, [fetchItinerary, autoFetch, id]);

  // 清理
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    itinerary,
    loading,
    error,
    updateItinerary,
    deleteItinerary,
    exportItinerary,
    shareItinerary,
    refetch,
    chatMessages,
    chatLoading,
    sendChatMessage,
    clearChatHistory
  };
};

export default useItinerary;
