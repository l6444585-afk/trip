import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, Form, Input, InputNumber, Select, Button, message, Space, Row, Col, Typography, Tag, Rate, Progress, Steps, Timeline, Modal, Badge, Spin, Alert, Collapse, Checkbox } from 'antd';
import { RocketOutlined, ThunderboltOutlined, EnvironmentOutlined, DollarOutlined, CameraOutlined, CoffeeOutlined, CompassOutlined, SafetyOutlined, TeamOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, SendOutlined, ReloadOutlined, SaveOutlined, BulbOutlined, FireOutlined, StarOutlined, RobotOutlined, AimOutlined, TrophyOutlined, MessageOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import '../styles/design-system.css';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;
const { Option } = Select;

const AIPlanning = () => {
  const [form] = Form.useForm();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [planningStep, setPlanningStep] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [planningProgress, setPlanningProgress] = useState(0);
  const [selectedConstraints, setSelectedConstraints] = useState([]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState([]);
  const [showOptimizationPanel, setShowOptimizationPanel] = useState(false);
  const [savedVersions, setSavedVersions] = useState([]);
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  const interestOptions = [
    { label: '自然风光', value: '自然风光', icon: <EnvironmentOutlined />, color: '#52c41a', description: '山水美景,亲近自然' },
    { label: '历史文化', value: '历史文化', icon: <CameraOutlined />, color: '#722ed1', description: '古迹遗址,文化体验' },
    { label: '美食购物', value: '美食购物', icon: <CoffeeOutlined />, color: '#fa8c16', description: '特色美食,购物天堂' },
    { label: '城市漫步', value: '城市漫步', icon: <CompassOutlined />, color: '#1890ff', description: '都市风情,街头探索' },
    { label: '摄影打卡', value: '摄影打卡', icon: <CameraOutlined />, color: '#eb2f96', description: '网红景点,摄影圣地' },
    { label: '休闲度假', value: '休闲度假', icon: <SafetyOutlined />, color: '#13c2c2', description: '放松身心,享受时光' },
    { label: '亲子游玩', value: '亲子游玩', icon: <TeamOutlined />, color: '#faad14', description: '家庭娱乐,亲子互动' },
    { label: '户外探险', value: '户外探险', icon: <ThunderboltOutlined />, color: '#f5222d', description: '户外运动,挑战自我' }
  ];

  const constraintOptions = [
    { label: '预算优先', value: 'budget_priority', icon: <DollarOutlined />, description: '在预算范围内最大化体验' },
    { label: '时间紧凑', value: 'time_efficient', icon: <ClockCircleOutlined />, description: '高效利用时间,减少等待' },
    { label: '舒适优先', value: 'comfort_first', icon: <SafetyOutlined />, description: '注重住宿和交通舒适度' },
    { label: '体验深度', value: 'deep_experience', icon: <CameraOutlined />, description: '深入体验当地文化' },
    { label: '网红打卡', value: 'popular_spots', icon: <FireOutlined />, description: '优先推荐热门景点' },
    { label: '小众探索', value: 'niche_exploration', icon: <CompassOutlined />, description: '探索小众独特景点' }
  ];

  const destinationOptions = [
    { value: '杭州', label: '杭州', image: '/images/cities/hangzhou.jpg', tags: ['西湖', '灵隐寺', '宋城'], rating: 4.9, highlights: ['断桥残雪', '苏堤春晓', '雷峰夕照'] },
    { value: '上海', label: '上海', image: '/images/cities/shanghai.jpg', tags: ['外滩', '迪士尼', '豫园'], rating: 4.8, highlights: ['外滩夜景', '迪士尼乐园', '城隍庙'] },
    { value: '苏州', label: '苏州', image: '/images/cities/suzhou.jpg', tags: ['拙政园', '虎丘', '平江路'], rating: 4.9, highlights: ['拙政园', '留园', '平江路'] },
    { value: '南京', label: '南京', image: '/images/cities/nanjing.jpg', tags: ['夫子庙', '中山陵', '玄武湖'], rating: 4.7, highlights: ['夫子庙', '中山陵', '玄武湖'] },
    { value: '无锡', label: '无锡', image: '/images/cities/wuxi.jpg', tags: ['太湖', '灵山', '鼋头渚'], rating: 4.6, highlights: ['太湖风光', '灵山大佛', '鼋头渚'] },
    { value: '宁波', label: '宁波', image: '/images/cities/ningbo.jpg', tags: ['天一阁', '东钱湖', '老外滩'], rating: 4.6, highlights: ['天一阁', '东钱湖', '老外滩'] },
    { value: '嘉兴', label: '嘉兴', image: '/images/cities/jiaxing.jpg', tags: ['乌镇', '西塘', '南湖'], rating: 4.8, highlights: ['乌镇古镇', '西塘水乡', '南湖红船'] },
    { value: '舟山', label: '舟山', image: '/images/cities/zhoushan.jpg', tags: ['普陀山', '朱家尖', '桃花岛'], rating: 4.8, highlights: ['普陀山', '朱家尖', '桃花岛'] }
  ];

  const planningSteps = [
    { title: '意图识别', icon: <BulbOutlined />, description: 'GLM-4.7 分析您的旅行需求' },
    { title: '约束分析', icon: <AimOutlined />, description: '理解预算、时间等限制条件' },
    { title: '智能规划', icon: <RobotOutlined />, description: '多Agent并行生成最优方案' },
    { title: '方案优化', icon: <ThunderboltOutlined />, description: '基于反馈持续优化行程' }
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (chatMessages.length > 0 && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatMessages]);

  const handleConstraintToggle = useCallback((constraint) => {
    setSelectedConstraints(prev => 
      prev.includes(constraint) ? prev.filter(c => c !== constraint) : [...prev, constraint]
    );
  }, []);

  const handleGenerateItinerary = async (values) => {
    setIsGenerating(true);
    setPlanningStep(0);
    setPlanningProgress(0);
    setChatMessages([
      {
        role: 'assistant',
        content: `您好！我是GLM-4.7智能旅行规划助手。我将为您规划${values.destination}${values.days}日游行程。\n\n首先,让我分析一下您的需求...`,
        timestamp: dayjs()
      }
    ]);

    try {
      for (let step = 0; step < planningSteps.length; step++) {
        setPlanningStep(step);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const stepMessages = [
          {
            role: 'assistant',
            content: `🤖 ${planningSteps[step].title}\n\n${planningSteps[step].description}\n\n正在处理...`,
            timestamp: dayjs()
          }
        ];
        
        setChatMessages(prev => [...prev, ...stepMessages]);
        setPlanningProgress(((step + 1) / planningSteps.length) * 100);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockItinerary = {
        id: Date.now(),
        title: `${values.origin} → ${values.destination} ${values.days}日游`,
        origin: values.origin,
        destination: values.destination,
        days: values.days,
        budget: values.budget,
        preferences: values.preferences,
        constraints: selectedConstraints,
        dailyPlan: Array.from({ length: values.days }, (_, i) => ({
          day: i + 1,
          date: dayjs().add(i, 'day').format('YYYY-MM-DD'),
          activities: [
            { time: '09:00', title: '景点游览', description: '探索当地著名景点', location: '市中心', duration: '3小时', type: 'sightseeing' },
            { time: '12:00', title: '美食体验', description: '品尝当地特色美食', location: '美食街', duration: '1.5小时', type: 'dining' },
            { time: '14:00', title: '文化体验', description: '参观博物馆或历史古迹', location: '文化区', duration: '2.5小时', type: 'culture' },
            { time: '17:00', title: '休闲时光', description: '自由活动或购物', location: '商业区', duration: '2小时', type: 'leisure' },
            { time: '19:00', title: '晚餐', description: '享用当地特色晚餐', location: '餐厅', duration: '1.5小时', type: 'dining' }
          ]
        })),
        estimatedCost: Math.floor(values.budget * (0.8 + Math.random() * 0.4)),
        tips: [
          '建议提前预订热门景点门票',
          '关注当地天气,合理安排行程',
          '准备舒适的步行鞋',
          '尝试当地特色美食',
          '保持开放的心态,享受旅程'
        ],
        aiInsights: [
          { type: 'budget', title: '预算分析', content: '您的预算分配合理,建议适当增加餐饮预算以获得更好的美食体验' },
          { type: 'time', title: '时间安排', content: '行程节奏适中,每天有充足的休息时间' },
          { type: 'experience', title: '体验建议', content: '根据您的兴趣偏好,推荐增加一些小众景点的探索' }
        ],
        optimizationScore: 85,
        generatedAt: dayjs()
      };

      setGeneratedItinerary(mockItinerary);
      setShowResultModal(true);
      
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ 行程规划完成！\n\n已为您生成${values.days}天的详细行程,包含${mockItinerary.dailyPlan.reduce((sum, day) => sum + day.activities.length, 0)}个活动安排。\n\n您可以查看详细行程,或继续与我对话进行优化调整。`,
        timestamp: dayjs()
      }]);

      message.success('GLM-4.7 行程生成成功！');
    } catch (error) {
      message.error('生成失败,请重试');
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ 抱歉,生成行程时遇到了问题。请稍后重试。`,
        timestamp: dayjs()
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage = {
      role: 'user',
      content: userInput,
      timestamp: dayjs()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsChatting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const aiResponse = {
        role: 'assistant',
        content: `感谢您的反馈！我已理解您的需求：${userInput}\n\n正在为您优化行程...`,
        timestamp: dayjs()
      };

      setChatMessages(prev => [...prev, aiResponse]);
      
      if (generatedItinerary) {
        setOptimizationSuggestions([
          { type: 'adjustment', title: '调整建议', content: '根据您的反馈,建议调整第二天的行程安排' },
          { type: 'addition', title: '新增推荐', content: '为您推荐一个符合您需求的特色景点' },
          { type: 'alternative', title: '替代方案', content: '提供一个不同风格的行程选择' }
        ]);
        setShowOptimizationPanel(true);
      }
    } catch (error) {
      message.error('发送消息失败');
    } finally {
      setIsChatting(false);
    }
  };

  const handleSaveVersion = () => {
    if (generatedItinerary) {
      const newVersion = {
        id: Date.now(),
        itinerary: { ...generatedItinerary },
        timestamp: dayjs(),
        version: savedVersions.length + 1
      };
      setSavedVersions(prev => [...prev, newVersion]);
      message.success('版本已保存');
    }
  };

  const handleApplyOptimization = (suggestion) => {
    message.success(`已应用优化建议: ${suggestion.title}`);
    setShowOptimizationPanel(false);
  };

  const getOptimizationColor = (type) => {
    const colors = {
      'adjustment': '#1890ff',
      'addition': '#52c41a',
      'alternative': '#fa8c16'
    };
    return colors[type] || '#1890ff';
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
              <RocketOutlined style={{ color: '#1A936F' }} />
              AI 智能规划
            </Title>
            <Paragraph style={{ color: '#8a8a8a', marginTop: 8, fontSize: 15 }}>
              基于 GLM-4.7 人工智能模型,为您量身定制个性化旅游攻略
            </Paragraph>
          </div>
          <Space>
            <Button
              icon={<BulbOutlined />}
              onClick={() => navigate('/create')}
              className="btn btn-secondary"
            >
              高级规划
            </Button>
          </Space>
        </div>

        <Alert
          message="GLM-4.7 智能规划能力"
          description="利用GLM-4.7的交错式思考模式和多Agent并行规划能力,深度分析您的需求,生成最优行程方案。支持128K输出长度,提供专业级规划体验。"
          type="info"
          showIcon
          icon={<BulbOutlined />}
          style={{ marginBottom: 24 }}
        />
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card className="card card-elevated" style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 24 }}>
              <Title level={4} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AimOutlined style={{ color: '#1A936F' }} />
                快速规划
              </Title>
              <Paragraph style={{ color: '#8a8a8a', marginBottom: 20 }}>
                告诉我您的旅行想法,GLM-4.7将为您生成专属行程
              </Paragraph>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleGenerateItinerary}
              initialValues={{
                days: 3,
                budget: 3000,
                preferences: ['自然风光', '历史文化']
              }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="出发地"
                    name="origin"
                    rules={[{ required: true, message: '请输入出发地' }]}
                  >
                    <Input
                      placeholder="例如：上海"
                      size="large"
                      className="input"
                      prefix={<EnvironmentOutlined />}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="目的地"
                    name="destination"
                    rules={[{ required: true, message: '请选择目的地' }]}
                  >
                    <Select
                      placeholder="选择目的地"
                      size="large"
                      showSearch
                      className="input"
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {destinationOptions.map(opt => (
                        <Option key={opt.value} value={opt.value}>
                          <Space>
                            <span>{opt.label}</span>
                            <Rate disabled defaultValue={opt.rating} style={{ fontSize: 12 }} />
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="出行天数"
                    name="days"
                    rules={[{ required: true, message: '请选择出行天数' }]}
                  >
                    <Select size="large" className="input">
                      {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(day => (
                        <Option key={day} value={day}>{day}天</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="预算范围（元）"
                    name="budget"
                    rules={[{ required: true, message: '请输入预算' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      size="large"
                      min={500}
                      max={50000}
                      step={500}
                      formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/[¥\s,]/g, '')}
                      className="input"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="出游偏好（可多选）"
                name="preferences"
                rules={[{ required: true, message: '请至少选择一个偏好' }]}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                  {interestOptions.map((option) => (
                    <Card
                      key={option.value}
                      size="small"
                      hoverable
                      className="card"
                      style={{
                        cursor: 'pointer',
                        borderRadius: 8,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Checkbox value={option.value} style={{ width: '100%' }}>
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: option.color }}>{option.icon}</span>
                            <Text strong style={{ fontSize: 13 }}>{option.label}</Text>
                          </div>
                          <Text style={{ fontSize: 11, color: '#8a8a8a' }}>{option.description}</Text>
                        </Space>
                      </Checkbox>
                    </Card>
                  ))}
                </div>
              </Form.Item>

              <div style={{ marginBottom: 20 }}>
                <Title level={5} style={{ marginBottom: 12 }}>规划约束（可选）</Title>
                <Paragraph style={{ color: '#8a8a8a', fontSize: 13, marginBottom: 16 }}>
                  选择您的优先级,帮助AI更好地规划行程
                </Paragraph>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                  {constraintOptions.map((option) => (
                    <Card
                      key={option.value}
                      size="small"
                      hoverable
                      className={`card ${selectedConstraints.includes(option.value) ? 'card-elevated' : ''}`}
                      style={{
                        cursor: 'pointer',
                        borderRadius: 8,
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => handleConstraintToggle(option.value)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: option.color }}>{option.icon}</span>
                        <div>
                          <Text strong style={{ fontSize: 13 }}>{option.label}</Text>
                          {selectedConstraints.includes(option.value) && (
                            <CheckCircleOutlined style={{ color: option.color, marginLeft: 8, fontSize: 12 }} />
                          )}
                        </div>
                      </div>
                      <Text style={{ fontSize: 11, color: '#8a8a8a', display: 'block', marginTop: 4 }}>
                        {option.description}
                      </Text>
                    </Card>
                  ))}
                </div>
              </div>

              {isGenerating ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Spin
                    indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1A936F' }} spin />}
                    tip="GLM-4.7 正在为您规划行程..."
                  />
                  <div style={{ marginTop: 24 }}>
                    <Steps current={planningStep} size="small" style={{ marginBottom: 16 }}>
                      {planningSteps.map((step, index) => (
                        <Step key={index} title={step.title} icon={step.icon} />
                      ))}
                    </Steps>
                    <Progress 
                      percent={planningProgress} 
                      strokeColor={{
                        '0%': '#1A936F',
                        '50%': '#114B5F',
                        '100%': '#88D498'
                      }}
                      size={8}
                    />
                  </div>
                </div>
              ) : (
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    icon={<RocketOutlined />}
                    className="btn btn-primary"
                    style={{
                      height: 52,
                      fontSize: 17,
                      fontWeight: 600,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #1A936F 0%, #114B5F 100%)',
                      border: 'none'
                    }}
                  >
                    GLM-4.7 智能生成行程
                  </Button>
                </Form.Item>
              )}
            </Form>
          </Card>

          <Card className="card" title={
            <Space>
              <MessageOutlined style={{ color: '#1A936F' }} />
              <span>智能对话</span>
            </Space>
          }>
            <div style={{ 
              height: 400, 
              overflowY: 'auto', 
              marginBottom: 16,
              padding: '16px',
              background: '#f5f7fa',
              borderRadius: 8
            }}>
              {chatMessages.map((msg, index) => (
                <div key={index} style={{ 
                  marginBottom: 16,
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: msg.role === 'user' ? '#1A936F' : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#1a1a1a',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {msg.content}
                    </div>
                    <div style={{ 
                      fontSize: 11, 
                      color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : '#8a8a8a',
                      marginTop: 8,
                      textAlign: 'right'
                    }}>
                      {msg.timestamp.format('HH:mm')}
                    </div>
                  </div>
                </div>
              ))}
              {isChatting && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <Spin size="small" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="告诉AI您的想法或需求..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onPressEnter={handleSendMessage}
                disabled={isChatting || isGenerating}
                className="input"
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                disabled={isChatting || isGenerating || !userInput.trim()}
                className="btn btn-primary"
              >
                发送
              </Button>
            </Space.Compact>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card className="card card-elevated" style={{ marginBottom: 24 }}>
            <Title level={4} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrophyOutlined style={{ color: '#faad14' }} />
              热门目的地
            </Title>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {destinationOptions.map((dest) => (
                <Card
                  key={dest.value}
                  hoverable
                  size="small"
                  className="card"
                  style={{
                    borderRadius: 8,
                    overflow: 'hidden',
                    padding: 0,
                    cursor: 'pointer'
                  }}
                  onClick={() => form.setFieldsValue({ destination: dest.value })}
                >
                  <div style={{
                    height: 80,
                    backgroundImage: `url(${dest.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                      padding: '20px 8px 8px'
                    }}>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
                        {dest.label}
                      </Text>
                    </div>
                  </div>
                  <div style={{ padding: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Rate disabled defaultValue={dest.rating} style={{ fontSize: 10 }} />
                      <Text style={{ fontSize: 11, color: '#8a8a8a' }}>{dest.rating}</Text>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {dest.tags.slice(0, 2).map((tag, idx) => (
                        <Tag key={idx} style={{ fontSize: 10, margin: 0 }}>{tag}</Tag>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          <Card className="card" title={
            <Space>
              <ThunderboltOutlined style={{ color: '#1A936F' }} />
              <span>AI 能力展示</span>
            </Space>
          }>
            <Collapse defaultActiveKey={['1']} ghost>
              <Panel header="🧠 交错式思考" key="1">
                <Paragraph style={{ fontSize: 13, color: '#666', marginBottom: 0 }}>
                  GLM-4.7采用交错式思考模式,深度分析您的需求,从多个角度考虑旅行方案,确保行程的合理性和个性化。
                </Paragraph>
              </Panel>
              <Panel header="🤖 多Agent并行规划" key="2">
                <Paragraph style={{ fontSize: 13, color: '#666', marginBottom: 0 }}>
                  多个GLM-4.7 Agent同时工作:一个规划景点顺序,一个计算交通时间,一个优化步行路线,最终生成最优方案。
                </Paragraph>
              </Panel>
              <Panel header="🔧 动态工具调用" key="3">
                <Paragraph style={{ fontSize: 13, color: '#666', marginBottom: 0 }}>
                  实时分析价格趋势,自动计算交通、住宿、餐饮成本,并提供预算预警和替代方案。
                </Paragraph>
              </Panel>
              <Panel header="📝 128K 输出长度" key="4">
                <Paragraph style={{ fontSize: 13, color: '#666', marginBottom: 0 }}>
                  支持超长上下文窗口,行程详情一应俱全,提供完整的旅行攻略。
                </Paragraph>
              </Panel>
            </Collapse>
          </Card>

          {showOptimizationPanel && optimizationSuggestions.length > 0 && (
            <Card 
              className="card card-elevated" 
              style={{ 
                position: 'fixed',
                right: 24,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 320,
                zIndex: 1000,
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
              title={
                <Space>
                  <BulbOutlined style={{ color: '#faad14' }} />
                  <span>优化建议</span>
                </Space>
              }
              extra={
                <Button 
                  type="text" 
                  icon={<CloseCircleOutlined />} 
                  onClick={() => setShowOptimizationPanel(false)}
                />
              }
            >
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {optimizationSuggestions.map((suggestion, index) => (
                  <Card key={index} size="small" className="card" style={{ background: '#fafafa' }}>
                    <div style={{ marginBottom: 8 }}>
                      <Tag color={getOptimizationColor(suggestion.type)} style={{ fontSize: 11 }}>
                        {suggestion.type === 'adjustment' ? '调整' : suggestion.type === 'addition' ? '新增' : '替代'}
                      </Tag>
                      <Text strong style={{ marginLeft: 8, fontSize: 13 }}>{suggestion.title}</Text>
                    </div>
                    <Paragraph style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                      {suggestion.content}
                    </Paragraph>
                    <Button 
                      type="primary" 
                      size="small" 
                      block
                      onClick={() => handleApplyOptimization(suggestion)}
                      style={{ fontSize: 12 }}
                    >
                      应用建议
                    </Button>
                  </Card>
                ))}
              </Space>
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span>行程生成成功</span>
          </Space>
        }
        open={showResultModal}
        onCancel={() => setShowResultModal(false)}
        width={900}
        footer={[
          <Button key="back" onClick={() => setShowResultModal(false)}>
            关闭
          </Button>,
          <Button key="regenerate" icon={<ReloadOutlined />} onClick={() => form.submit()}>
            重新生成
          </Button>,
          <Button key="save" icon={<SaveOutlined />} onClick={handleSaveVersion}>
            保存版本
          </Button>,
          <Button key="view" type="primary" icon={<EyeOutlined />} onClick={() => navigate(`/itinerary/${generatedItinerary?.id}`)}>
            查看详情
          </Button>
        ]}
      >
        {generatedItinerary && (
          <div>
            <div style={{ marginBottom: 24, padding: 20, background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)', borderRadius: 12 }}>
              <Title level={4} style={{ margin: '0 0 14px 0' }}>{generatedItinerary.title}</Title>
              <Space direction="vertical" size={8}>
                <Text><strong>预算：</strong>¥{generatedItinerary.budget.toLocaleString()}</Text>
                <Text><strong>预估费用：</strong>¥{generatedItinerary.estimatedCost.toLocaleString()}</Text>
                <Text><strong>偏好：</strong>{generatedItinerary.preferences.join('、')}</Text>
                <Text><strong>优化评分：</strong>
                  <Rate disabled defaultValue={generatedItinerary.optimizationScore / 20} style={{ fontSize: 14 }} />
                  <Text style={{ marginLeft: 8 }}>{generatedItinerary.optimizationScore}分</Text>
                </Text>
              </Space>
            </div>

            {generatedItinerary.aiInsights && (
              <div style={{ marginBottom: 24 }}>
                <Title level={5} style={{ marginBottom: 16 }}>AI 洞察</Title>
                <Row gutter={[16, 16]}>
                  {generatedItinerary.aiInsights.map((insight, index) => (
                    <Col xs={24} sm={8} key={index}>
                      <Card className="card" size="small">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                          {insight.type === 'budget' && <DollarOutlined style={{ color: '#52c41a', fontSize: 20 }} />}
                          {insight.type === 'time' && <ClockCircleOutlined style={{ color: '#1890ff', fontSize: 20 }} />}
                          {insight.type === 'experience' && <StarOutlined style={{ color: '#faad14', fontSize: 20 }} />}
                          <Text strong style={{ marginLeft: 8 }}>{insight.title}</Text>
                        </div>
                        <Paragraph style={{ fontSize: 13, color: '#666', marginBottom: 0 }}>
                          {insight.content}
                        </Paragraph>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            <Title level={5} style={{ marginBottom: 18 }}>行程安排</Title>
            <Collapse defaultActiveKey={['0']} ghost>
              {generatedItinerary.dailyPlan.map((day, dayIndex) => (
                <Panel 
                  header={
                    <Space>
                      <Badge count={day.day} style={{ backgroundColor: '#1A936F' }} />
                      <Text strong>第 {day.day} 天</Text>
                      <Text style={{ color: '#8a8a8a' }}>{day.date}</Text>
                    </Space>
                  } 
                  key={dayIndex}
                >
                  <Timeline
                    items={day.activities.map((activity, actIndex) => ({
                      children: (
                        <div style={{ padding: '12px 16px', background: '#fafafa', borderRadius: 8, marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <Space>
                              <Text type="secondary" style={{ fontSize: 13 }}>{activity.time}</Text>
                              <Tag color={activity.type === 'sightseeing' ? 'blue' : activity.type === 'dining' ? 'orange' : activity.type === 'culture' ? 'purple' : 'green'} style={{ fontSize: 11 }}>
                                {activity.type === 'sightseeing' ? '景点' : activity.type === 'dining' ? '餐饮' : activity.type === 'culture' ? '文化' : '休闲'}
                              </Tag>
                            </Space>
                            <Text style={{ fontSize: 12, color: '#8a8a8a' }}>{activity.duration}</Text>
                          </div>
                          <Text strong style={{ display: 'block', marginBottom: 4 }}>{activity.title}</Text>
                          <Text style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>{activity.description}</Text>
                          <Text style={{ fontSize: 13, color: '#666' }}>📍 {activity.location}</Text>
                        </div>
                      )
                    }))}
                  />
                </Panel>
              ))}
            </Collapse>

            <div style={{ marginTop: 28, padding: 18, background: '#e6f7ff', borderRadius: 12 }}>
              <Title level={5} style={{ margin: '0 0 14px 0', color: '#1890ff' }}>贴心提示</Title>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {generatedItinerary.tips.map((tip, idx) => (
                  <li key={idx} style={{ marginBottom: 8, color: '#666' }}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AIPlanning;
