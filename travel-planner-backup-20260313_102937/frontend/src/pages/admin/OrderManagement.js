import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Input, Space, Tag, Modal, Descriptions,
  Form, Select, message, Popconfirm, DatePicker, Steps, InputNumber, Divider
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, EyeOutlined, CheckOutlined,
  CloseOutlined, DollarOutlined, RollbackOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminOrderService } from '../../services/adminApi';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const OrderManagement = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [refundVisible, setRefundVisible] = useState(false);
  const [refundForm] = Form.useForm();
  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
    payment_status: '',
    user_id: null,
    start_date: null,
    end_date: null,
  });

  useEffect(() => {
    fetchOrders();
  }, [page, pageSize]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        ...filters,
      };
      const result = await adminOrderService.getOrders(params);
      setOrders(result.items);
      setTotal(result.total);
    } catch (error) {
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  const handleReset = () => {
    setFilters({
      keyword: '',
      status: '',
      payment_status: '',
      user_id: null,
      start_date: null,
      end_date: null,
    });
    setPage(1);
    setTimeout(fetchOrders, 0);
  };

  const handleViewDetail = async (order) => {
    try {
      const detail = await adminOrderService.getOrderDetail(order.id);
      setSelectedOrder(detail);
      setDetailVisible(true);
    } catch (error) {
      message.error('获取订单详情失败');
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await adminOrderService.updateOrderStatus(orderId, status);
      message.success('状态更新成功');
      fetchOrders();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const handleRefund = (order) => {
    setSelectedOrder(order);
    refundForm.resetFields();
    refundForm.setFieldsValue({ refund_amount: order.paid_amount });
    setRefundVisible(true);
  };

  const submitRefund = async (values) => {
    try {
      await adminOrderService.processRefund(
        selectedOrder.id,
        values.refund_reason,
        values.refund_amount
      );
      message.success('退款处理成功');
      setRefundVisible(false);
      fetchOrders();
    } catch (error) {
      message.error(error.response?.data?.detail || '退款处理失败');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待确认' },
      confirmed: { color: 'blue', text: '已确认' },
      paid: { color: 'cyan', text: '已支付' },
      completed: { color: 'green', text: '已完成' },
      cancelled: { color: 'default', text: '已取消' },
      refunded: { color: 'red', text: '已退款' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getPaymentTag = (status) => {
    const statusMap = {
      unpaid: { color: 'default', text: '未支付' },
      paid: { color: 'green', text: '已支付' },
      refunded: { color: 'red', text: '已退款' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
      render: (text) => <a>{text}</a>,
    },
    {
      title: '订单标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
      width: 100,
      render: (user) => user?.username || '-',
    },
    {
      title: '金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 100,
      render: (val) => <span style={{ color: '#f5222d', fontWeight: 500 }}>¥{val}</span>,
      sorter: (a, b) => a.total_amount - b.total_amount,
    },
    {
      title: '支付状态',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 100,
      render: (status) => getPaymentTag(status),
      filters: [
        { text: '未支付', value: 'unpaid' },
        { text: '已支付', value: 'paid' },
        { text: '已退款', value: 'refunded' },
      ],
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
      filters: [
        { text: '待确认', value: 'pending' },
        { text: '已确认', value: 'confirmed' },
        { text: '已支付', value: 'paid' },
        { text: '已完成', value: 'completed' },
        { text: '已取消', value: 'cancelled' },
        { text: '已退款', value: 'refunded' },
      ],
    },
    {
      title: '联系人',
      dataIndex: 'contact_name',
      key: 'contact_name',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'contact_phone',
      key: 'contact_phone',
      width: 130,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="确定要确认该订单吗？"
                onConfirm={() => handleUpdateStatus(record.id, 'confirmed')}
              >
                <Button type="link" size="small" icon={<CheckOutlined />}>
                  确认
                </Button>
              </Popconfirm>
              <Popconfirm
                title="确定要取消该订单吗？"
                onConfirm={() => handleUpdateStatus(record.id, 'cancelled')}
              >
                <Button type="link" size="small" danger icon={<CloseOutlined />}>
                  取消
                </Button>
              </Popconfirm>
            </>
          )}
          {record.payment_status === 'paid' && record.status !== 'refunded' && (
            <Button
              type="link"
              size="small"
              danger
              icon={<RollbackOutlined />}
              onClick={() => handleRefund(record)}
            >
              退款
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="order-management">
      <div className="page-header">
        <h1 className="page-title">订单管理</h1>
        <p className="page-subtitle">管理用户订单和交易记录</p>
      </div>

      <Card className="filter-card">
        <Space wrap>
          <Input
            placeholder="搜索订单号/标题/联系人"
            prefix={<SearchOutlined />}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            onPressEnter={handleSearch}
            style={{ width: 220 }}
          />
          <Select
            placeholder="订单状态"
            value={filters.status || undefined}
            onChange={(value) => setFilters({ ...filters, status: value })}
            allowClear
            style={{ width: 120 }}
            options={[
              { value: 'pending', label: '待确认' },
              { value: 'confirmed', label: '已确认' },
              { value: 'paid', label: '已支付' },
              { value: 'completed', label: '已完成' },
              { value: 'cancelled', label: '已取消' },
              { value: 'refunded', label: '已退款' },
            ]}
          />
          <Select
            placeholder="支付状态"
            value={filters.payment_status || undefined}
            onChange={(value) => setFilters({ ...filters, payment_status: value })}
            allowClear
            style={{ width: 120 }}
            options={[
              { value: 'unpaid', label: '未支付' },
              { value: 'paid', label: '已支付' },
              { value: 'refunded', label: '已退款' },
            ]}
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
          dataSource={orders}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
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
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedOrder && (
          <>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="订单号">{selectedOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="订单状态">
                {getStatusTag(selectedOrder.status)}
              </Descriptions.Item>
              <Descriptions.Item label="订单标题" span={2}>
                {selectedOrder.title}
              </Descriptions.Item>
              <Descriptions.Item label="订单金额">
                <span style={{ color: '#f5222d', fontWeight: 500 }}>
                  ¥{selectedOrder.total_amount}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="已付金额">
                <span style={{ color: '#52c41a', fontWeight: 500 }}>
                  ¥{selectedOrder.paid_amount}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="支付状态">
                {getPaymentTag(selectedOrder.payment_status)}
              </Descriptions.Item>
              <Descriptions.Item label="支付方式">
                {selectedOrder.payment_method || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="联系人">{selectedOrder.contact_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{selectedOrder.contact_phone}</Descriptions.Item>
              <Descriptions.Item label="联系邮箱">{selectedOrder.contact_email}</Descriptions.Item>
              <Descriptions.Item label="出行日期">
                {selectedOrder.travel_date
                  ? dayjs(selectedOrder.travel_date).format('YYYY-MM-DD')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="出行人数">{selectedOrder.traveler_count}人</Descriptions.Item>
              <Descriptions.Item label="用户">
                {selectedOrder.user?.username || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="关联行程">
                {selectedOrder.itinerary?.title || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedOrder.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="支付时间">
                {selectedOrder.payment_time
                  ? dayjs(selectedOrder.payment_time).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
            </Descriptions>

            {selectedOrder.special_requests && (
              <>
                <h4 style={{ marginTop: 16 }}>特殊要求</h4>
                <p>{selectedOrder.special_requests}</p>
              </>
            )}

            {selectedOrder.refund_status !== 'none' && (
              <>
                <Divider />
                <h4>退款信息</h4>
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="退款状态">
                    {selectedOrder.refund_status === 'refunded' ? (
                      <Tag color="red">已退款</Tag>
                    ) : (
                      <Tag color="orange">退款中</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="退款金额">
                    ¥{selectedOrder.refund_amount}
                  </Descriptions.Item>
                  <Descriptions.Item label="退款原因" span={2}>
                    {selectedOrder.refund_reason}
                  </Descriptions.Item>
                  <Descriptions.Item label="退款时间" span={2}>
                    {selectedOrder.refund_time
                      ? dayjs(selectedOrder.refund_time).format('YYYY-MM-DD HH:mm:ss')
                      : '-'}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </>
        )}
      </Modal>

      <Modal
        title="订单退款"
        open={refundVisible}
        onCancel={() => setRefundVisible(false)}
        onOk={() => refundForm.submit()}
      >
        <Form form={refundForm} onFinish={submitRefund} layout="vertical">
          <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="订单号">{selectedOrder?.order_no}</Descriptions.Item>
            <Descriptions.Item label="已付金额">
              <span style={{ color: '#52c41a', fontWeight: 500 }}>
                ¥{selectedOrder?.paid_amount}
              </span>
            </Descriptions.Item>
          </Descriptions>
          <Form.Item
            name="refund_reason"
            label="退款原因"
            rules={[{ required: true, message: '请输入退款原因' }]}
          >
            <TextArea rows={3} placeholder="请输入退款原因" />
          </Form.Item>
          <Form.Item
            name="refund_amount"
            label="退款金额"
            rules={[{ required: true, message: '请输入退款金额' }]}
          >
            <InputNumber
              prefix="¥"
              min={0}
              max={selectedOrder?.paid_amount}
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderManagement;
