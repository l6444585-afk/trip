import React, { useState } from 'react';
import {
  Card, Table, Button, Input, Space, Tag, Modal, Descriptions,
  Form, Select, message, Popconfirm, DatePicker, InputNumber, Divider,
} from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, CheckOutlined, CloseOutlined, RollbackOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useTableData from './hooks/useTableData';
import PageContainer from './components/PageContainer';
import { adminOrderService } from '../../services/adminApi';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const orderStatusMap = {
  pending: { color: 'orange', text: '待确认' },
  confirmed: { color: 'blue', text: '已确认' },
  paid: { color: 'cyan', text: '已支付' },
  completed: { color: 'green', text: '已完成' },
  cancelled: { color: 'default', text: '已取消' },
  refunded: { color: 'red', text: '已退款' },
};

const paymentStatusMap = {
  unpaid: { color: 'default', text: '未支付' },
  paid: { color: 'green', text: '已支付' },
  refunded: { color: 'red', text: '已退款' },
};

const renderTag = (map, status) => {
  const c = map[status] || { color: 'default', text: status };
  return <Tag color={c.color}>{c.text}</Tag>;
};

const OrderManagement = () => {
  const { loading, data, filters, updateFilter, pagination, search, reset, refresh } = useTableData(
    adminOrderService.getOrders,
    { initialFilters: { keyword: '', status: '', payment_status: '', start_date: null, end_date: null } }
  );
  const [selected, setSelected] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [refundVisible, setRefundVisible] = useState(false);
  const [refundForm] = Form.useForm();

  const handleViewDetail = async (order) => {
    try {
      const detail = await adminOrderService.getOrderDetail(order.id);
      setSelected(detail);
      setDetailVisible(true);
    } catch { message.error('获取订单详情失败'); }
  };

  const handleUpdateStatus = async (id, status) => {
    try { await adminOrderService.updateOrderStatus(id, status); message.success('状态更新成功'); refresh(); }
    catch { message.error('状态更新失败'); }
  };

  const handleRefund = (order) => { setSelected(order); refundForm.resetFields(); refundForm.setFieldsValue({ refund_amount: order.paid_amount }); setRefundVisible(true); };

  const submitRefund = async (values) => {
    try {
      await adminOrderService.processRefund(selected.id, values.refund_reason, values.refund_amount);
      message.success('退款处理成功');
      setRefundVisible(false);
      refresh();
    } catch (error) { message.error(error.response?.data?.detail || '退款处理失败'); }
  };

  const columns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 170 },
    { title: '订单标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '用户', dataIndex: 'user', key: 'user', width: 90, render: (u) => u?.username || '-' },
    { title: '金额', dataIndex: 'total_amount', key: 'total_amount', width: 90, render: (v) => <span style={{ color: '#EF4444', fontWeight: 600 }}>¥{v}</span>, sorter: (a, b) => a.total_amount - b.total_amount },
    { title: '支付状态', dataIndex: 'payment_status', key: 'payment_status', width: 90, render: (s) => renderTag(paymentStatusMap, s) },
    { title: '订单状态', dataIndex: 'status', key: 'status', width: 90, render: (s) => renderTag(orderStatusMap, s) },
    { title: '联系人', dataIndex: 'contact_name', key: 'contact_name', width: 90 },
    { title: '联系电话', dataIndex: 'contact_phone', key: 'contact_phone', width: 120 },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 150, render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'), sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at) },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)}>详情</Button>
          {r.status === 'pending' && (
            <>
              <Popconfirm title="确定确认？" onConfirm={() => handleUpdateStatus(r.id, 'confirmed')}><Button type="link" size="small" icon={<CheckOutlined />}>确认</Button></Popconfirm>
              <Popconfirm title="确定取消？" onConfirm={() => handleUpdateStatus(r.id, 'cancelled')}><Button type="link" size="small" danger icon={<CloseOutlined />}>取消</Button></Popconfirm>
            </>
          )}
          {r.payment_status === 'paid' && r.status !== 'refunded' && (
            <Button type="link" size="small" danger icon={<RollbackOutlined />} onClick={() => handleRefund(r)}>退款</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="订单管理" subtitle="管理用户订单和交易记录">
      <Card className="admin-filter-card">
        <div className="filter-row">
          <Space wrap size={12}>
            <Input placeholder="搜索订单号/标题/联系人" prefix={<SearchOutlined />} value={filters.keyword}
              onChange={(e) => updateFilter('keyword', e.target.value)} onPressEnter={search} style={{ width: 220 }} allowClear />
            <Select placeholder="订单状态" value={filters.status || undefined} onChange={(v) => updateFilter('status', v)} allowClear style={{ width: 120 }}
              options={Object.entries(orderStatusMap).map(([k, v]) => ({ value: k, label: v.text }))} />
            <Select placeholder="支付状态" value={filters.payment_status || undefined} onChange={(v) => updateFilter('payment_status', v)} allowClear style={{ width: 120 }}
              options={Object.entries(paymentStatusMap).map(([k, v]) => ({ value: k, label: v.text }))} />
            <RangePicker value={filters.start_date && filters.end_date ? [dayjs(filters.start_date), dayjs(filters.end_date)] : null}
              onChange={(dates) => { updateFilter('start_date', dates ? dates[0].format('YYYY-MM-DD') : null); updateFilter('end_date', dates ? dates[1].format('YYYY-MM-DD') : null); }} />
            <Button type="primary" icon={<SearchOutlined />} onClick={search}>搜索</Button>
            <Button icon={<ReloadOutlined />} onClick={reset}>重置</Button>
          </Space>
        </div>
      </Card>
      <Card className="admin-table-card">
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: 1400 }} pagination={pagination} />
      </Card>

      <Modal title="订单详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={800}>
        {selected && (
          <>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="订单号">{selected.order_no}</Descriptions.Item>
              <Descriptions.Item label="订单状态">{renderTag(orderStatusMap, selected.status)}</Descriptions.Item>
              <Descriptions.Item label="订单标题" span={2}>{selected.title}</Descriptions.Item>
              <Descriptions.Item label="订单金额"><span style={{ color: '#EF4444', fontWeight: 600 }}>¥{selected.total_amount}</span></Descriptions.Item>
              <Descriptions.Item label="已付金额"><span style={{ color: '#16A34A', fontWeight: 600 }}>¥{selected.paid_amount}</span></Descriptions.Item>
              <Descriptions.Item label="支付状态">{renderTag(paymentStatusMap, selected.payment_status)}</Descriptions.Item>
              <Descriptions.Item label="支付方式">{selected.payment_method || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系人">{selected.contact_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{selected.contact_phone}</Descriptions.Item>
              <Descriptions.Item label="出行日期">{selected.travel_date ? dayjs(selected.travel_date).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
              <Descriptions.Item label="出行人数">{selected.traveler_count}人</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(selected.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="支付时间">{selected.payment_time ? dayjs(selected.payment_time).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
            </Descriptions>
            {selected.special_requests && <><h4 style={{ marginTop: 16 }}>特殊要求</h4><p>{selected.special_requests}</p></>}
            {selected.refund_status !== 'none' && (
              <>
                <Divider />
                <h4>退款信息</h4>
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="退款状态">{selected.refund_status === 'refunded' ? <Tag color="red">已退款</Tag> : <Tag color="orange">退款中</Tag>}</Descriptions.Item>
                  <Descriptions.Item label="退款金额">¥{selected.refund_amount}</Descriptions.Item>
                  <Descriptions.Item label="退款原因" span={2}>{selected.refund_reason}</Descriptions.Item>
                  <Descriptions.Item label="退款时间" span={2}>{selected.refund_time ? dayjs(selected.refund_time).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
                </Descriptions>
              </>
            )}
          </>
        )}
      </Modal>

      <Modal title="订单退款" open={refundVisible} onCancel={() => setRefundVisible(false)} onOk={() => refundForm.submit()}>
        <Form form={refundForm} onFinish={submitRefund} layout="vertical">
          <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="订单号">{selected?.order_no}</Descriptions.Item>
            <Descriptions.Item label="已付金额"><span style={{ color: '#16A34A', fontWeight: 600 }}>¥{selected?.paid_amount}</span></Descriptions.Item>
          </Descriptions>
          <Form.Item name="refund_reason" label="退款原因" rules={[{ required: true, message: '请输入' }]}>
            <TextArea rows={3} placeholder="退款原因" />
          </Form.Item>
          <Form.Item name="refund_amount" label="退款金额" rules={[{ required: true, message: '请输入' }]}>
            <InputNumber prefix="¥" min={0} max={selected?.paid_amount} precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default OrderManagement;
