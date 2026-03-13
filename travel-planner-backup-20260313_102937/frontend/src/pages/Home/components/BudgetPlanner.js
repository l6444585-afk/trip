import React from 'react';
import { Card, Row, Col, Slider, InputNumber, Typography, Divider } from 'antd';
import { 
  DollarOutlined, 
  CarOutlined, 
  HomeOutlined, 
  CoffeeOutlined, 
  TicketOutlined, 
  ShoppingOutlined 
} from '@ant-design/icons';

const { Text, Title } = Typography;

const BudgetPlanner = ({ budget, onBudgetChange }) => {
  const budgetItems = [
    { key: 'transport', label: '交通', icon: <CarOutlined />, color: '#1890ff' },
    { key: 'accommodation', label: '住宿', icon: <HomeOutlined />, color: '#52c41a' },
    { key: 'food', label: '餐饮', icon: <CoffeeOutlined />, color: '#fa8c16' },
    { key: 'tickets', label: '门票', icon: <TicketOutlined />, color: '#722ed1' },
    { key: 'shopping', label: '购物', icon: <ShoppingOutlined />, color: '#eb2f96' }
  ];

  const handleItemChange = (key, value) => {
    const newBudget = { ...budget, [key]: value };
    const itemsTotal = Object.entries(newBudget)
      .filter(([k]) => k !== 'total')
      .reduce((sum, [, v]) => sum + v, 0);
    newBudget.total = itemsTotal;
    onBudgetChange(newBudget);
  };

  const handleTotalChange = (value) => {
    const ratio = budget.total > 0 ? value / budget.total : 1;
    const newBudget = { total: value };
    budgetItems.forEach(item => {
      newBudget[item.key] = Math.round(budget[item.key] * ratio);
    });
    onBudgetChange(newBudget);
  };

  return (
    <Card 
      style={{ 
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <DollarOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 12 }} />
        <Title level={4} style={{ margin: 0 }}>预算规划</Title>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text strong>总预算</Text>
          <InputNumber
            value={budget.total}
            onChange={handleTotalChange}
            formatter={value => `¥${value}`}
            parser={value => value.replace('¥', '')}
            min={500}
            max={50000}
            step={100}
            style={{ width: 120 }}
          />
        </div>
        <Slider
          value={budget.total}
          onChange={handleTotalChange}
          min={500}
          max={50000}
          step={100}
          tooltip={{ formatter: value => `¥${value}` }}
        />
      </div>

      <Divider style={{ margin: '16px 0' }} />

      <Row gutter={[16, 16]}>
        {budgetItems.map((item) => (
          <Col span={24} key={item.key}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              padding: '8px 12px',
              background: '#fafafa',
              borderRadius: 8
            }}>
              <div style={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%', 
                background: `${item.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                {React.cloneElement(item.icon, { style: { color: item.color } })}
              </div>
              <div style={{ flex: 1 }}>
                <Text style={{ display: 'block', marginBottom: 4 }}>{item.label}</Text>
                <Slider
                  value={budget[item.key]}
                  onChange={(value) => handleItemChange(item.key, value)}
                  min={0}
                  max={budget.total}
                  step={50}
                  style={{ margin: 0 }}
                />
              </div>
              <InputNumber
                value={budget[item.key]}
                onChange={(value) => handleItemChange(item.key, value)}
                formatter={value => `¥${value}`}
                parser={value => value.replace('¥', '')}
                min={0}
                max={budget.total}
                step={50}
                style={{ width: 90, marginLeft: 12 }}
              />
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default BudgetPlanner;
