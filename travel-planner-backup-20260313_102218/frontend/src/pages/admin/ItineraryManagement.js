import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Input, Space, Tag, Modal, Descriptions,
  Form, Select, message, Popconfirm, DatePicker, Badge, Timeline, InputNumber
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, EyeOutlined, CheckOutlined,
  CloseOutlined, SendOutlined, StopOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminItineraryService } from '../../services/adminApi';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const ItineraryManagement = () => {
  const [loading, setLoading] = useState(false);
  const [itineraries, setItineraries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewForm] = Form.useForm();
  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
    user_id: null,
    start_date: null,
    end_date: null,
  });

  useEffect(() => {
    fetchItineraries();
  }, [page, pageSize]);

  const fetchItineraries = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        ...filters,
      };
      const result = await adminItineraryService.getItineraries(params);
      setItineraries(result.items);
      setTotal(result.total);
    } catch (error) {
      message.error('获取行程列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchItineraries();
  };

  const handleReset = () => {
    setFilters({
      keyword: '',
      status: '',
      user_id: null,
      start_date: null,
      end_date: null,
    });
    setPage(1);
    setTimeout(fetchItineraries, 0);
  };

  const handleViewDetail = (itinerary) => {
    setSelectedItinerary(itinerary);
    setDetailVisible(true);
  };

  const handleReview = (itinerary) => {
    setSelectedItinerary(itinerary);
    reviewForm.resetFields();
    setReviewVisible(true);
  };

  const submitReview = async (values) => {
    try {
      await adminItineraryService.reviewItinerary(selectedItinerary.id, values);
      message.success('审核完成');
      setReviewVisible(false);
      fetchItineraries();
    } catch (error) {
      message.error('审核失败');
    }
  };

  const handlePublish = async (itinerary) => {
    try {
      await adminItineraryService.publishItinerary(itinerary.id);
      message.success('发布成功');
      fetchItineraries();
    } catch (error) {
      message.error('发布失败');
    }
  };

  const handleOffline = async (itinerary, reason) => {
    try {
      await adminItineraryService.offlineItinerary(itinerary.id, reason);
      message.success('下架成功');
      fetchItineraries();
    } catch (error) {
      message.error('下架失败');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      draft: { color: 'default', text: '草稿' },
      pending: { color: 'orange', text: '待审核' },
      approved: { color: 'green', text: '已通过' },
      rejected: { color: 'red', text: '已拒绝' },
      published: { color: 'blue', text: '已发布' },
      offline: { color: 'default', text: '已下架' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '行程名称',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text) => <a>{text}</a>,
    },
    {
      title: '创建者',
      dataIndex: 'user',
      key: 'user',
      width: 120,
      render: (user) => user?.username || '-',
    },
    {
      title: '天数',
      dataIndex: 'days',
      key: 'days',
      width: 80,
      sorter: (a, b) => a.days - b.days,
    },
    {
      title: '预算',
      dataIndex: 'budget',
      key: 'budget',
      width: 100,
      render: (val) => `¥${val}`,
      sorter: (a, b) => a.budget - b.budget,
    },
    {
      title: '出发地',
      dataIndex: 'departure',
      key: 'departure',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
      filters: [
        { text: '草稿', value: 'draft' },
        { text: '待审核', value: 'pending' },
        { text: '已通过', value: 'approved' },
        { text: '已发布', value: 'published' },
        { text: '已下架', value: 'offline' },
      ],
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleReview(record)}
            >
              审核
            </Button>
          )}
          {record.status === 'approved' && (
            <Popconfirm
              title="确定要发布该行程吗？"
              onConfirm={() => handlePublish(record)}
            >
              <Button type="link" size="small" icon={<SendOutlined />}>
                发布
              </Button>
            </Popconfirm>
          )}
          {record.status === 'published' && (
            <Popconfirm
              title="确定要下架该行程吗？"
              description={<Input.TextArea id="offline-reason" placeholder="请输入下架原因" />}
              onConfirm={() => {
                const reason = document.getElementById('offline-reason')?.value || '管理员下架';
                handleOffline(record, reason);
              }}
            >
              <Button type="link" size="small" danger icon={<StopOutlined />}>
                下架
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="itinerary-management">
      <div className="page-header">
        <h1 className="page-title">行程管理</h1>
        <p className="page-subtitle">管理用户创建的旅游行程</p>
      </div>

      <Card className="filter-card">
        <Space wrap>
          <Input
            placeholder="搜索行程名称"
            prefix={<SearchOutlined />}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
          />
          <Select
            placeholder="选择状态"
            value={filters.status || undefined}
            onChange={(value) => setFilters({ ...filters, status: value })}
            allowClear
            style={{ width: 120 }}
            options={[
              { value: 'draft', label: '草稿' },
              { value: 'pending', label: '待审核' },
              { value: 'approved', label: '已通过' },
              { value: 'published', label: '已发布' },
              { value: 'offline', label: '已下架' },
            ]}
          />
          <RangePicker
            value={
              filters.start_date && filters.end_date
                ? [dayjs(filters.start_date), dayjs(filters.end_date)]
                : null
            }
            onChange={(dates) =>
              setFilters({
                ...filters,
                start_date: dates ? dates[0].format('YYYY-MM-DD') : null,
                end_date: dates ? dates[1].format('YYYY-MM-DD') : null,
              })
            }
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </Card>

      <Card className="table-card">
        <Table
          columns={columns}
          dataSource={itineraries}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
          }}
        />
      </Card>

      <Modal
        title="行程详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={900}
      >
        {selectedItinerary && (
          <>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="行程ID">{selectedItinerary.id}</Descriptions.Item>
              <Descriptions.Item label="行程名称">{selectedItinerary.title}</Descriptions.Item>
              <Descriptions.Item label="天数">{selectedItinerary.days}天</Descriptions.Item>
              <Descriptions.Item label="预算">¥{selectedItinerary.budget}</Descriptions.Item>
              <Descriptions.Item label="出发地">{selectedItinerary.departure}</Descriptions.Item>
              <Descriptions.Item label="同行类型">{selectedItinerary.companion_type}</Descriptions.Item>
              <Descriptions.Item label="兴趣偏好">{selectedItinerary.interests}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(selectedItinerary.status)}
              </Descriptions.Item>
              <Descriptions.Item label="创建者">
                {selectedItinerary.user?.username}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedItinerary.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginTop: 24, marginBottom: 16 }}>行程安排</h4>
            <Timeline
              items={selectedItinerary.schedules?.map((s, idx) => ({
                color: 'blue',
                children: (
                  <div key={idx}>
                    <strong>第{s.day}天 - {s.period}</strong>
                    <br />
                    {s.activity} {s.location && `- ${s.location}`}
                  </div>
                ),
              })) || []}
            />
          </>
        )}
      </Modal>

      <Modal
        title="审核行程"
        open={reviewVisible}
        onCancel={() => setReviewVisible(false)}
        onOk={() => reviewForm.submit()}
      >
        <Form form={reviewForm} onFinish={submitReview} layout="vertical">
          <Form.Item
            name="status"
            label="审核结果"
            rules={[{ required: true, message: '请选择审核结果' }]}
          >
            <Select
              options={[
                { value: 'approved', label: '通过' },
                { value: 'rejected', label: '拒绝' },
              ]}
            />
          </Form.Item>
          <Form.Item name="review_comment" label="审核意见">
            <TextArea rows={4} placeholder="请输入审核意见" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ItineraryManagement;
