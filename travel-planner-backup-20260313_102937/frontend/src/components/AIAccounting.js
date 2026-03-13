/**
 * AI智能记账组件
 * 集成到江浙沪旅游行程规划系统中
 * @module components/AIAccounting
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Modal, Form, Input, InputNumber, Select, DatePicker,
  Tabs, Statistic, Progress, Tag, Timeline, Empty, message, Row, Col,
  Typography, Divider, Badge, Tooltip, Popover, List, Avatar, Space,
  Drawer, Radio, Upload, Switch
} from 'antd';
import {
  PlusOutlined, CameraOutlined, AudioOutlined, PieChartOutlined,
  WalletOutlined, TrendingUpOutlined, TrendingDownOutlined, DollarOutlined,
  ShoppingOutlined, CoffeeOutlined, CarOutlined, HomeOutlined, FileTextOutlined,
  MoreOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CloseOutlined,
  CheckCircleOutlined, WarningOutlined, BulbOutlined, RobotOutlined,
  BarChartOutlined, LineChartOutlined, CalendarOutlined, TagOutlined,
  CreditCardOutlined, MoneyCollectOutlined, AlipayOutlined, WechatOutlined,
  BankOutlined, GiftOutlined, ScanOutlined, SoundOutlined,
  ArrowUpOutlined, ArrowDownOutlined, SyncOutlined, FilterOutlined,
  ExportOutlined, PrinterOutlined, ShareAltOutlined, SettingOutlined,
  InfoCircleOutlined, QuestionCircleOutlined, ThunderboltOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title: TypographyTitle, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

// 消费类别配置
const EXPENSE_CATEGORIES = {
  food: { name: '餐饮', icon: <CoffeeOutlined />, color: '#fa8c16', bgColor: '#fff7e6', borderColor: '#ffd591' },
  transport: { name: '交通', icon: <CarOutlined />, color: '#1890ff', bgColor: '#e6f7ff', borderColor: '#91d5ff' },
  accommodation: { name: '住宿', icon: <HomeOutlined />, color: '#722ed1', bgColor: '#f9f0ff', borderColor: '#d3adf7' },
  attraction: { name: '景点', icon: <FileTextOutlined />, color: '#52c41a', bgColor: '#f6ffed', borderColor: '#b7eb8f' },
  shopping: { name: '购物', icon: <ShoppingOutlined />, color: '#eb2f96', bgColor: '#fff0f6', borderColor: '#ffadd2' },
  other: { name: '其他', icon: <MoreOutlined />, color: '#8c8c8c', bgColor: '#f5f5f5', borderColor: '#d9d9d9' }
};

// 支付方式配置
const PAYMENT_METHODS = {
  alipay: { name: '支付宝', icon: <AlipayOutlined />, color: '#1677ff' },
  wechat: { name: '微信支付', icon: <WechatOutlined />, color: '#52c41a' },
  cash: { name: '现金', icon: <MoneyCollectOutlined />, color: '#faad14' },
  card: { name: '银行卡', icon: <CreditCardOutlined />, color: '#722ed1' },
  other: { name: '其他', icon: <MoreOutlined />, color: '#8c8c8c' }
};

/**
 * AI智能记账组件
 * @param {Object} props - 组件属性
 * @param {number} props.initialBudget - 初始预算
 * @param {string} props.tripId - 行程ID
 * @param {Function} props.onBudgetUpdate - 预算更新回调
 * @param {boolean} props.compact - 是否紧凑模式
 */
