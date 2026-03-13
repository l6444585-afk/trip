import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, message,
  List, Progress, Descriptions
} from 'antd';
import {
  DownloadOutlined, PlusOutlined, ReloadOutlined, DeleteOutlined,
  DatabaseOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminSystemService } from '../../services/adminApi';

const BackupManagement = () => {
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const result = await adminSystemService.getBackups();
      setBackups(result);
    } catch (error) {
      message.error('获取备份列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async (values) => {
    try {
      const result = await adminSystemService.createBackup(values);
      if (result.success) {
        message.success('备份创建成功');
        setCreateModalVisible(false);
        fetchBackups();
      } else {
        message.error(result.message || '备份创建失败');
      }
    } catch (error) {
      message.error('备份创建失败');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(2)} ${units[i]}`;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '备份名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => (
        <Tag color={type === 'manual' ? 'blue' : 'green'}>
          {type === 'manual' ? '手动' : '自动'}
        </Tag>
      ),
    },
    {
      title: '文件大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 120,
      render: (size) => formatFileSize(size),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const colors = {
          pending: 'default',
          processing: 'processing',
          completed: 'success',
          failed: 'error',
        };
        const texts = {
          pending: '待处理',
          processing: '处理中',
          completed: '已完成',
          failed: '失败',
        };
        return <Tag color={colors[status]}>{texts[status] || status}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          {record.status === 'completed' && (
            <Button type="link" size="small" icon={<DownloadOutlined />}>
              下载
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="backup-management">
      <div className="page-header">
        <h1 className="page-title">数据备份</h1>
        <p className="page-subtitle">管理系统数据备份与恢复</p>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={4}>
          <Descriptions.Item label="备份目录">backups/</Descriptions.Item>
          <Descriptions.Item label="自动备份">每日凌晨2:00</Descriptions.Item>
          <Descriptions.Item label="保留天数">30天</Descriptions.Item>
          <Descriptions.Item label="备份总数">{backups.length}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card className="table-card">
        <div className="action-bar">
          <div></div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchBackups}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              创建备份
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={backups}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title="创建备份"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleCreateBackup} layout="vertical">
          <Form.Item name="name" label="备份名称">
            <Input placeholder="留空则自动生成" />
          </Form.Item>
          <Form.Item name="tables" label="备份表">
            <Input placeholder="留空则备份所有表" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BackupManagement;
