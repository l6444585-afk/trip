import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Input, Space, Tag, Select, DatePicker, Descriptions
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminSystemService } from '../../services/adminApi';

const { RangePicker } = DatePicker;

const OperationLogs = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    module: '',
    action: '',
    operator: '',
    start_date: null,
    end_date: null,
  });

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        ...filters,
      };
      const result = await adminSystemService.getOperationLogs(params);
      setLogs(result.items);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const handleReset = () => {
    setFilters({
      module: '',
      action: '',
      operator: '',
      start_date: null,
      end_date: null,
    });
    setPage(1);
    setTimeout(fetchLogs, 0);
  };

  const getModuleTag = (module) => {
    const colors = {
      user: 'blue',
      itinerary: 'green',
      attraction: 'orange',
      order: 'purple',
      system: 'red',
      admin: 'cyan',
    };
    return <Tag color={colors[module] || 'default'}>{module}</Tag>;
  };

  const getActionTag = (action) => {
    const colors = {
      create: 'green',
      update: 'blue',
      delete: 'red',
      login: 'cyan',
      logout: 'default',
      review: 'purple',
      publish: 'gold',
      refund: 'orange',
    };
    return <Tag color={colors[action] || 'default'}>{action}</Tag>;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '操作人',
      dataIndex: 'operator_name',
      key: 'operator_name',
      width: 120,
    },
    {
      title: 'IP地址',
      dataIndex: 'operator_ip',
      key: 'operator_ip',
      width: 130,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 100,
      render: (module) => getModuleTag(module),
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action) => getActionTag(action),
    },
    {
      title: '目标',
      dataIndex: 'target_name',
      key: 'target_name',
      ellipsis: true,
      render: (text, record) => (
        <span>
          {record.target_type && <Tag>{record.target_type}</Tag>}
          {text}
        </span>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '耗时',
      dataIndex: 'duration_ms',
      key: 'duration_ms',
      width: 80,
      render: (ms) => (ms ? `${ms}ms` : '-'),
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
  ];

  return (
    <div className="operation-logs">
      <div className="page-header">
        <h1 className="page-title">操作日志</h1>
        <p className="page-subtitle">查看系统操作记录</p>
      </div>

      <Card className="filter-card">
        <Space wrap>
          <Select
            placeholder="选择模块"
            value={filters.module || undefined}
            onChange={(value) => setFilters({ ...filters, module: value })}
            allowClear
            style={{ width: 120 }}
            options={[
              { value: 'user', label: '用户' },
              { value: 'itinerary', label: '行程' },
              { value: 'attraction', label: '景点' },
              { value: 'order', label: '订单' },
              { value: 'system', label: '系统' },
              { value: 'admin', label: '管理' },
            ]}
          />
          <Select
            placeholder="选择操作"
            value={filters.action || undefined}
            onChange={(value) => setFilters({ ...filters, action: value })}
            allowClear
            style={{ width: 120 }}
            options={[
              { value: 'create', label: '创建' },
              { value: 'update', label: '更新' },
              { value: 'delete', label: '删除' },
              { value: 'login', label: '登录' },
              { value: 'review', label: '审核' },
              { value: 'publish', label: '发布' },
              { value: 'refund', label: '退款' },
            ]}
          />
          <Input
            placeholder="操作人"
            value={filters.operator}
            onChange={(e) => setFilters({ ...filters, operator: e.target.value })}
            style={{ width: 120 }}
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
          dataSource={logs}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
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
    </div>
  );
};

export default OperationLogs;
