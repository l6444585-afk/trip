import React, { useState } from 'react';
import {
  Card, Table, Button, Input, Space, Tag, Modal, Descriptions,
  Form, Select, message, Popconfirm, DatePicker, Timeline,
} from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, CheckOutlined, SendOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useTableData from './hooks/useTableData';
import PageContainer from './components/PageContainer';
import { adminItineraryService } from '../../services/adminApi';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const statusMap = {
  draft: { color: 'default', text: '草稿' },
  pending: { color: 'orange', text: '待审核' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已拒绝' },
  published: { color: 'blue', text: '已发布' },
  offline: { color: 'default', text: '已下架' },
};

const getStatusTag = (status) => {
  const c = statusMap[status] || { color: 'default', text: status };
  return <Tag color={c.color}>{c.text}</Tag>;
};

const ItineraryManagement = () => {
  const { loading, data, filters, updateFilter, pagination, search, reset, refresh } = useTableData(
    adminItineraryService.getItineraries,
    { initialFilters: { keyword: '', status: '', start_date: null, end_date: null } }
  );
  const [selected, setSelected] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewForm] = Form.useForm();

  const handleReview = (item) => { setSelected(item); reviewForm.resetFields(); setReviewVisible(true); };

  const submitReview = async (values) => {
    try {
      await adminItineraryService.reviewItinerary(selected.id, values);
      message.success('审核完成');
      setReviewVisible(false);
      refresh();
    } catch { message.error('审核失败'); }
  };

  const handlePublish = async (item) => {
    try { await adminItineraryService.publishItinerary(item.id); message.success('发布成功'); refresh(); }
    catch { message.error('发布失败'); }
  };

  const handleOffline = async (item, reason) => {
    try { await adminItineraryService.offlineItinerary(item.id, reason); message.success('下架成功'); refresh(); }
    catch { message.error('下架失败'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '行程名称', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '创建者', dataIndex: 'user', key: 'user', width: 100, render: (u) => u?.username || '-' },
    { title: '天数', dataIndex: 'days', key: 'days', width: 70, sorter: (a, b) => a.days - b.days },
    { title: '预算', dataIndex: 'budget', key: 'budget', width: 90, render: (v) => `¥${v}`, sorter: (a, b) => a.budget - b.budget },
    { title: '出发地', dataIndex: 'departure', key: 'departure', width: 90 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: getStatusTag },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 150, render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'), sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at) },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelected(r); setDetailVisible(true); }}>详情</Button>
          {r.status === 'pending' && <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleReview(r)}>审核</Button>}
          {r.status === 'approved' && <Popconfirm title="确定要发布？" onConfirm={() => handlePublish(r)}><Button type="link" size="small" icon={<SendOutlined />}>发布</Button></Popconfirm>}
          {r.status === 'published' && (
            <Popconfirm title="确定要下架？" description={<TextArea id="offline-reason" placeholder="下架原因" />}
              onConfirm={() => handleOffline(r, document.getElementById('offline-reason')?.value || '管理员下架')}>
              <Button type="link" size="small" danger icon={<StopOutlined />}>下架</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="行程管理" subtitle="管理用户创建的旅游行程">
      <Card className="admin-filter-card">
        <div className="filter-row">
          <Space wrap size={12}>
            <Input placeholder="搜索行程名称" prefix={<SearchOutlined />} value={filters.keyword}
              onChange={(e) => updateFilter('keyword', e.target.value)} onPressEnter={search} style={{ width: 200 }} allowClear />
            <Select placeholder="选择状态" value={filters.status || undefined} onChange={(v) => updateFilter('status', v)} allowClear style={{ width: 120 }}
              options={Object.entries(statusMap).map(([k, v]) => ({ value: k, label: v.text }))} />
            <RangePicker value={filters.start_date && filters.end_date ? [dayjs(filters.start_date), dayjs(filters.end_date)] : null}
              onChange={(dates) => { updateFilter('start_date', dates ? dates[0].format('YYYY-MM-DD') : null); updateFilter('end_date', dates ? dates[1].format('YYYY-MM-DD') : null); }} />
            <Button type="primary" icon={<SearchOutlined />} onClick={search}>搜索</Button>
            <Button icon={<ReloadOutlined />} onClick={reset}>重置</Button>
          </Space>
        </div>
      </Card>
      <Card className="admin-table-card">
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: 1100 }} pagination={pagination} />
      </Card>

      <Modal title="行程详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={900}>
        {selected && (
          <>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="行程名称">{selected.title}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(selected.status)}</Descriptions.Item>
              <Descriptions.Item label="天数">{selected.days}天</Descriptions.Item>
              <Descriptions.Item label="预算">¥{selected.budget}</Descriptions.Item>
              <Descriptions.Item label="出发地">{selected.departure}</Descriptions.Item>
              <Descriptions.Item label="同行类型">{selected.companion_type}</Descriptions.Item>
              <Descriptions.Item label="兴趣偏好">{selected.interests}</Descriptions.Item>
              <Descriptions.Item label="创建者">{selected.user?.username}</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>{dayjs(selected.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </Descriptions>
            <h4 style={{ marginTop: 20, marginBottom: 12 }}>行程安排</h4>
            <Timeline items={selected.schedules?.map((s, i) => ({
              color: 'green', children: <div key={i}><strong>第{s.day}天 - {s.period}</strong><br />{s.activity} {s.location && `- ${s.location}`}</div>,
            })) || []} />
          </>
        )}
      </Modal>

      <Modal title="审核行程" open={reviewVisible} onCancel={() => setReviewVisible(false)} onOk={() => reviewForm.submit()}>
        <Form form={reviewForm} onFinish={submitReview} layout="vertical">
          <Form.Item name="status" label="审核结果" rules={[{ required: true, message: '请选择' }]}>
            <Select options={[{ value: 'approved', label: '通过' }, { value: 'rejected', label: '拒绝' }]} />
          </Form.Item>
          <Form.Item name="review_comment" label="审核意见">
            <TextArea rows={4} placeholder="请输入审核意见" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ItineraryManagement;
