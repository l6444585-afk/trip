import React, { useState } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, message, Descriptions } from 'antd';
import { PlusOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useTableData from './hooks/useTableData';
import PageContainer from './components/PageContainer';
import { adminSystemService } from '../../services/adminApi';

const formatFileSize = (bytes) => {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
  return `${bytes.toFixed(2)} ${units[i]}`;
};

const BackupManagement = () => {
  const { loading, data, refresh } = useTableData(
    async () => { const result = await adminSystemService.getBackups(); return Array.isArray(result) ? result : result; },
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleCreate = async (values) => {
    try {
      const result = await adminSystemService.createBackup(values);
      if (result.success) { message.success('备份创建成功'); setModalVisible(false); refresh(); }
      else { message.error(result.message || '备份创建失败'); }
    } catch { message.error('备份创建失败'); }
  };

  const statusConfig = {
    pending: { color: 'default', text: '待处理' },
    processing: { color: 'processing', text: '处理中' },
    completed: { color: 'success', text: '已完成' },
    failed: { color: 'error', text: '失败' },
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '备份名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', width: 80, render: (t) => <Tag color={t === 'manual' ? 'blue' : 'green'}>{t === 'manual' ? '手动' : '自动'}</Tag> },
    { title: '文件大小', dataIndex: 'file_size', key: 'file_size', width: 100, render: formatFileSize },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s) => { const c = statusConfig[s] || { color: 'default', text: s }; return <Tag color={c.color}>{c.text}</Tag>; },
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 170, render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm:ss') },
    {
      title: '操作', key: 'action', width: 100,
      render: (_, r) => r.status === 'completed' && (
        <Button type="link" size="small" icon={<DownloadOutlined />}>下载</Button>
      ),
    },
  ];

  return (
    <PageContainer title="数据备份" subtitle="管理系统数据备份与恢复"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refresh}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalVisible(true); }}>创建备份</Button>
        </Space>
      }
    >
      <Card style={{ marginBottom: 16, borderRadius: 10, border: '1px solid #E5E7EB' }}>
        <Descriptions column={4}>
          <Descriptions.Item label="备份目录">backups/</Descriptions.Item>
          <Descriptions.Item label="自动备份">每日凌晨2:00</Descriptions.Item>
          <Descriptions.Item label="保留天数">30天</Descriptions.Item>
          <Descriptions.Item label="备份总数">{data.length}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card className="admin-table-card">
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={false} />
      </Card>

      <Modal title="创建备份" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()}>
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="name" label="备份名称"><Input placeholder="留空则自动生成" /></Form.Item>
          <Form.Item name="tables" label="备份表"><Input placeholder="留空则备份所有表" /></Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default BackupManagement;
