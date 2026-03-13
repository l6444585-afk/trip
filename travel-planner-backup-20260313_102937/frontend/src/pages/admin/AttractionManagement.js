import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Input, Space, Tag, Modal, Form, Select,
  message, Popconfirm, DatePicker, Upload, Image, InputNumber, Switch
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, PlusOutlined, EditOutlined,
  DeleteOutlined, EnvironmentOutlined, PictureOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminAttractionService } from '../../services/adminApi';

const { TextArea } = Input;

const AttractionManagement = () => {
  const [loading, setLoading] = useState(false);
  const [attractions, setAttractions] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAttraction, setEditingAttraction] = useState(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    keyword: '',
    city: '',
    category: '',
  });

  useEffect(() => {
    fetchAttractions();
    fetchCities();
    fetchCategories();
  }, [page, pageSize]);

  const fetchAttractions = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        ...filters,
      };
      const result = await adminAttractionService.getAttractions(params);
      setAttractions(result.items);
      setTotal(result.total);
    } catch (error) {
      message.error('获取景点列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const result = await adminAttractionService.getCities();
      setCities(result);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await adminAttractionService.getCategories();
      setCategories(result);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchAttractions();
  };

  const handleReset = () => {
    setFilters({
      keyword: '',
      city: '',
      category: '',
    });
    setPage(1);
    setTimeout(fetchAttractions, 0);
  };

  const handleCreate = () => {
    setEditingAttraction(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (attraction) => {
    setEditingAttraction(attraction);
    form.setFieldsValue({
      ...attraction,
    });
    setModalVisible(true);
  };

  const handleDelete = async (attractionId) => {
    try {
      await adminAttractionService.deleteAttraction(attractionId);
      message.success('删除成功');
      fetchAttractions();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingAttraction) {
        await adminAttractionService.updateAttraction(editingAttraction.id, values);
        message.success('更新成功');
      } else {
        await adminAttractionService.createAttraction(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchAttractions();
    } catch (error) {
      message.error(editingAttraction ? '更新失败' : '创建失败');
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
      title: '景点名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 100,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (text) => text ? <Tag color="blue">{text}</Tag> : '-',
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 80,
      sorter: (a, b) => a.rating - b.rating,
      render: (val) => val?.toFixed(1) || '-',
    },
    {
      title: '人气',
      dataIndex: 'popularity',
      key: 'popularity',
      width: 80,
      sorter: (a, b) => a.popularity - b.popularity,
    },
    {
      title: '门票',
      dataIndex: 'ticket_price',
      key: 'ticket_price',
      width: 100,
      render: (val) => val ? `¥${val}` : '免费',
    },
    {
      title: '媒体',
      dataIndex: 'media_count',
      key: 'media_count',
      width: 80,
      render: (count) => (
        <Space>
          <PictureOutlined />
          {count || 0}
        </Space>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 160,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
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
          <Popconfirm
            title="确定要删除该景点吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="attraction-management">
      <div className="page-header">
        <h1 className="page-title">景点管理</h1>
        <p className="page-subtitle">管理江浙沪地区旅游景点信息</p>
      </div>

      <Card className="filter-card">
        <div className="action-bar">
          <Space wrap>
            <Input
              placeholder="搜索景点名称"
              prefix={<SearchOutlined />}
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              onPressEnter={handleSearch}
              style={{ width: 200 }}
            />
            <Select
              placeholder="选择城市"
              value={filters.city || undefined}
              onChange={(value) => setFilters({ ...filters, city: value })}
              allowClear
              style={{ width: 120 }}
              options={cities.map((c) => ({ value: c.name, label: c.name }))}
            />
            <Select
              placeholder="选择分类"
              value={filters.category || undefined}
              onChange={(value) => setFilters({ ...filters, category: value })}
              allowClear
              style={{ width: 120 }}
              options={categories.map((c) => ({ value: c, label: c }))}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增景点
          </Button>
        </div>
      </Card>

      <Card className="table-card">
        <Table
          columns={columns}
          dataSource={attractions}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
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
        title={editingAttraction ? '编辑景点' : '新增景点'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="modal-form">
          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="name"
              label="景点名称"
              rules={[{ required: true, message: '请输入景点名称' }]}
              style={{ width: 300 }}
            >
              <Input placeholder="请输入景点名称" />
            </Form.Item>
            <Form.Item
              name="city"
              label="所在城市"
              rules={[{ required: true, message: '请选择城市' }]}
              style={{ width: 200 }}
            >
              <Select
                placeholder="选择城市"
                options={cities.map((c) => ({ value: c.name, label: c.name }))}
              />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="category" label="分类" style={{ width: 200 }}>
              <Select
                placeholder="选择分类"
                options={categories.map((c) => ({ value: c, label: c }))}
                allowClear
              />
            </Form.Item>
            <Form.Item name="rating" label="评分" style={{ width: 150 }}>
              <InputNumber min={0} max={5} step={0.1} placeholder="0-5" />
            </Form.Item>
            <Form.Item name="popularity" label="人气值" style={{ width: 150 }}>
              <InputNumber min={0} placeholder="人气值" />
            </Form.Item>
          </Space>

          <Form.Item name="description" label="景点描述">
            <TextArea rows={3} placeholder="请输入景点描述" />
          </Form.Item>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="address" label="详细地址" style={{ width: 400 }}>
              <Input placeholder="请输入详细地址" />
            </Form.Item>
            <Form.Item name="ticket_price" label="门票价格" style={{ width: 150 }}>
              <InputNumber min={0} prefix="¥" placeholder="门票价格" />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="latitude" label="纬度" style={{ width: 200 }}>
              <InputNumber placeholder="纬度" />
            </Form.Item>
            <Form.Item name="longitude" label="经度" style={{ width: 200 }}>
              <InputNumber placeholder="经度" />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="open_time" label="开放时间" style={{ width: 150 }}>
              <Input placeholder="如 08:00" />
            </Form.Item>
            <Form.Item name="close_time" label="关闭时间" style={{ width: 150 }}>
              <Input placeholder="如 18:00" />
            </Form.Item>
            <Form.Item name="avg_visit_duration" label="建议游览时长(分钟)" style={{ width: 200 }}>
              <InputNumber min={0} placeholder="分钟" />
            </Form.Item>
          </Space>

          <Form.Item name="tips" label="游览提示">
            <TextArea rows={2} placeholder="请输入游览提示" />
          </Form.Item>

          <Form.Item name="image_url" label="图片URL">
            <Input placeholder="请输入图片URL" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AttractionManagement;
