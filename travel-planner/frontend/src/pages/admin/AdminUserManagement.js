import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Space, Tag, Modal, Form, Select, message, Popconfirm, Switch } from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useTableData from './hooks/useTableData';
import PageContainer from './components/PageContainer';
import { adminSystemService } from '../../services/adminApi';

const AdminUserManagement = () => {
  const { loading, data, filters, updateFilter, pagination, search, reset, refresh } = useTableData(
    adminSystemService.getAdminUsers,
    { initialFilters: { keyword: '' } }
  );
  const [roles, setRoles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    adminSystemService.getRoles().then(setRoles).catch(() => {});
  }, []);

  const handleCreate = () => { setEditing(null); form.resetFields(); setModalVisible(true); };

  const handleEdit = (user) => {
    setEditing(user);
    form.setFieldsValue({ email: user.email, real_name: user.real_name, phone: user.phone, status: user.status, role_ids: user.roles?.map((r) => r.id) || [] });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try { await adminSystemService.deleteAdminUser(id); message.success('删除成功'); refresh(); }
    catch (err) { message.error(err.response?.data?.detail || '删除失败'); }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) { await adminSystemService.updateAdminUser(editing.id, values); message.success('更新成功'); }
      else { await adminSystemService.createAdminUser(values); message.success('创建成功'); }
      setModalVisible(false);
      refresh();
    } catch { message.error(editing ? '更新失败' : '创建失败'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '用户名', dataIndex: 'username', key: 'username', render: (t) => <Space><UserOutlined />{t}</Space> },
    { title: '姓名', dataIndex: 'real_name', key: 'real_name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '角色', dataIndex: 'roles', key: 'roles', render: (r) => <Space>{r?.map((i) => <Tag key={i.id} color="blue">{i.name}</Tag>)}</Space> },
    { title: '超管', dataIndex: 'is_superuser', key: 'is_superuser', width: 70, render: (v) => <Tag color={v ? 'gold' : 'default'}>{v ? '是' : '否'}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 70, render: (s) => <Tag color={s === 1 ? 'green' : 'red'}>{s === 1 ? '正常' : '禁用'}</Tag> },
    { title: '最后登录', dataIndex: 'last_login', key: 'last_login', width: 150, render: (t) => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-' },
    {
      title: '操作', key: 'action', width: 160,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
          {!r.is_superuser && (
            <Popconfirm title="确定要删除？" onConfirm={() => handleDelete(r.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="管理员管理" subtitle="管理系统管理员账户"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增管理员</Button>}>
      <Card className="admin-filter-card">
        <div className="filter-row">
          <Space wrap size={12}>
            <Input placeholder="搜索用户名/姓名/邮箱" prefix={<SearchOutlined />} value={filters.keyword}
              onChange={(e) => updateFilter('keyword', e.target.value)} onPressEnter={search} style={{ width: 250 }} allowClear />
            <Button type="primary" icon={<SearchOutlined />} onClick={search}>搜索</Button>
            <Button icon={<ReloadOutlined />} onClick={reset}>重置</Button>
          </Space>
        </div>
      </Card>
      <Card className="admin-table-card">
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={pagination} />
      </Card>

      <Modal title={editing ? '编辑管理员' : '新增管理员'} open={modalVisible} onCancel={() => setModalVisible(false)} onOk={handleSubmit} width={600}>
        <Form form={form} layout="vertical">
          {!editing && (
            <>
              <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入' }]}><Input placeholder="用户名" /></Form.Item>
              <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入' }]}><Input.Password placeholder="密码" /></Form.Item>
            </>
          )}
          <Form.Item name="email" label="邮箱" rules={[{ required: true, message: '请输入' }]}><Input placeholder="邮箱" /></Form.Item>
          <Form.Item name="real_name" label="姓名"><Input placeholder="姓名" /></Form.Item>
          <Form.Item name="phone" label="手机号"><Input placeholder="手机号" /></Form.Item>
          {editing && <Form.Item name="status" label="状态" valuePropName="checked"><Switch checkedChildren="启用" unCheckedChildren="禁用" /></Form.Item>}
          <Form.Item name="role_ids" label="角色">
            <Select mode="multiple" placeholder="选择角色" options={roles.map((r) => ({ value: r.id, label: r.name }))} />
          </Form.Item>
          {!editing && <Form.Item name="is_superuser" label="超级管理员" valuePropName="checked"><Switch /></Form.Item>}
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default AdminUserManagement;
