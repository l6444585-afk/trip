import React, { useState } from 'react';
import {
  Card, Table, Button, Input, Space, Tag, Modal, Descriptions,
  message, Popconfirm, DatePicker, Tabs, List, Avatar,
} from 'antd';
import { SearchOutlined, ReloadOutlined, UserOutlined, EyeOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useTableData from './hooks/useTableData';
import PageContainer from './components/PageContainer';
import { adminUserService } from '../../services/adminApi';

const { RangePicker } = DatePicker;

const UserManagement = () => {
  const { loading, data, filters, updateFilter, pagination, search, reset } = useTableData(
    adminUserService.getUsers,
    { initialFilters: { keyword: '', start_date: null, end_date: null } }
  );
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const handleViewDetail = async (user) => {
    try {
      const detail = await adminUserService.getUserDetail(user.id);
      setSelectedUser(detail);
      setDetailVisible(true);
    } catch { message.error('获取用户详情失败'); }
  };

  const handleToggleStatus = async (user, status) => {
    try {
      await adminUserService.updateUserStatus(user.id, status);
      message.success(status === 1 ? '已启用用户' : '已禁用用户');
      search();
    } catch { message.error('操作失败'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    {
      title: '用户名', dataIndex: 'username', key: 'username',
      render: (text) => <Space><Avatar size="small" icon={<UserOutlined />} />{text}</Space>,
    },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '行程数', dataIndex: 'itineraries_count', key: 'itineraries_count', width: 90, sorter: (a, b) => a.itineraries_count - b.itineraries_count },
    { title: '订单数', dataIndex: 'orders_count', key: 'orders_count', width: 90, sorter: (a, b) => a.orders_count - b.orders_count },
    { title: '注册时间', dataIndex: 'created_at', key: 'created_at', width: 160, render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'), sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at) },
    {
      title: '操作', key: 'action', width: 180,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          {record.status !== 0 ? (
            <Popconfirm title="确定要禁用该用户吗？" onConfirm={() => handleToggleStatus(record, 0)}>
              <Button type="link" size="small" danger icon={<StopOutlined />}>禁用</Button>
            </Popconfirm>
          ) : (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleToggleStatus(record, 1)}>启用</Button>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'basic', label: '基本信息',
      children: selectedUser && (
        <>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="用户ID">{selectedUser.id}</Descriptions.Item>
            <Descriptions.Item label="用户名">{selectedUser.username}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{selectedUser.email}</Descriptions.Item>
            <Descriptions.Item label="注册时间">{dayjs(selectedUser.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            <Descriptions.Item label="行程数">{selectedUser.itineraries_count}</Descriptions.Item>
            <Descriptions.Item label="订单数">{selectedUser.orders_count}</Descriptions.Item>
          </Descriptions>
          {selectedUser.preferences && (
            <Descriptions column={2} bordered size="small" style={{ marginTop: 16 }} title="用户偏好">
              <Descriptions.Item label="偏好节奏">{selectedUser.preferences.preferred_pace || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="预算偏好">{selectedUser.preferences.budget_preference || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="兴趣偏好">{selectedUser.preferences.interests || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="饮食限制">{selectedUser.preferences.dietary_restrictions || '无'}</Descriptions.Item>
            </Descriptions>
          )}
        </>
      ),
    },
    {
      key: 'itineraries', label: '最近行程',
      children: <List dataSource={selectedUser?.recent_itineraries || []} renderItem={(item) => (
        <List.Item><List.Item.Meta title={item.title} description={`${item.days}天 | ${dayjs(item.created_at).format('YYYY-MM-DD')}`} /></List.Item>
      )} locale={{ emptyText: '暂无行程' }} />,
    },
    {
      key: 'orders', label: '最近订单',
      children: <List dataSource={selectedUser?.recent_orders || []} renderItem={(item) => (
        <List.Item extra={<Tag color={item.status === 'completed' ? 'green' : 'blue'}>{item.status}</Tag>}>
          <List.Item.Meta title={item.title || item.order_no} description={`¥${item.total_amount} | ${item.status}`} />
        </List.Item>
      )} locale={{ emptyText: '暂无订单' }} />,
    },
  ];

  return (
    <PageContainer title="用户管理" subtitle="管理系统用户账户信息">
      <Card className="admin-filter-card">
        <div className="filter-row">
          <Space wrap size={12}>
            <Input placeholder="搜索用户名/邮箱" prefix={<SearchOutlined />} value={filters.keyword}
              onChange={(e) => updateFilter('keyword', e.target.value)} onPressEnter={search} style={{ width: 200 }} allowClear />
            <RangePicker value={filters.start_date && filters.end_date ? [dayjs(filters.start_date), dayjs(filters.end_date)] : null}
              onChange={(dates) => { updateFilter('start_date', dates ? dates[0].format('YYYY-MM-DD') : null); updateFilter('end_date', dates ? dates[1].format('YYYY-MM-DD') : null); }} />
            <Button type="primary" icon={<SearchOutlined />} onClick={search}>搜索</Button>
            <Button icon={<ReloadOutlined />} onClick={reset}>重置</Button>
          </Space>
        </div>
      </Card>
      <Card className="admin-table-card">
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={pagination} />
      </Card>

      <Modal title="用户详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={800}>
        <Tabs items={tabItems} />
      </Modal>
    </PageContainer>
  );
};

export default UserManagement;
