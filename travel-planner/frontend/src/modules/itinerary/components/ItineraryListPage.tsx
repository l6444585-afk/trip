/**
 * 行程列表页面组件（重构版）
 * @module modules/itinerary/components/ItineraryListPage
 */

import React, { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Empty,
  Spin,
  Modal,
  Tabs,
  Space,
  Typography,
  Row,
  Col,
  Tooltip,
  Dropdown,
  message
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  MoreOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useItineraries } from '../hooks/useItineraries';
import { ItineraryCard } from './ItineraryCard';
import { ItineraryListItem } from './ItineraryListItem';
import { ItineraryDetailModal } from './ItineraryDetailModal';
import { ShareModal } from './ShareModal';
import { ExportModal } from './ExportModal';
import type { Itinerary, ItineraryFilter, ItineraryStatus } from '../types';
import { STATUS_OPTIONS, SORT_OPTIONS, VIEW_MODES } from '../constants';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

/**
 * 行程列表页面组件
 */
export const ItineraryListPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  const {
    itineraries,
    loading,
    error,
    pagination,
    filter,
    setFilter,
    setPagination,
    refetch,
    deleteItinerary
  } = useItineraries({
    initialFilter: { status: 'all', sortBy: 'created_at', sortOrder: 'desc' },
    initialPagination: { page: 1, pageSize: 12 }
  });

  // 处理查看详情
  const handleViewDetail = useCallback((itinerary: Itinerary) => {
    setSelectedItinerary(itinerary);
    setDetailModalVisible(true);
  }, []);

  // 处理编辑
  const handleEdit = useCallback((id: number) => {
    navigate(`/itinerary/${id}/edit`);
  }, [navigate]);

  // 处理删除
  const handleDelete = useCallback((id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个行程吗？此操作不可恢复。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteItinerary(id);
          message.success('删除成功');
        } catch {
          message.error('删除失败');
        }
      }
    });
  }, [deleteItinerary]);

  // 处理分享
  const handleShare = useCallback((itinerary: Itinerary) => {
    setSelectedItinerary(itinerary);
    setShareModalVisible(true);
  }, []);

  // 处理导出
  const handleExport = useCallback((itinerary: Itinerary) => {
    setSelectedItinerary(itinerary);
    setExportModalVisible(true);
  }, []);

  // 处理搜索
  const handleSearch = useCallback((value: string) => {
    setFilter(prev => ({ ...prev, searchText: value }));
  }, [setFilter]);

  // 处理状态筛选
  const handleStatusChange = useCallback((value: ItineraryStatus | 'all') => {
    setFilter(prev => ({ ...prev, status: value }));
  }, [setFilter]);

  // 处理排序
  const handleSortChange = useCallback((value: string) => {
    setFilter(prev => ({ ...prev, sortBy: value as any }));
  }, [setFilter]);

  // 处理排序方向切换
  const toggleSortOrder = useCallback(() => {
    setFilter(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  }, [setFilter]);

  // 渲染操作菜单
  const renderActionMenu = useCallback((itinerary: Itinerary) => ({
    items: [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: '查看详情',
        onClick: () => navigate(`/itinerary/${itinerary.id}`)
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: '编辑行程',
        onClick: () => handleEdit(itinerary.id)
      },
      {
        key: 'share',
        icon: <ShareAltOutlined />,
        label: '分享行程',
        onClick: () => handleShare(itinerary)
      },
      {
        key: 'export',
        icon: <DownloadOutlined />,
        label: '导出行程',
        onClick: () => handleExport(itinerary)
      },
      { type: 'divider' as const },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除行程',
        danger: true,
        onClick: () => handleDelete(itinerary.id)
      }
    ]
  }), [navigate, handleEdit, handleShare, handleExport, handleDelete]);

  // 渲染行程卡片
  const renderItineraryItem = useCallback((itinerary: Itinerary) => {
    if (viewMode === 'grid') {
      return (
        <ItineraryCard
          key={itinerary.id}
          itinerary={itinerary}
          onView={() => handleViewDetail(itinerary)}
          onEdit={() => handleEdit(itinerary.id)}
          onDelete={() => handleDelete(itinerary.id)}
          onShare={() => handleShare(itinerary)}
          onExport={() => handleExport(itinerary)}
          actionMenu={renderActionMenu(itinerary)}
        />
      );
    }
    return (
      <ItineraryListItem
        key={itinerary.id}
        itinerary={itinerary}
        onView={() => handleViewDetail(itinerary)}
        onEdit={() => handleEdit(itinerary.id)}
        onDelete={() => handleDelete(itinerary.id)}
        onShare={() => handleShare(itinerary)}
        onExport={() => handleExport(itinerary)}
        actionMenu={renderActionMenu(itinerary)}
      />
    );
  }, [viewMode, handleViewDetail, handleEdit, handleDelete, handleShare, handleExport, renderActionMenu]);

  // 按状态分组
  const filteredByStatus = useCallback((status: ItineraryStatus | 'all') => {
    if (status === 'all') return itineraries;
    return itineraries.filter(item => item.status === status);
  }, [itineraries]);

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <Text type="danger">加载失败: {error.message}</Text>
        <Button onClick={refetch} style={{ marginLeft: 16 }}>重试</Button>
      </div>
    );
  }

  return (
    <div className="itinerary-list-page">
      {/* 页面头部 */}
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>我的行程</Title>
            <Text type="secondary">管理您的所有旅行计划</Text>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => navigate('/create')}
            >
              创建新行程
            </Button>
          </Col>
        </Row>
      </div>

      {/* 筛选栏 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="搜索行程..."
              prefix={<SearchOutlined />}
              allowClear
              onChange={e => handleSearch(e.target.value)}
            />
          </Col>
          <Col xs={12} sm={6} md={4} lg={3}>
            <Select
              style={{ width: '100%' }}
              value={filter.status}
              onChange={handleStatusChange}
            >
              {STATUS_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4} lg={3}>
            <Select
              style={{ width: '100%' }}
              value={filter.sortBy}
              onChange={handleSortChange}
            >
              {SORT_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Space>
              <Tooltip title={filter.sortOrder === 'asc' ? '升序' : '降序'}>
                <Button
                  icon={filter.sortOrder === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
                  onClick={toggleSortOrder}
                />
              </Tooltip>
              <Button.Group>
                <Button
                  type={viewMode === 'grid' ? 'primary' : 'default'}
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode('grid')}
                />
                <Button
                  type={viewMode === 'list' ? 'primary' : 'default'}
                  icon={<UnorderedListOutlined />}
                  onClick={() => setViewMode('list')}
                />
              </Button.Group>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 行程列表 */}
      <Spin spinning={loading} tip="加载中...">
        <Tabs defaultActiveKey="all">
          <TabPane tab={`全部 (${itineraries.length})`} key="all">
            {itineraries.length === 0 ? (
              <Empty
                description="暂无行程"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={() => navigate('/create')}>
                  创建第一个行程
                </Button>
              </Empty>
            ) : (
              <div className={viewMode === 'grid' ? 'itinerary-grid' : 'itinerary-list'}>
                {itineraries.map(renderItineraryItem)}
              </div>
            )}
          </TabPane>
          {['ongoing', 'completed', 'planning'].map(status => (
            <TabPane
              key={status}
              tab={`${STATUS_OPTIONS.find(s => s.value === status)?.label} (${filteredByStatus(status as ItineraryStatus).length})`}
            >
              {filteredByStatus(status as ItineraryStatus).length === 0 ? (
                <Empty description={`暂无${STATUS_OPTIONS.find(s => s.value === status)?.label}的行程`} />
              ) : (
                <div className={viewMode === 'grid' ? 'itinerary-grid' : 'itinerary-list'}>
                  {filteredByStatus(status as ItineraryStatus).map(renderItineraryItem)}
                </div>
              )}
            </TabPane>
          ))}
        </Tabs>
      </Spin>

      {/* 详情弹窗 */}
      <ItineraryDetailModal
        visible={detailModalVisible}
        itinerary={selectedItinerary}
        onClose={() => setDetailModalVisible(false)}
        onEdit={handleEdit}
        onShare={handleShare}
        onExport={handleExport}
      />

      {/* 分享弹窗 */}
      <ShareModal
        visible={shareModalVisible}
        itinerary={selectedItinerary}
        onClose={() => setShareModalVisible(false)}
      />

      {/* 导出弹窗 */}
      <ExportModal
        visible={exportModalVisible}
        itinerary={selectedItinerary}
        onClose={() => setExportModalVisible(false)}
      />
    </div>
  );
};

export default ItineraryListPage;
