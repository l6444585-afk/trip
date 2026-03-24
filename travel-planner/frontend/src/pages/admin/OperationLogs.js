import React from 'react';
import { Card, Table, Button, Input, Space, Tag, Select, DatePicker } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useTableData from './hooks/useTableData';
import PageContainer from './components/PageContainer';
import { adminSystemService } from '../../services/adminApi';

const { RangePicker } = DatePicker;

const moduleColors = { user: 'blue', itinerary: 'green', attraction: 'orange', order: 'purple', system: 'red', admin: 'cyan' };
const actionColors = { create: 'green', update: 'blue', delete: 'red', login: 'cyan', logout: 'default', review: 'purple', publish: 'gold', refund: 'orange' };

const OperationLogs = () => {
  const { loading, data, filters, updateFilter, pagination, search, reset } = useTableData(
    adminSystemService.getOperationLogs,
    { initialFilters: { module: '', action: '', operator: '', start_date: null, end_date: null } }
  );

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '操作人', dataIndex: 'operator_name', key: 'operator_name', width: 100 },
    { title: 'IP地址', dataIndex: 'operator_ip', key: 'operator_ip', width: 120 },
    { title: '模块', dataIndex: 'module', key: 'module', width: 80, render: (m) => <Tag color={moduleColors[m] || 'default'}>{m}</Tag> },
    { title: '操作', dataIndex: 'action', key: 'action', width: 80, render: (a) => <Tag color={actionColors[a] || 'default'}>{a}</Tag> },
    {
      title: '目标', dataIndex: 'target_name', key: 'target_name', ellipsis: true,
      render: (text, r) => <span>{r.target_type && <Tag>{r.target_type}</Tag>}{text}</span>,
    },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', width: 70, render: (s) => <Tag color={s === 1 ? 'green' : 'red'}>{s === 1 ? '成功' : '失败'}</Tag> },
    { title: '耗时', dataIndex: 'duration_ms', key: 'duration_ms', width: 70, render: (ms) => ms ? `${ms}ms` : '-' },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 160, render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm:ss'), sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at) },
  ];

  return (
    <PageContainer title="操作日志" subtitle="查看系统操作记录">
      <Card className="admin-filter-card">
        <div className="filter-row">
          <Space wrap size={12}>
            <Select placeholder="选择模块" value={filters.module || undefined} onChange={(v) => updateFilter('module', v)} allowClear style={{ width: 120 }}
              options={[{ value: 'user', label: '用户' }, { value: 'itinerary', label: '行程' }, { value: 'attraction', label: '景点' }, { value: 'order', label: '订单' }, { value: 'system', label: '系统' }, { value: 'admin', label: '管理' }]} />
            <Select placeholder="选择操作" value={filters.action || undefined} onChange={(v) => updateFilter('action', v)} allowClear style={{ width: 120 }}
              options={[{ value: 'create', label: '创建' }, { value: 'update', label: '更新' }, { value: 'delete', label: '删除' }, { value: 'login', label: '登录' }, { value: 'review', label: '审核' }, { value: 'publish', label: '发布' }, { value: 'refund', label: '退款' }]} />
            <Input placeholder="操作人" value={filters.operator} onChange={(e) => updateFilter('operator', e.target.value)} style={{ width: 120 }} allowClear />
            <RangePicker value={filters.start_date && filters.end_date ? [dayjs(filters.start_date), dayjs(filters.end_date)] : null}
              onChange={(dates) => { updateFilter('start_date', dates ? dates[0].format('YYYY-MM-DD') : null); updateFilter('end_date', dates ? dates[1].format('YYYY-MM-DD') : null); }} />
            <Button type="primary" icon={<SearchOutlined />} onClick={search}>搜索</Button>
            <Button icon={<ReloadOutlined />} onClick={reset}>重置</Button>
          </Space>
        </div>
      </Card>
      <Card className="admin-table-card">
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: 1200 }} pagination={pagination} />
      </Card>
    </PageContainer>
  );
};

export default OperationLogs;
