import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Input, Space, Tag, Modal, Descriptions,
  Form, Select, message, Popconfirm, DatePicker, Tabs, List, Avatar
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, UserOutlined, EyeOutlined,
  StopOutlined, CheckCircleOutlined, DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminUserService } from '../../services/adminApi';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const UserManagement = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '',
    start_date: null,
    end_date: null,
  });

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        ...filters,
      };
      const result = await adminUserService.getUsers(params);
      setUsers(result.items);
      setTotal(result.total);
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleReset = () => {
    setFilters({
      keyword: '',
      start_date: null,
      end_date: null,
    });
    setPage(1);
    setTimeout(fetchUsers, 0);
  };

  const handleViewDetail = async (user) => {
    try {
      const detail = await adminUserService.getUserDetail(user.id);
      setSelectedUser(detail);
      setDetailVisible(true);
    } catch (error) {
      message.error('获取用户详情失败');
    }
  };

  const handleToggleStatus = async (user, status) => {
    try {
      await adminUserService.updateUserStatus(user.id, status);
      message.success(status === 1 ? '已启用用户' : '已禁用用户');
      fetchUsers();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {text}
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '行程数',
      dataIndex: 'itineraries_count',
      key: 'itineraries_count',
      width: 100,
      sorter: (a, b) => a.itineraries_count - b.itineraries_count,
    },
    {
      title: '订单数',
      dataIndex: 'orders_count',
      key: 'orders_count',
      width: 100,
      sorter: (a, b) => a.orders_count - b.orders_count,
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status !== 0 ? (
            <Popconfirm
              title="确定要禁用该用户吗？"
              onConfirm={() => handleToggleStatus(record, 0)}
            >
              <Button type="link" size="small" danger icon={<StopOutlined />}>
                禁用
              </Button>
            </Popconfirm>
          ) : (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleToggleStatus(record, 1)}
            >
              启用
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="user-management">
      <div className="page-header">
        <h1 className="page-title">用户管理</h1>
        <p className="page-subtitle">管理系统用户账户信息</p>
      </div>

      <Card className="filter-card">
        <Space wrap>
          <Input
            placeholder="搜索用户名/邮箱"
            prefix={<SearchOutlined />}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
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
          dataSource={users}
          rowKey="id"
          loading={loading}
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
        title="用户详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedUser && (
          <Tabs defaultActiveKey="basic">
            <TabPane tab="基本信息" key="basic">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="用户ID">{selectedUser.id}</Descriptions.Item>
                <Descriptions.Item label="用户名">{selectedUser.username}</Descriptions.Item>
                <Descriptions.Item label="邮箱">{selectedUser.email}</Descriptions.Item>
                <Descriptions.Item label="注册时间">
                  {dayjs(selectedUser.created_at).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="行程数">{selectedUser.itineraries_count}</Descriptions.Item>
                <Descriptions.Item label="订单数">{selectedUser.orders_count}</Descriptions.Item>
              </Descriptions>
              {selectedUser.preferences && (
                <>
                  <h4 style={{ marginTop: 16, marginBottom: 8 }}>用户偏好</h4>
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="偏好节奏">
                      {selectedUser.preferences.preferred_pace || '未设置'}
                    </Descriptions.Item>
                    <Descriptions.Item label="预算偏好">
                      {selectedUser.preferences.budget_preference || '未设置'}
                    </Descriptions.Item>
                    <Descriptions.Item label="兴趣偏好">
                      {selectedUser.preferences.interests || '未设置'}
                    </Descriptions.Item>
                    <Descriptions.Item label="饮食限制">
                      {selectedUser.preferences.dietary_restrictions || '无'}
                    </Descriptions.Item>
                  </Descriptions>
                </>
              )}
            </TabPane>
            <TabPane tab="最近行程" key="itineraries">
              <List
                dataSource={selectedUser.recent_itineraries || []}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.title}
                      description={`${item.days}天 | ${dayjs(item.created_at).format('YYYY-MM-DD')}`}
                    />
                  </List.Item>
                )}
                locale={{ emptyText: '暂无行程' }}
              />
            </TabPane>
            <TabPane tab="最近订单" key="orders">
              <List
                dataSource={selectedUser.recent_orders || []}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.title || item.order_no}
                      description={`¥${item.total_amount} | ${item.status}`}
                    />
                    <Tag color={item.status === 'completed' ? 'green' : 'blue'}>
                      {item.status}
                    </Tag>
                  </List.Item>
                )}
                locale={{ emptyText: '暂无订单' }}
              />
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