const AIAccounting = ({
  initialBudget = 5000,
  tripId = null,
  onBudgetUpdate = null,
  compact = false,
  onBack = null
}) => {
  // 状态管理
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState({
    total: initialBudget,
    categories: {
      food: Math.round(initialBudget * 0.20),
      transport: Math.round(initialBudget * 0.25),
      accommodation: Math.round(initialBudget * 0.35),
      attraction: Math.round(initialBudget * 0.10),
      shopping: Math.round(initialBudget * 0.05),
      other: Math.round(initialBudget * 0.05)
    }
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isAIRecognitionVisible, setIsAIRecognitionVisible] = useState(false);
  const [isVoiceInputVisible, setIsVoiceInputVisible] = useState(false);
  const [isBudgetDrawerVisible, setIsBudgetDrawerVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form] = Form.useForm();
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  // 初始化模拟数据
  useEffect(() => {
    const mockExpenses = [
      { id: 1, amount: 128, category: 'food', payment: 'alipay', note: '南翔小笼包', time: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm'), date: dayjs().format('YYYY-MM-DD') },
      { id: 2, amount: 35, category: 'transport', payment: 'wechat', note: '地铁出行', time: dayjs().subtract(4, 'hour').format('YYYY-MM-DD HH:mm'), date: dayjs().format('YYYY-MM-DD') },
      { id: 3, amount: 580, category: 'accommodation', payment: 'alipay', note: '外滩酒店住宿', time: dayjs().subtract(6, 'hour').format('YYYY-MM-DD HH:mm'), date: dayjs().format('YYYY-MM-DD') },
      { id: 4, amount: 120, category: 'attraction', payment: 'wechat', note: '东方明珠门票', time: dayjs().subtract(8, 'hour').format('YYYY-MM-DD HH:mm'), date: dayjs().format('YYYY-MM-DD') },
      { id: 5, amount: 88, category: 'food', payment: 'cash', note: '晚餐', time: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm'), date: dayjs().subtract(1, 'day').format('YYYY-MM-DD') },
      { id: 6, amount: 256, category: 'shopping', payment: 'card', note: '特产购买', time: dayjs().subtract(1, 'day').subtract(2, 'hour').format('YYYY-MM-DD HH:mm'), date: dayjs().subtract(1, 'day').format('YYYY-MM-DD') }
    ];
    setExpenses(mockExpenses);
    generateAISuggestions(mockExpenses);
  }, []);

  // 生成AI建议
  const generateAISuggestions = (expenseData) => {
    const totalSpent = expenseData.reduce((sum, e) => sum + e.amount, 0);
    const categoryTotals = {};
    expenseData.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const suggestions = [];
    
    // 预算使用建议
    const usagePercent = (totalSpent / budget.total) * 100;
    if (usagePercent > 80) {
      suggestions.push({
        type: 'warning',
        icon: <WarningOutlined />,
        title: '预算预警',
        content: `已使用预算的 ${usagePercent.toFixed(0)}%，建议控制后续消费。`
      });
    }

    // 餐饮消费建议
    if (categoryTotals.food > budget.categories.food * 0.8) {
      suggestions.push({
        type: 'tip',
        icon: <BulbOutlined />,
        title: '餐饮省钱建议',
        content: '餐饮支出接近预算上限，建议尝试当地小吃街或便利店，既省钱又能体验地道美食。'
      });
    }

    // 交通建议
    if (categoryTotals.transport) {
      suggestions.push({
        type: 'info',
        icon: <InfoCircleOutlined />,
        title: '交通优化',
        content: '建议使用地铁一日票或周票，可节省约30%的交通费用。'
      });
    }

    // 购物建议
    if (categoryTotals.shopping > 200) {
      suggestions.push({
        type: 'tip',
        icon: <GiftOutlined />,
        title: '购物提醒',
        content: '特产建议在超市或当地市场购买，价格通常比景区商店便宜20-30%。'
      });
    }

    setAiSuggestions(suggestions);
  };

  // 计算统计数据
  const calculateStats = useCallback(() => {
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = budget.total - totalSpent;
    const usagePercent = (totalSpent / budget.total) * 100;
    
    const categoryTotals = {};
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const dailyAverage = expenses.length > 0 
      ? totalSpent / new Set(expenses.map(e => e.date)).size 
      : 0;

    return {
      totalSpent,
      remaining,
      usagePercent,
      categoryTotals,
      dailyAverage,
      expenseCount: expenses.length
    };
  }, [expenses, budget]);

  const stats = calculateStats();

  // 添加消费记录
  const handleAddExpense = (values) => {
    const newExpense = {
      id: Date.now(),
      amount: values.amount,
      category: values.category,
      payment: values.payment,
      note: values.note || '',
      time: values.time.format('YYYY-MM-DD HH:mm'),
      date: values.time.format('YYYY-MM-DD')
    };

    if (editingExpense) {
      setExpenses(prev => prev.map(e => e.id === editingExpense.id ? { ...newExpense, id: e.id } : e));
      message.success('消费记录已更新');
    } else {
      setExpenses(prev => [newExpense, ...prev]);
      message.success('消费记录已添加');
    }

    setIsAddModalVisible(false);
    setEditingExpense(null);
    form.resetFields();
    generateAISuggestions([newExpense, ...expenses]);
    
    if (onBudgetUpdate) {
      onBudgetUpdate({
        total: budget.total,
        spent: stats.totalSpent + (editingExpense ? 0 : values.amount),
        remaining: budget.total - stats.totalSpent - (editingExpense ? 0 : values.amount)
      });
    }
  };

  // 删除消费记录
  const handleDeleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    message.success('消费记录已删除');
  };

  // 编辑消费记录
  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    form.setFieldsValue({
      amount: expense.amount,
      category: expense.category,
      payment: expense.payment,
      note: expense.note,
      time: dayjs(expense.time)
    });
    setIsAddModalVisible(true);
  };

  // 模拟AI识别
  const handleAIRecognition = () => {
    setIsAIRecognitionVisible(true);
    setTimeout(() => {
      setIsAIRecognitionVisible(false);
      form.setFieldsValue({
        amount: 168,
        category: 'food',
        payment: 'alipay',
        note: '南翔馒头店（AI识别）',
        time: dayjs()
      });
      setIsAddModalVisible(true);
      message.success('AI识别成功！已自动填充消费信息');
    }, 2000);
  };

  // 模拟语音输入
  const handleVoiceInput = () => {
    setIsVoiceInputVisible(true);
    setTimeout(() => {
      setIsVoiceInputVisible(false);
      form.setFieldsValue({
        amount: 35,
        category: 'transport',
        payment: 'wechat',
        note: '打车去豫园（语音识别）',
        time: dayjs()
      });
      setIsAddModalVisible(true);
      message.success('语音识别成功！已自动填充消费信息');
    }, 2000);
  };

  // 更新预算
  const handleUpdateBudget = (values) => {
    setBudget(prev => ({
      ...prev,
      total: values.total,
      categories: {
        food: values.food,
        transport: values.transport,
        accommodation: values.accommodation,
        attraction: values.attraction,
        shopping: values.shopping,
        other: values.other
      }
    }));
    setIsBudgetDrawerVisible(false);
    message.success('预算设置已更新');
    generateAISuggestions(expenses);
  };

  // 筛选消费记录
  const filteredExpenses = expenses.filter(e => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    if (filterDateRange && filterDateRange.length === 2) {
      const expenseDate = dayjs(e.date);
      if (expenseDate.isBefore(filterDateRange[0]) || expenseDate.isAfter(filterDateRange[1])) {
        return false;
      }
    }
    return true;
  });

  // 紧凑模式渲染
  if (compact) {
    return (
      <Card 
        className="card hover-lift"
        style={{ 
          borderRadius: 16,
          background: 'linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%)',
          border: '1px solid #b7eb8f',
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(82, 196, 26, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14
            }}>
              <WalletOutlined style={{ fontSize: 24, color: '#fff' }} />
            </div>
            <div>
              <TypographyTitle level={4} style={{ margin: 0, fontSize: 20 }}>AI智能记账</TypographyTitle>
              <Text type="secondary" style={{ fontSize: 14 }}>已记录 {expenses.length} 笔消费</Text>
            </div>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsAddModalVisible(true)}
              size="large"
              style={{ borderRadius: 8, fontSize: 15 }}
            >
              记一笔
            </Button>
            <Button
              icon={<BarChartOutlined />}
              onClick={() => setActiveTab('statistics')}
              size="large"
              style={{ borderRadius: 8, fontSize: 15 }}
            >
              详情
            </Button>
          </Space>
        </div>

        <Row gutter={20}>
          <Col span={8}>
            <Statistic
              title={<span style={{ fontSize: 14 }}>总支出</span>}
              value={stats.totalSpent}
              prefix="¥"
              valueStyle={{ color: '#f5222d', fontSize: 22, fontWeight: 600 }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title={<span style={{ fontSize: 14 }}>剩余预算</span>}
              value={stats.remaining}
              prefix="¥"
              valueStyle={{ color: stats.remaining >= 0 ? '#52c41a' : '#f5222d', fontSize: 22, fontWeight: 600 }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title={<span style={{ fontSize: 14 }}>预算使用率</span>}
              value={stats.usagePercent.toFixed(0)}
              suffix="%"
              valueStyle={{ color: stats.usagePercent > 80 ? '#fa8c16' : '#1890ff', fontSize: 22, fontWeight: 600 }}
            />
          </Col>
        </Row>

        <Progress
          percent={Math.min(stats.usagePercent, 100)}
          status={stats.usagePercent > 100 ? 'exception' : stats.usagePercent > 80 ? 'active' : 'success'}
          strokeColor={{
            '0%': '#52c41a',
            '50%': '#faad14',
            '100%': '#f5222d'
          }}
          style={{ marginTop: 20 }}
        />

        {aiSuggestions.length > 0 && (
          <div style={{ marginTop: 20, padding: 16, background: '#fff', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <RobotOutlined style={{ color: '#722ed1', marginRight: 10, fontSize: 18 }} />
              <Text strong style={{ color: '#722ed1', fontSize: 15 }}>AI建议</Text>
            </div>
            <Text style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{aiSuggestions[0].content}</Text>
          </div>
        )}

        {/* 添加消费弹窗 */}
        <Modal
          title={editingExpense ? '编辑消费' : '记一笔'}
          open={isAddModalVisible}
          onCancel={() => {
            setIsAddModalVisible(false);
            setEditingExpense(null);
            form.resetFields();
          }}
          footer={null}
          width={500}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddExpense}
            initialValues={{
              time: dayjs(),
              category: 'food',
              payment: 'alipay'
            }}
          >
            <Form.Item
              name="amount"
              label="金额"
              rules={[{ required: true, message: '请输入金额' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                prefix="¥"
                min={0.01}
                step={0.01}
                size="large"
                placeholder="0.00"
              />
            </Form.Item>

            <Form.Item
              name="category"
              label="类别"
              rules={[{ required: true, message: '请选择类别' }]}
            >
              <Radio.Group>
                <Space wrap>
                  {Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => (
                    <Radio.Button key={key} value={key} style={{ borderRadius: 8 }}>
                      <Space>
                        <span style={{ color: cat.color }}>{cat.icon}</span>
                        {cat.name}
                      </Space>
                    </Radio.Button>
                  ))}
                </Space>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="payment"
              label="支付方式"
              rules={[{ required: true, message: '请选择支付方式' }]}
            >
              <Radio.Group>
                <Space wrap>
                  {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                    <Radio.Button key={key} value={key} style={{ borderRadius: 8 }}>
                      <Space>
                        <span style={{ color: method.color }}>{method.icon}</span>
                        {method.name}
                      </Space>
                    </Radio.Button>
                  ))}
                </Space>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="note"
              label="备注"
            >
              <TextArea rows={2} placeholder="添加备注（可选）" />
            </Form.Item>

            <Form.Item
              name="time"
              label="时间"
              rules={[{ required: true, message: '请选择时间' }]}
            >
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setIsAddModalVisible(false)}>取消</Button>
                <Button type="primary" htmlType="submit">
                  {editingExpense ? '更新' : '保存'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    );
  }

  // 完整模式渲染
  return (
    <div className="fade-in" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px' }}>
      {/* 头部区域：标题和按钮 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        {/* 左侧：Logo和标题 */}
        <div style={{ display: 'flex', alignItems: 'center', flex: '1 1 auto' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 20,
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
          }}>
            <WalletOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <div>
            <TypographyTitle level={3} style={{ margin: 0, fontSize: 24 }}>AI智能记账</TypographyTitle>
            <Text type="secondary" style={{ fontSize: 15 }}>智能管理您的旅游消费，实时追踪预算执行情况</Text>
          </div>
        </div>
        {/* 右侧：操作按钮 */}
        <Space size="middle" style={{ flexShrink: 0 }}>
          {onBack && (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={onBack}
              size="large"
              style={{ borderRadius: 10, height: 44 }}
            >
              返回首页
            </Button>
          )}
          <Button
            icon={<ScanOutlined />}
            onClick={handleAIRecognition}
            size="large"
            style={{ borderRadius: 10, height: 44 }}
          >
            AI拍照
          </Button>
          <Button
            icon={<SoundOutlined />}
            onClick={handleVoiceInput}
            size="large"
            style={{ borderRadius: 10, height: 44 }}
          >
            语音记账
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddModalVisible(true)}
            size="large"
            style={{ borderRadius: 10, height: 44, padding: '0 24px' }}
          >
            记一笔
          </Button>
        </Space>
      </div>

        {/* 统计卡片 */}
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{
              background: '#e6f7ff',
              border: '1px solid #91d5ff',
              borderRadius: 16,
              padding: '24px',
              height: '100%',
              minHeight: 140,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }} bodyStyle={{ padding: 0 }}>
              <Statistic
                title={<span style={{ fontSize: 15, fontWeight: 500 }}>总支出</span>}
                value={stats.totalSpent}
                prefix="¥"
                valueStyle={{ color: '#1890ff', fontSize: 32, fontWeight: 600 }}
              />
              <div style={{ marginTop: 12 }}>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  {expenses.length} 笔消费
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{
              background: stats.remaining >= 0 ? '#f6ffed' : '#fff2f0',
              border: `1px solid ${stats.remaining >= 0 ? '#b7eb8f' : '#ffccc7'}`,
              borderRadius: 16,
              padding: '24px',
              height: '100%',
              minHeight: 140,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }} bodyStyle={{ padding: 0 }}>
              <Statistic
                title={<span style={{ fontSize: 15, fontWeight: 500 }}>剩余预算</span>}
                value={stats.remaining}
                prefix="¥"
                valueStyle={{ color: stats.remaining >= 0 ? '#52c41a' : '#f5222d', fontSize: 32, fontWeight: 600 }}
              />
              <div style={{ marginTop: 12 }}>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  总预算 ¥{budget.total}
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{
              background: '#f9f0ff',
              border: '1px solid #d3adf7',
              borderRadius: 16,
              padding: '24px',
              height: '100%',
              minHeight: 140,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }} bodyStyle={{ padding: 0 }}>
              <Statistic
                title={<span style={{ fontSize: 15, fontWeight: 500 }}>预算使用率</span>}
                value={stats.usagePercent.toFixed(1)}
                suffix="%"
                valueStyle={{ color: stats.usagePercent > 80 ? '#fa8c16' : '#722ed1', fontSize: 32, fontWeight: 600 }}
              />
              <Progress
                percent={Math.min(stats.usagePercent, 100)}
                size="small"
                status={stats.usagePercent > 100 ? 'exception' : stats.usagePercent > 80 ? 'active' : 'success'}
                showInfo={false}
                style={{ marginTop: 12 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{
              background: '#fff7e6',
              border: '1px solid #ffd591',
              borderRadius: 16,
              padding: '24px',
              height: '100%',
              minHeight: 140,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }} bodyStyle={{ padding: 0 }}>
              <Statistic
                title={<span style={{ fontSize: 15, fontWeight: 500 }}>日均消费</span>}
                value={stats.dailyAverage.toFixed(0)}
                prefix="¥"
                valueStyle={{ color: '#fa8c16', fontSize: 32, fontWeight: 600 }}
              />
              <div style={{ marginTop: 12 }}>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  平均每天
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* AI建议 */}
        {aiSuggestions.length > 0 && (
          <Card style={{
            marginBottom: 32,
            background: '#f9f0ff',
            border: '1px solid #d3adf7',
            borderRadius: 16,
            padding: '24px'
          }} bodyStyle={{ padding: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #722ed1 0%, #b37feb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <RobotOutlined style={{ fontSize: 22, color: '#fff' }} />
              </div>
              <TypographyTitle level={4} style={{ margin: 0, color: '#722ed1', fontSize: 20 }}>AI智能建议</TypographyTitle>
            </div>
            <List
              dataSource={aiSuggestions}
              renderItem={item => (
                <List.Item style={{ padding: '12px 0', borderBottom: '1px solid rgba(114, 46, 209, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                    <span style={{
                      color: item.type === 'warning' ? '#fa8c16' : item.type === 'tip' ? '#52c41a' : '#1890ff',
                      marginRight: 12,
                      marginTop: 2,
                      fontSize: 18
                    }}>
                      {item.icon}
                    </span>
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: 16 }}>{item.title}</Text>
                      <div style={{ marginTop: 6 }}>
                        <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>{item.content}</Text>
                      </div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* 标签页 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size="large"
          style={{ marginTop: 8 }}
          tabBarStyle={{
            marginBottom: 24,
            borderBottom: '2px solid #f0f0f0'
          }}
        >
          <TabPane
            tab={<span style={{ fontSize: 16, padding: '8px 16px' }}><PieChartOutlined style={{ marginRight: 8 }} />消费概览</span>}
            key="overview"
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card
                  title={<span style={{ fontSize: 17, fontWeight: 600 }}>消费分布</span>}
                  style={{ borderRadius: 16, height: '100%' }}
                  bodyStyle={{ padding: 24 }}
                >
                  {Object.keys(stats.categoryTotals).length > 0 ? (
                    <div style={{ height: 300 }}>
                      {/* 这里可以集成 Chart.js 饼图 */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
                        {Object.entries(stats.categoryTotals).map(([category, amount]) => {
                          const percent = ((amount / stats.totalSpent) * 100).toFixed(1);
                          const cat = EXPENSE_CATEGORIES[category];
                          return (
                            <div key={category} style={{ 
                              textAlign: 'center',
                              padding: 16,
                              background: cat?.bgColor || '#f5f5f5',
                              borderRadius: 12,
                              border: `1px solid ${cat?.borderColor || '#d9d9d9'}`,
                              minWidth: 120,
                              transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                              e.currentTarget.style.boxShadow = `0 8px 24px ${cat?.color ? cat.color + '40' : 'rgba(0,0,0,0.15)'}`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            >
                              <div style={{ color: cat?.color || '#8c8c8c', fontSize: 24, marginBottom: 8 }}>
                                {cat?.icon}
                              </div>
                              <div style={{ fontWeight: 600, color: cat?.color }}>{cat?.name}</div>
                              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>¥{amount}</div>
                              <div style={{ fontSize: 12, color: '#8c8c8c' }}>{percent}%</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <Empty description="暂无消费数据" />
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card
                  title={<span style={{ fontSize: 17, fontWeight: 600 }}>预算执行情况</span>}
                  style={{ borderRadius: 16, height: '100%' }}
                  bodyStyle={{ padding: 24 }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {Object.entries(budget.categories).map(([category, limit]) => {
                      const spent = stats.categoryTotals[category] || 0;
                      const percent = Math.min((spent / limit) * 100, 100);
                      const cat = EXPENSE_CATEGORIES[category];
                      const isOver = spent > limit;

                      return (
                        <div key={category}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 15 }}>
                            <Space size="small">
                              <span style={{ color: cat?.color, fontSize: 18 }}>{cat?.icon}</span>
                              <Text style={{ fontSize: 15 }}>{cat?.name}</Text>
                            </Space>
                            <Text style={{ color: isOver ? '#f5222d' : '#52c41a', fontSize: 15, fontWeight: 500 }}>
                              ¥{spent} / ¥{limit}
                            </Text>
                          </div>
                          <Progress
                            percent={percent}
                            size="default"
                            status={isOver ? 'exception' : percent > 80 ? 'active' : 'success'}
                            strokeColor={cat?.color}
                            showInfo={false}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    type="dashed"
                    block
                    icon={<EditOutlined />}
                    onClick={() => setIsBudgetDrawerVisible(true)}
                    style={{ marginTop: 24, height: 44, fontSize: 15, borderRadius: 10 }}
                    size="large"
                  >
                    调整预算分配
                  </Button>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane
            tab={<span style={{ fontSize: 16, padding: '8px 16px' }}><FileTextOutlined style={{ marginRight: 8 }} />消费明细</span>}
            key="records"
          >
            <Card style={{ borderRadius: 16 }} bodyStyle={{ padding: 24 }}>
              {/* 筛选栏 */}
              <div style={{ marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Select
                  value={filterCategory}
                  onChange={setFilterCategory}
                  style={{ width: 180 }}
                  placeholder="选择类别"
                  size="large"
                >
                  <Option value="all">全部类别</Option>
                  {Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => (
                    <Option key={key} value={key}>{cat.name}</Option>
                  ))}
                </Select>
                <RangePicker
                  value={filterDateRange}
                  onChange={setFilterDateRange}
                  placeholder={['开始日期', '结束日期']}
                  size="large"
                  style={{ width: 280 }}
                />
                <Button icon={<SyncOutlined />} onClick={() => {
                  setFilterCategory('all');
                  setFilterDateRange(null);
                }} size="large">
                  重置筛选
                </Button>
              </div>

              {/* 消费列表 */}
              <List
                dataSource={filteredExpenses}
                renderItem={item => {
                  const cat = EXPENSE_CATEGORIES[item.category];
                  const method = PAYMENT_METHODS[item.payment];
                  return (
                    <List.Item
                      actions={[
                        <Button 
                          key="edit" 
                          type="text" 
                          icon={<EditOutlined />}
                          onClick={() => handleEditExpense(item)}
                        />,
                        <Button 
                          key="delete" 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteExpense(item.id)}
                        />
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            style={{ 
                              background: cat?.bgColor,
                              border: `1px solid ${cat?.borderColor}`,
                              color: cat?.color
                            }}
                            icon={cat?.icon}
                            size={48}
                          />
                        }
                        title={
                          <Space>
                            <Text strong>{item.note || cat?.name}</Text>
                            <Tag color={cat?.color} style={{ margin: 0 }}>{cat?.name}</Tag>
                          </Space>
                        }
                        description={
                          <Space>
                            <span style={{ color: method?.color }}>{method?.icon}</span>
                            <Text type="secondary">{method?.name}</Text>
                            <Text type="secondary">{item.time}</Text>
                          </Space>
                        }
                      />
                      <div>
                        <Text strong style={{ fontSize: 18, color: '#f5222d' }}>
                          -¥{item.amount}
                        </Text>
                      </div>
                    </List.Item>
                  );
                }}
              />
            </Card>
          </TabPane>

          <TabPane
            tab={<span style={{ fontSize: 16, padding: '8px 16px' }}><BarChartOutlined style={{ marginRight: 8 }} />统计分析</span>}
            key="statistics"
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card
                  title={<span style={{ fontSize: 17, fontWeight: 600 }}>消费趋势</span>}
                  style={{ borderRadius: 16, height: '100%' }}
                  bodyStyle={{ padding: 24 }}
                >
                  {expenses.length > 0 ? (
                    <Timeline mode="left">
                      {[...new Set(expenses.map(e => e.date))].sort().map(date => {
                        const dayExpenses = expenses.filter(e => e.date === date);
                        const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
                        return (
                          <Timeline.Item key={date} label={date}>
                            <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 10 }}>
                              <Text strong style={{ fontSize: 15 }}>当日消费 ¥{dayTotal}</Text>
                              <div style={{ marginTop: 10 }}>
                                {dayExpenses.map(e => (
                                  <Tag key={e.id} size="middle" style={{ margin: '3px', fontSize: 13 }}>
                                    {EXPENSE_CATEGORIES[e.category]?.name} ¥{e.amount}
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          </Timeline.Item>
                        );
                      })}
                    </Timeline>
                  ) : (
                    <Empty description="暂无数据" />
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card
                  title={<span style={{ fontSize: 17, fontWeight: 600 }}>消费对比</span>}
                  style={{ borderRadius: 16, height: '100%' }}
                  bodyStyle={{ padding: 24 }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div>
                      <Text strong style={{ fontSize: 16 }}>与预算对比</Text>
                      <div style={{ marginTop: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 15 }}>
                          <Text style={{ fontSize: 15 }}>您的消费</Text>
                          <Text strong style={{ fontSize: 16 }}>¥{stats.totalSpent}</Text>
                        </div>
                        <Progress percent={(stats.totalSpent / budget.total) * 100} status="active" size="default" />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                          <Text type="secondary" style={{ fontSize: 14 }}>平均消费</Text>
                          <Text type="secondary" style={{ fontSize: 14 }}>¥{Math.round(budget.total * 0.8)}</Text>
                        </div>
                        <div style={{ marginTop: 16, padding: 16, background: stats.totalSpent < budget.total * 0.8 ? '#f6ffed' : '#fff7e6', borderRadius: 10 }}>
                          <Text style={{ color: stats.totalSpent < budget.total * 0.8 ? '#52c41a' : '#fa8c16', fontSize: 15 }}>
                            {stats.totalSpent < budget.total * 0.8
                              ? <><CheckCircleOutlined /> 比平均水平节省 {((1 - stats.totalSpent / (budget.total * 0.8)) * 100).toFixed(0)}%</>
                              : <><WarningOutlined /> 超出平均水平 {((stats.totalSpent / (budget.total * 0.8) - 1) * 100).toFixed(0)}%</>
                            }
                          </Text>
                        </div>
                      </div>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    <div>
                      <Text strong style={{ fontSize: 16 }}>消费健康度评分</Text>
                      <div style={{ textAlign: 'center', marginTop: 20 }}>
                        <div style={{
                          width: 140,
                          height: 140,
                          borderRadius: '50%',
                          background: 'conic-gradient(#52c41a 0deg, #52c41a 270deg, #f0f0f0 270deg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto'
                        }}>
                          <div style={{
                            width: 115,
                            height: 115,
                            borderRadius: '50%',
                            background: '#fff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Text style={{ fontSize: 36, fontWeight: 700, color: '#52c41a' }}>85</Text>
                            <Text type="secondary" style={{ fontSize: 14 }}>健康度</Text>
                          </div>
                        </div>
                        <Text type="secondary" style={{ display: 'block', marginTop: 16, fontSize: 14 }}>
                          您的消费结构合理，继续保持！
                        </Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>

      {/* 添加/编辑消费弹窗 */}
      <Modal
        title={
          <Space>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PlusOutlined style={{ color: '#fff', fontSize: 16 }} />
            </div>
            <span>{editingExpense ? '编辑消费' : '记一笔'}</span>
          </Space>
        }
        open={isAddModalVisible}
        onCancel={() => {
          setIsAddModalVisible(false);
          setEditingExpense(null);
          form.resetFields();
        }}
        footer={null}
        width={520}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddExpense}
          initialValues={{
            time: dayjs(),
            category: 'food',
            payment: 'alipay'
          }}
        >
          <Form.Item
            name="amount"
            label="消费金额"
            rules={[{ required: true, message: '请输入消费金额' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              prefix="¥"
              min={0.01}
              step={0.01}
              size="large"
              placeholder="0.00"
            />
          </Form.Item>

          <Form.Item
            name="category"
            label="消费类别"
            rules={[{ required: true, message: '请选择消费类别' }]}
          >
            <Radio.Group>
              <Space wrap>
                {Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => (
                  <Radio.Button 
                    key={key} 
                    value={key} 
                    style={{ 
                      borderRadius: 8,
                      height: 'auto',
                      padding: '8px 16px'
                    }}
                  >
                    <Space direction="vertical" align="center" size={0}>
                      <span style={{ color: cat.color, fontSize: 20 }}>{cat.icon}</span>
                      <span style={{ fontSize: 12 }}>{cat.name}</span>
                    </Space>
                  </Radio.Button>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="payment"
            label="支付方式"
            rules={[{ required: true, message: '请选择支付方式' }]}
          >
            <Radio.Group>
              <Space wrap>
                {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                  <Radio.Button 
                    key={key} 
                    value={key} 
                    style={{ borderRadius: 8 }}
                  >
                    <Space>
                      <span style={{ color: method.color }}>{method.icon}</span>
                      {method.name}
                    </Space>
                  </Radio.Button>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="note"
            label="备注说明"
          >
            <TextArea 
              rows={2} 
              placeholder="添加备注，例如：南翔小笼包、外滩酒店等"
              maxLength={100}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="time"
            label="消费时间"
            rules={[{ required: true, message: '请选择消费时间' }]}
          >
            <DatePicker 
              showTime 
              style={{ width: '100%' }}
              format="YYYY-MM-DD HH:mm"
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button 
                onClick={() => {
                  setIsAddModalVisible(false);
                  setEditingExpense(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" size="large">
                {editingExpense ? '更新记录' : '保存记录'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* AI识别弹窗 */}
      <Modal
        title="AI拍照识别"
        open={isAIRecognitionVisible}
        footer={null}
        closable={false}
        centered
      >
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            animation: 'pulse 2s infinite'
          }}>
            <ScanOutlined style={{ fontSize: 36, color: '#fff' }} />
          </div>
          <TypographyTitle level={5}>AI正在识别...</TypographyTitle>
          <Text type="secondary">请对准收据，保持清晰</Text>
        </div>
      </Modal>

      {/* 语音输入弹窗 */}
      <Modal
        title="语音记账"
        open={isVoiceInputVisible}
        footer={null}
        closable={false}
        centered
      >
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            animation: 'pulse 2s infinite'
          }}>
            <SoundOutlined style={{ fontSize: 36, color: '#fff' }} />
          </div>
          <TypographyTitle level={5}>正在聆听...</TypographyTitle>
          <Text type="secondary">请说出消费内容，例如："午餐25元"</Text>
        </div>
      </Modal>

      {/* 预算设置抽屉 */}
      <Drawer
        title="预算设置"
        placement="right"
        width={400}
        onClose={() => setIsBudgetDrawerVisible(false)}
        open={isBudgetDrawerVisible}
      >
        <Form
          layout="vertical"
          onFinish={handleUpdateBudget}
          initialValues={{
            total: budget.total,
            ...budget.categories
          }}
        >
          <Form.Item
            name="total"
            label="总预算"
            rules={[{ required: true, message: '请输入总预算' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              prefix="¥"
              min={100}
              step={100}
              size="large"
            />
          </Form.Item>

          <Divider>分类预算</Divider>

          {Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => (
            <Form.Item
              key={key}
              name={key}
              label={
                <Space>
                  <span style={{ color: cat.color }}>{cat.icon}</span>
                  {cat.name}
                </Space>
              }
            >
              <InputNumber
                style={{ width: '100%' }}
                prefix="¥"
                min={0}
                step={50}
              />
            </Form.Item>
          ))}

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default AIAccounting;
