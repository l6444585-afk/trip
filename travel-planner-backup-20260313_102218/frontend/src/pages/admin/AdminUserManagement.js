import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Input, Space, Tag, Modal, Form, Select,
  message, Popconfirm, Descriptions, Switch
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, PlusOutlined, EditOutlined,
  DeleteOutlined, SafetyOutlined, UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminSystemService } from '../../services/adminApi';

const AdminUserManagement = () => {
  const [loading, setLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    fetchAdminUsers();
    fetchRoles();
  }, [page, pageSize]);

  const fetchAdminUsers = async () => {
    setLoading(true);
    try {
      const result = await adminSystemService.getAdminUsers({ page, page_size: pageSize, keyword });
      setAdminUsers(result.items);
      setTotal(result.total);
    } catch (error) {
      message.error('获取管理员列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const result = await adminSystemService.getRoles();
      setRoles(result);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchAdminUsers();
  };

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      email: user.email,
      real_name: user.real_name,
      phone: user.phone,
      status: user.status,
      role_ids: user.roles?.map((r) => r.id) || [],
    });
    setModalVisible(true);
  };

  const handleDelete = async (userId) => {
    try {
      await adminSystemService.deleteAdminUser(userId);
      message.success('删除成功');
      fetchAdminUsers();
    } catch (error) {
      message.error(error.response?.data?.detail || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        await adminSystemService.updateAdminUser(editingUser.id, values);
        message.success('更新成功');
      } else {
        await adminSystemService.createAdminUser(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchAdminUsers();
    } catch (error) {
      message.error(editingUser ? '更新失败' : '创建失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '姓名',
      dataIndex: 'real_name',
      key: 'real_name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles) => (
        <Space>
          {roles?.map((r) => (
            <Tag key={r.id} color="blue">
              {r.name}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '超级管理员',
      dataIndex: 'is_superuser',
      key: 'is_superuser',
      width: 100,
      render: (val) => (
        <Tag color={val ? 'gold' : 'default'}>{val ? '是' : '否'}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'last_login',
      key: 'last_login',
      width: 160,
      render: (text) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {!record.is_superuser && (
            <Popconfirm
              title="确定要删除该管理员吗？"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-user-management">
      <div className="page-header">
        <h1 className="page-title">管理员管理</h1>
        <p className="page-subtitle">管理系统管理员账户</p>
      </div>

      <Card className="filter-card">
        <div className="action-bar">
          <Space>
            <Input
              placeholder="搜索用户名/姓名/邮箱"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 250 }}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); fetchAdminUsers(); }}>
              重置
            </Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增管理员
          </Button>
        </div>
      </Card>

      <Card className="table-card">
        <Table
          columns={columns}
          dataSource={adminUsers}
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
        title={editingUser ? '编辑管理员' : '新增管理员'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={600}
      >
        <Form form={form} layout="vertical" className="modal-form">
          {!editingUser && (
            <>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            </>
          )}
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ required: true, message: '请输入邮箱' }]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="real_name" label="姓名">
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="请输入手机号" />
          </Form.Item>
          {editingUser && (
            <Form.Item name="status" label="状态" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          )}
          <Form.Item name="role_ids" label="角色">
            <Select
              mode="multiple"
              placeholder="请选择角色"
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
            />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="is_superuser" label="超级管理员" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUserManagement;
