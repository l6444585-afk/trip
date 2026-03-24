import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { message, Modal } from 'antd';
import {
  PlusOutlined, SearchOutlined, CalendarOutlined, EnvironmentOutlined,
  WalletOutlined, TeamOutlined, DeleteOutlined, EyeOutlined,
  ShareAltOutlined, DownloadOutlined, AppstoreOutlined, UnorderedListOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../constants';
import { formatDate, formatCurrency, getDestinationImage } from '../utils';
import './ItineraryList.css';

const STATUS_MAP = {
  planning: { text: '规划中', cls: 'status-planning' },
  confirmed: { text: '已确认', cls: 'status-confirmed' },
  ongoing: { text: '进行中', cls: 'status-ongoing' },
  completed: { text: '已完成', cls: 'status-completed' },
  cancelled: { text: '已取消', cls: 'status-cancelled' },
};

const ItineraryList = () => {
  const navigate = useNavigate();
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [currentTab, setCurrentTab] = useState('all');

  const fetchItineraries = useCallback(async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.ITINERARIES);
      setItineraries(Array.isArray(res.data) ? res.data : []);
    } catch { setItineraries([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItineraries(); }, [fetchItineraries]);

  const handleDelete = (e, id, title) => {
    e.stopPropagation();
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除「${title}」吗？`,
      okText: '删除', okType: 'danger', cancelText: '取消',
      onOk: async () => {
        try { await axios.delete(`${API_ENDPOINTS.ITINERARIES}/${id}`); message.success('删除成功'); fetchItineraries(); }
        catch { message.error('删除失败'); }
      },
    });
  };

  const filtered = useMemo(() => {
    let list = [...itineraries];
    if (currentTab !== 'all') list = list.filter(i => i.status === currentTab);
    if (statusFilter !== 'all') list = list.filter(i => i.status === statusFilter);
    if (searchText) list = list.filter(i => i.title?.includes(searchText) || i.departure?.includes(searchText));
    if (sortBy === 'budget') list.sort((a, b) => (b.budget || 0) - (a.budget || 0));
    else if (sortBy === 'days') list.sort((a, b) => (b.days || 0) - (a.days || 0));
    return list;
  }, [itineraries, currentTab, statusFilter, searchText, sortBy]);

  const tabCounts = useMemo(() => ({
    all: itineraries.length,
    ongoing: itineraries.filter(i => i.status === 'ongoing').length,
    completed: itineraries.filter(i => i.status === 'completed').length,
  }), [itineraries]);

  const getStatus = (status) => STATUS_MAP[status] || { text: status || '未知', cls: '' };

  const getImage = (item) => {
    if (item.destinations && item.destinations.length) return getDestinationImage(item.destinations);
    return getDestinationImage([item.departure || '杭州']);
  };

  const renderGridCard = (item) => {
    const status = getStatus(item.status);
    return (
      <div className="grid-card" key={item.id} onClick={() => navigate(`/itinerary/${item.id}`)}>
        <div className="grid-card-image" style={{ backgroundImage: `url(${getImage(item)})` }}>
          <div className={`status-badge ${status.cls}`}><span className="dot" /> {status.text}</div>
          <div className="title-overlay">{item.title}</div>
        </div>
        <div className="grid-card-body">
          <div className="grid-card-tags">
            {item.companion_type && <span className="p-tag p-tag-primary">{item.companion_type}</span>}
            <span className="p-tag">{item.days}天</span>
          </div>
          <div className="grid-card-footer">
            <span className="grid-card-price">{formatCurrency(item.budget)}</span>
            <span className="grid-card-date">{formatDate(item.created_at)}</span>
          </div>
        </div>
        <div className="grid-card-actions">
          <div className="action-btns">
            <button className="action-btn" onClick={e => { e.stopPropagation(); navigate(`/itinerary/${item.id}`); }} title="查看"><EyeOutlined /></button>
            <button className="action-btn" title="分享" onClick={e => e.stopPropagation()}><ShareAltOutlined /></button>
            <button className="action-btn" title="导出" onClick={e => e.stopPropagation()}><DownloadOutlined /></button>
          </div>
          <button className="action-btn delete" onClick={e => handleDelete(e, item.id, item.title)} title="删除"><DeleteOutlined /></button>
        </div>
      </div>
    );
  };

  const renderListCard = (item) => {
    const status = getStatus(item.status);
    const interests = item.interests ? (typeof item.interests === 'string' ? item.interests.split(',') : item.interests) : [];
    return (
      <div className="list-card" key={item.id} onClick={() => navigate(`/itinerary/${item.id}`)}>
        <div className="list-card-header">
          <div className="list-card-image" style={{ backgroundImage: `url(${getImage(item)})` }} />
          <div className="list-card-content">
            <div className="list-card-title">
              {item.title}
              <span className={`status-badge ${status.cls}`}><span className="dot" /> {status.text}</span>
            </div>
            <div className="list-card-meta">
              <span className="list-card-meta-item"><CalendarOutlined /> {item.days}天</span>
              <span className="list-card-meta-item"><EnvironmentOutlined /> {item.departure}</span>
              <span className="list-card-meta-item"><WalletOutlined /> {formatCurrency(item.budget)}</span>
              {item.companion_type && <span className="list-card-meta-item"><TeamOutlined /> {item.companion_type}</span>}
            </div>
            <div className="list-card-tags">
              {interests.map((t, i) => <span className="p-tag" key={i}>{t.trim()}</span>)}
            </div>
          </div>
        </div>
        <div className="list-card-footer">
          <span className="list-card-footer-date">创建于 {formatDate(item.created_at)}</span>
          <div className="action-btns">
            <button className="action-btn" onClick={e => { e.stopPropagation(); navigate(`/itinerary/${item.id}`); }} title="查看"><EyeOutlined /></button>
            <button className="action-btn" title="分享" onClick={e => e.stopPropagation()}><ShareAltOutlined /></button>
            <button className="action-btn" title="导出" onClick={e => e.stopPropagation()}><DownloadOutlined /></button>
            <button className="action-btn delete" onClick={e => handleDelete(e, item.id, item.title)} title="删除"><DeleteOutlined /></button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="proto-list"><div className="loading-center"><div className="loading-spinner" /></div></div>;
  }

  return (
    <div className="proto-list">
      <div className="page-header">
        <div>
          <h1 className="page-title">我的行程</h1>
          <p className="page-subtitle">管理您的所有旅行计划</p>
        </div>
        <button className="p-btn p-btn-primary" onClick={() => navigate('/create')}>
          <PlusOutlined /> 创建新行程
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-wrapper">
          <SearchOutlined />
          <input placeholder="搜索行程..." value={searchText} onChange={e => setSearchText(e.target.value)} />
        </div>
        <div className="filter-group">
          <span className="filter-label">状态：</span>
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">全部</option>
            <option value="planning">规划中</option>
            <option value="confirmed">已确认</option>
            <option value="ongoing">进行中</option>
            <option value="completed">已完成</option>
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">排序：</span>
          <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">最新创建</option>
            <option value="budget">预算最高</option>
            <option value="days">天数最多</option>
          </select>
        </div>
        <div style={{ flex: 1 }} />
        <div className="view-toggle">
          <button className={`view-btn${viewMode === 'grid' ? ' active' : ''}`} onClick={() => setViewMode('grid')}><AppstoreOutlined /></button>
          <button className={`view-btn${viewMode === 'list' ? ' active' : ''}`} onClick={() => setViewMode('list')}><UnorderedListOutlined /></button>
        </div>
      </div>

      <div className="tabs">
        {[
          { key: 'all', label: '全部行程', count: tabCounts.all },
          { key: 'ongoing', label: '进行中', count: tabCounts.ongoing },
          { key: 'completed', label: '已完成', count: tabCounts.completed },
        ].map(t => (
          <div key={t.key} className={`tab${currentTab === t.key ? ' active' : ''}`} onClick={() => setCurrentTab(t.key)}>
            {t.label}
            <span className="tab-badge">{t.count}</span>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><CalendarOutlined /></div>
          <div className="empty-title">暂无行程</div>
          <div className="empty-desc">创建您的第一个行程，开启精彩旅程</div>
          <button className="p-btn p-btn-primary" onClick={() => navigate('/create')}>
            <PlusOutlined /> 创建行程
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid-view">{filtered.map(renderGridCard)}</div>
      ) : (
        <div className="list-view">{filtered.map(renderListCard)}</div>
      )}
    </div>
  );
};

export default ItineraryList;
