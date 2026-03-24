import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, message, Popconfirm, Tree } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import useTableData from './hooks/useTableData';
import PageContainer from './components/PageContainer';
import { adminSystemService } from '../../services/adminApi';

const RoleManagement = () => {
  const { loading, data, refresh } = useTableData(
    async () => { const result = await adminSystemService.getRoles(); return Array.isArray(result) ? result : result; },
  );
  const [permissions, setPermissions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    adminSystemService.getPermissions().then(setPermissions).catch(() => {});
  }, []);

  const handleCreate = () => { setEditing(null); form.resetFields(); setModalVisible(true); };

  const handleEdit = (role) => {
    setEditing(role);
    form.setFieldsValue({ name: role.name, code: role.code, description: role.description, permission_ids: role.permissions?.map((p) => p.id) || [] });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try { await adminSystemService.deleteRole(id); message.success('删除成功'); refresh(); }
    catch (err) { message.error(err.response?.data?.detail || '删除失败'); }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) { await adminSystemService.updateRole(editing.id, values); message.success('更新成功'); }
      else { await adminSystemService.createRole(values); message.success('创建成功'); }
      setModalVisible(false);
      refresh();
    } catch { message.error(editing ? '更新失败' : '创建失败'); }
  };

  const buildPermissionTree = (perms) => {
    const map = {};
    const tree = [];
    perms.forEach((p) => { map[p.id] = { key: p.id, title: p.name, children: [] }; });
    perms.forEach((p) => {
      if (p.parent_id && map[p.parent_id]) map[p.parent_id].children.push(map[p.id]);
      else if (!p.parent_id) tree.push(map[p.id]);
    });
    return tree;
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '角色名称', dataIndex: 'name', key: 'name' },
    { title: '角色编码', dataIndex: 'code', key: 'code', render: (t) => <Tag color="blue">{t}</Tag> },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '权限数量', dataIndex: 'permissions', key: 'permissions', width: 90, render: (p) => p?.length || 0 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s) => <Tag color={s === 1 ? 'green' : 'default'}>{s === 1 ? '启用' : '禁用'}</Tag> },
    {
      title: '操作', key: 'action', width: 160,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
          {r.code !== 'admin' && (
            <Popconfirm title="确定要删除？" onConfirm={() => handleDelete(r.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="角色权限管理" subtitle="管理系统角色和权限配置"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增角色</Button>}>
      <Card className="admin-table-card">
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={false} />
      </Card>

      <Modal title={editing ? '编辑角色' : '新增角色'} open={modalVisible} onCancel={() => setModalVisible(false)} onOk={handleSubmit} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入' }]}>
            <Input placeholder="角色名称" disabled={editing?.code === 'admin'} />
          </Form.Item>
          <Form.Item name="code" label="角色编码" rules={[{ required: true, message: '请输入' }]}>
            <Input placeholder="角色编码" disabled={!!editing} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="角色描述" />
          </Form.Item>
          <Form.Item name="permission_ids" label="权限配置">
            <Tree checkable defaultExpandAll treeData={buildPermissionTree(permissions)}
              checkedKeys={form.getFieldValue('permission_ids') || []}
              onCheck={(keys) => form.setFieldsValue({ permission_ids: keys })} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default RoleManagement;
