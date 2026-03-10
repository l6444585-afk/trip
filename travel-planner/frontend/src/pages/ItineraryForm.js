import React, { useState } from 'react';
import { Form, Input, InputNumber, Select, Button, Card, message, DatePicker, Row, Col, Typography, Divider, Tag, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { EnvironmentOutlined, TeamOutlined, ThunderboltOutlined, CameraOutlined, CoffeeOutlined, CompassOutlined, SafetyOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Paragraph, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const ItineraryForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);

  const destinationOptions = [
    { value: '杭州', label: '杭州' },
    { value: '上海', label: '上海' },
    { value: '苏州', label: '苏州' },
    { value: '南京', label: '南京' },
    { value: '无锡', label: '无锡' },
    { value: '宁波', label: '宁波' },
    { value: '嘉兴', label: '嘉兴' },
    { value: '舟山', label: '舟山' },
    { value: '常州', label: '常州' },
    { value: '扬州', label: '扬州' }
  ];

  const interestOptions = [
    { label: '自然风光', value: '自然风光', icon: <EnvironmentOutlined />, color: '#52c41a' },
    { label: '历史文化', value: '历史文化', icon: <CameraOutlined />, color: '#722ed1' },
    { label: '美食打卡', value: '美食打卡', icon: <CoffeeOutlined />, color: '#fa8c16' },
    { label: '都市风情', value: '都市风情', icon: <CompassOutlined />, color: '#1890ff' },
    { label: '摄影圣地', value: '摄影圣地', icon: <CameraOutlined />, color: '#eb2f96' },
    { label: '休闲度假', value: '休闲度假', icon: <SafetyOutlined />, color: '#13c2c2' },
    { label: '亲子游玩', value: '亲子游玩', icon: <TeamOutlined />, color: '#faad14' },
    { label: '户外探险', value: '户外探险', icon: <ThunderboltOutlined />, color: '#f5222d' }
  ];

  const companionOptions = [
    { value: '情侣', label: '情侣出行' },
    { value: '亲子', label: '亲子游' },
    { value: '独行', label: '独自旅行' },
    { value: '朋友', label: '朋友结伴' },
    { value: '家庭', label: '家庭出游' }
  ];

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const requestData = {
        title: `${values.departure} → ${values.destinations.join('、')} ${values.days}日游`,
        days: values.days,
        budget: values.budget,
        departure: values.departure,
        companion_type: values.companion_type,
        interests: values.interests || [],
        destinations: values.destinations || [],
        travel_style: values.travel_style || '精品深度',
        travel_mode: values.travel_mode || '公共交通',
        age_group: values.age_group || '成年人',
        pace_preference: values.pace_preference || '适中',
        special_needs: values.special_needs || [],
        date_range: values.date_range ? [
          values.date_range[0].format('YYYY-MM-DD'),
          values.date_range[1].format('YYYY-MM-DD')
        ] : null
      };

      const response = await axios.post('/api/itineraries/generate', requestData);
      
      if (response.data) {
        message.success('行程生成成功！');
        navigate(`/itinerary/${response.data.itinerary_id}`);
      }
    } catch (error) {
      console.error('生成行程失败:', error);
      message.error(error.response?.data?.detail || '生成行程失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleInterestToggle = (interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );
    form.setFieldsValue({ interests: selectedInterests });
  };

  return (
    <div style={{ 
      padding: '40px 24px', 
      maxWidth: 1200, 
      margin: '0 auto',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
      minHeight: '100vh'
    }}>
      <Card 
        style={{ 
          borderRadius: 24, 
          boxShadow: '0 12px 48px rgba(0,0,0,0.12)',
          border: 'none'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            <ThunderboltOutlined style={{ color: '#667eea', marginRight: 12 }} />
            创建智能行程
          </Title>
          <Paragraph style={{ color: '#666', fontSize: 16 }}>
            填写您的旅行偏好，AI将为您生成个性化行程
          </Paragraph>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            days: 3,
            budget: 3000,
            travel_style: '精品深度',
            travel_mode: '公共交通',
            age_group: '成年人',
            pace_preference: '适中'
          }}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="departure"
                label={<Text strong>出发城市</Text>}
                rules={[{ required: true, message: '请输入出发城市' }]}
              >
                <Input 
                  size="large" 
                  placeholder="请输入出发城市" 
                  prefix={<EnvironmentOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="destinations"
                label={<Text strong>目的地城市</Text>}
                rules={[{ required: true, message: '请选择目的地' }]}
              >
                <Select
                  mode="multiple"
                  size="large"
                  placeholder="选择目的地城市（可多选）"
                  options={destinationOptions}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                name="days"
                label={<Text strong>行程天数</Text>}
                rules={[{ required: true, message: '请输入天数' }]}
              >
                <InputNumber 
                  size="large" 
                  min={1} 
                  max={15} 
                  style={{ width: '100%' }}
                  addonAfter="天"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="budget"
                label={<Text strong>预算（元）</Text>}
                rules={[{ required: true, message: '请输入预算' }]}
              >
                <InputNumber 
                  size="large" 
                  min={500} 
                  max={100000}
                  step={500}
                  style={{ width: '100%' }}
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/[¥\s,]/g, '')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="companion_type"
                label={<Text strong>出行类型</Text>}
                rules={[{ required: true, message: '请选择出行类型' }]}
              >
                <Select
                  size="large"
                  placeholder="选择出行类型"
                  options={companionOptions}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="date_range"
            label={<Text strong>出行日期</Text>}
          >
            <RangePicker 
              size="large" 
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder={['开始日期', '结束日期']}
            />
          </Form.Item>

          <Divider orientation="left">兴趣偏好</Divider>
          
          <Form.Item name="interests">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {interestOptions.map(option => (
                <Tag
                  key={option.value}
                  color={selectedInterests.includes(option.value) ? option.color : 'default'}
                  style={{ 
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: 14,
                    borderRadius: 20,
                    transition: 'all 0.3s'
                  }}
                  onClick={() => handleInterestToggle(option.value)}
                >
                  {option.icon} {option.label}
                </Tag>
              ))}
            </div>
          </Form.Item>

          <Divider orientation="left">高级选项</Divider>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                name="travel_style"
                label={<Text strong>旅行风格</Text>}
              >
                <Select
                  size="large"
                  options={[
                    { value: '精品深度', label: '精品深度游' },
                    { value: '休闲放松', label: '休闲放松游' },
                    { value: '特种兵式', label: '特种兵式' },
                    { value: '文化探索', label: '文化探索' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="travel_mode"
                label={<Text strong>交通方式</Text>}
              >
                <Select
                  size="large"
                  options={[
                    { value: '公共交通', label: '公共交通' },
                    { value: '自驾', label: '自驾' },
                    { value: '高铁', label: '高铁为主' },
                    { value: '飞机', label: '飞机为主' },
                    { value: '混合', label: '混合交通' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="pace_preference"
                label={<Text strong>行程节奏</Text>}
              >
                <Select
                  size="large"
                  options={[
                    { value: '轻松', label: '轻松休闲' },
                    { value: '适中', label: '适中节奏' },
                    { value: '紧凑', label: '紧凑高效' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="special_needs"
            label={<Text strong>特殊需求</Text>}
          >
            <TextArea 
              rows={3}
              placeholder="请输入您的特殊需求，如：需要无障碍设施、带宠物出行、饮食禁忌等..."
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 32 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              icon={<ThunderboltOutlined />}
              style={{
                width: '100%',
                height: 56,
                fontSize: 18,
                fontWeight: 600,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              {loading ? 'AI 正在规划中...' : '开始智能规划'}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {loading && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(255,255,255,0.8)', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <Spin size="large" />
          <Title level={4} style={{ marginTop: 24 }}>AI 正在为您规划行程...</Title>
          <Paragraph style={{ color: '#666' }}>请稍候，这可能需要几秒钟</Paragraph>
        </div>
      )}
    </div>
  );
};

export default ItineraryForm;