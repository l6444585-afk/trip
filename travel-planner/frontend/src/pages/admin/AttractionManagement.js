import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Input, Space, Tag, Modal, Form, Select,
  message, Popconfirm, InputNumber,
} from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useTableData from './hooks/useTableData';
import PageContainer from './components/PageContainer';
import { adminAttractionService } from '../../services/adminApi';

const { TextArea } = Input;

const AttractionManagement = () => {
  const { loading, data, filters, updateFilter, pagination, search, reset, refresh } = useTableData(
    adminAttractionService.getAttractions,
    { initialFilters: { keyword: '', city: '', category: '' } }
  );
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    adminAttractionService.getCities().then(setCities).catch(() => {});
    adminAttractionService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleCreate = () => { setEditing(null); form.resetFields(); setModalVisible(true); };
  const handleEdit = (item) => { setEditing(item); form.setFieldsValue(item); setModalVisible(true); };

  const handleDelete = async (id) => {
    try { await adminAttractionService.deleteAttraction(id); message.success('删除成功'); refresh(); }
    catch { message.error('删除失败'); }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) { await adminAttractionService.updateAttraction(editing.id, values); message.success('更新成功'); }
      else { await adminAttractionService.createAttraction(values); message.success('创建成功'); }
      setModalVisible(false);
      refresh();
    } catch { message.error(editing ? '更新失败' : '创建失败'); }
  };

  const cityOptions = cities.map((c) => ({ value: c.name, label: c.name }));
  const catOptions = categories.map((c) => ({ value: c, label: c }));

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '景点名称', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: '城市', dataIndex: 'city', key: 'city', width: 90 },
    { title: '分类', dataIndex: 'category', key: 'category', width: 90, render: (t) => t ? <Tag color="blue">{t}</Tag> : '-' },
    { title: '评分', dataIndex: 'rating', key: 'rating', width: 70, sorter: (a, b) => a.rating - b.rating, render: (v) => v?.toFixed(1) || '-' },
    { title: '人气', dataIndex: 'popularity', key: 'popularity', width: 70, sorter: (a, b) => a.popularity - b.popularity },
    { title: '门票', dataIndex: 'ticket_price', key: 'ticket_price', width: 80, render: (v) => v ? `¥${v}` : '免费' },
    { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 150, render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作', key: 'action', width: 160, fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
          <Popconfirm title="确定要删除该景点吗？" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="景点管理" subtitle="管理江浙沪地区旅游景点信息"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增景点</Button>}>
      <Card className="admin-filter-card">
        <div className="filter-row">
          <Space wrap size={12}>
            <Input placeholder="搜索景点名称" prefix={<SearchOutlined />} value={filters.keyword}
              onChange={(e) => updateFilter('keyword', e.target.value)} onPressEnter={search} style={{ width: 200 }} allowClear />
            <Select placeholder="选择城市" value={filters.city || undefined} onChange={(v) => updateFilter('city', v)} allowClear style={{ width: 120 }} options={cityOptions} />
            <Select placeholder="选择分类" value={filters.category || undefined} onChange={(v) => updateFilter('category', v)} allowClear style={{ width: 120 }} options={catOptions} />
            <Button type="primary" icon={<SearchOutlined />} onClick={search}>搜索</Button>
            <Button icon={<ReloadOutlined />} onClick={reset}>重置</Button>
          </Space>
        </div>
      </Card>
      <Card className="admin-table-card">
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: 1100 }} pagination={pagination} />
      </Card>

      <Modal title={editing ? '编辑景点' : '新增景点'} open={modalVisible} onCancel={() => setModalVisible(false)} onOk={handleSubmit} width={720} destroyOnClose>
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="name" label="景点名称" rules={[{ required: true, message: '请输入' }]} style={{ width: 280 }}><Input placeholder="景点名称" /></Form.Item>
            <Form.Item name="city" label="所在城市" rules={[{ required: true, message: '请选择' }]} style={{ width: 180 }}><Select placeholder="选择城市" options={cityOptions} /></Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="category" label="分类" style={{ width: 180 }}><Select placeholder="选择分类" options={catOptions} allowClear /></Form.Item>
            <Form.Item name="rating" label="评分" style={{ width: 120 }}><InputNumber min={0} max={5} step={0.1} placeholder="0-5" style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="popularity" label="人气值" style={{ width: 120 }}><InputNumber min={0} placeholder="人气值" style={{ width: '100%' }} /></Form.Item>
          </Space>
          <Form.Item name="description" label="景点描述"><TextArea rows={3} placeholder="景点描述" /></Form.Item>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="address" label="详细地址" style={{ width: 360 }}><Input placeholder="详细地址" /></Form.Item>
            <Form.Item name="ticket_price" label="门票价格" style={{ width: 140 }}><InputNumber min={0} prefix="¥" style={{ width: '100%' }} /></Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="latitude" label="纬度" style={{ width: 160 }}><InputNumber placeholder="纬度" style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="longitude" label="经度" style={{ width: 160 }}><InputNumber placeholder="经度" style={{ width: '100%' }} /></Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="open_time" label="开放时间" style={{ width: 140 }}><Input placeholder="如 08:00" /></Form.Item>
            <Form.Item name="close_time" label="关闭时间" style={{ width: 140 }}><Input placeholder="如 18:00" /></Form.Item>
            <Form.Item name="avg_visit_duration" label="建议游览时长(分钟)" style={{ width: 180 }}><InputNumber min={0} placeholder="分钟" style={{ width: '100%' }} /></Form.Item>
          </Space>
          <Form.Item name="tips" label="游览提示"><TextArea rows={2} placeholder="游览提示" /></Form.Item>
          <Form.Item name="image_url" label="图片URL"><Input placeholder="图片URL" /></Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default AttractionManagement;
