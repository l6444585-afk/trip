/**
 * AI规划向导组件 - 高保真原型
 * @module modules/ai-planning/components/AIPlanningWizard
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Button,
  Steps,
  Form,
  Input,
  Select,
  DatePicker,
  Slider,
  Radio,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  Progress,
  Spin,
  Alert,
  Timeline,
  Badge,
  Collapse,
  Tooltip,
  message,
  Avatar,
  Statistic,
  Rate,
  Empty
} from 'antd';
import {
  RobotOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  HeartOutlined,
  WalletOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  CompassOutlined,
  TeamOutlined,
  SafetyOutlined,
  CoffeeOutlined,
  CameraOutlined,
  StarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FireOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SaveOutlined,
  ShareAltOutlined,
  EditOutlined,
  EyeOutlined,
  BulbOutlined,
  MessageOutlined,
  SendOutlined,
  CloseCircleOutlined,
  CheckOutlined,
  InfoCircleOutlined,
  CarOutlined,
  RocketOutlined,
  GlobalOutlined,
  UserOutlined,
  SunOutlined,
  CloudOutlined,
  HomeOutlined,
  ShopOutlined,
  RestOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type {
  UserPreferences,
  GeneratedItinerary,
  PlanningProgress,
  ChatMessage,
  OptimizationSuggestion,
  SavedVersion
} from '../types';
import {
  PlanningState,
  POPULAR_DESTINATIONS,
  INTEREST_OPTIONS,
  CONSTRAINT_OPTIONS,
  PLANNING_STEPS,
  AI_PROCESSING_STEPS
} from '../types';
import '../styles/ai-planning.css';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;

/**
 * AI规划向导主组件
 */
export const AIPlanningWizard: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentState, setCurrentState] = useState<PlanningState>(PlanningState.ENTRY);
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<PlanningProgress>({
    currentStep: 0,
    totalSteps: 5,
    percentage: 0,
    stepName: '',
    estimatedTimeRemaining: 0,
    completedSteps: []
  });
  const [generatedItinerary, setGeneratedItinerary] = useState<GeneratedItinerary | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [showOptimizationPanel, setShowOptimizationPanel] = useState(false);
  const [savedVersions, setSavedVersions] = useState<SavedVersion[]>([]);
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // 兴趣标签切换
  const toggleInterest = useCallback((value: string) => {
    setSelectedInterests(prev =>
      prev.includes(value)
        ? prev.filter(i => i !== value)
        : [...prev, value]
    );
  }, []);

  // 约束选项切换
  const toggleConstraint = useCallback((value: string) => {
    setSelectedConstraints(prev =>
      prev.includes(value)
        ? prev.filter(c => c !== value)
        : [...prev, value]
    );
  }, []);

  // 开始规划
  const handleStartPlanning = useCallback(() => {
    setCurrentState(PlanningState.PREFERENCES);
    setCurrentStep(0);
  }, []);

  // 下一步
  const handleNext = useCallback(() => {
    if (currentStep < PLANNING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleGenerate();
    }
  }, [currentStep]);

  // 上一步
  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // 生成行程
  const handleGenerate = useCallback(async () => {
    const values = form.getFieldsValue();
    setCurrentState(PlanningState.LOADING);
    setIsGenerating(true);

    // 模拟AI生成过程
    for (let i = 0; i < AI_PROCESSING_STEPS.length; i++) {
      setProgress({
        currentStep: i,
        totalSteps: AI_PROCESSING_STEPS.length,
        percentage: ((i + 1) / AI_PROCESSING_STEPS.length) * 100,
        stepName: AI_PROCESSING_STEPS[i].name,
        estimatedTimeRemaining: (AI_PROCESSING_STEPS.length - i - 1) * 2,
        completedSteps: Array.from({ length: i }, (_, idx) => idx)
      });
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // 生成模拟行程数据
    const mockItinerary: GeneratedItinerary = {
      id: Date.now().toString(),
      title: `${values.origin} → ${values.destination} ${values.days}日游`,
      origin: values.origin,
      destination: values.destination,
      days: values.days,
      budget: values.budget,
      estimatedCost: Math.floor(values.budget * 0.85),
      preferences: selectedInterests,
      dailyPlan: Array.from({ length: values.days }, (_, i) => ({
        day: i + 1,
        date: dayjs().add(i, 'day').format('YYYY-MM-DD'),
        weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dayjs().add(i, 'day').day()],
        theme: i === 0 ? '初识' + values.destination : `深度探索${i + 1}`,
        budget: Math.floor(values.budget / values.days),
        activities: [
          {
            id: `act-${i}-1`,
            time: '09:00',
            title: '经典景点游览',
            description: '探索当地最具代表性的景点，感受独特魅力',
            location: '市中心景区',
            duration: '3小时',
            type: 'sightseeing',
            cost: 120,
            rating: 4.8,
            tips: ['建议提前购票', '早上人流较少']
          },
          {
            id: `act-${i}-2`,
            time: '12:30',
            title: '特色午餐',
            description: '品尝当地正宗美食，体验地道风味',
            location: '老字号餐厅',
            duration: '1.5小时',
            type: 'dining',
            cost: 80,
            rating: 4.6
          },
          {
            id: `act-${i}-3`,
            time: '14:30',
            title: '文化深度游',
            description: '参观博物馆或历史古迹，了解当地文化',
            location: '文化区',
            duration: '2.5小时',
            type: 'culture',
            cost: 60,
            rating: 4.7
          },
          {
            id: `act-${i}-4`,
            time: '17:30',
            title: '休闲购物时光',
            description: '自由活动，选购特色纪念品',
            location: '商业街区',
            duration: '2小时',
            type: 'leisure',
            cost: 200
          },
          {
            id: `act-${i}-5`,
            time: '20:00',
            title: '精致晚餐',
            description: '享用当地特色晚餐，结束美好一天',
            location: '景观餐厅',
            duration: '2小时',
            type: 'dining',
            cost: 150,
            rating: 4.9
          }
        ]
      })),
      aiInsights: [
        {
          type: 'budget',
          title: '预算分析',
          content: '您的预算分配合理，建议适当增加餐饮预算以获得更好的美食体验',
          suggestion: '可考虑增加200-300元餐饮预算',
          confidence: 0.92
        },
        {
          type: 'time',
          title: '时间安排',
          content: '行程节奏适中，每天有充足的休息时间，适合您的出游风格',
          confidence: 0.88
        },
        {
          type: 'experience',
          title: '体验优化',
          content: '根据您的兴趣偏好，已为您安排多个深度体验项目',
          suggestion: '推荐增加一个当地特色体验项目',
          confidence: 0.85
        }
      ],
      tips: [
        '建议提前预订热门景点门票，避免排队',
        '关注当地天气预报，合理安排行程',
        '准备舒适的步行鞋，每天步行量较大',
        '尝试当地特色美食，不要错过地道风味',
        '保持开放心态，享受旅程中的意外惊喜'
      ],
      optimizationScore: 87,
      generatedAt: dayjs().format(),
      version: 1
    };

    setGeneratedItinerary(mockItinerary);
    setCurrentState(PlanningState.RESULT);
    setIsGenerating(false);
    message.success('AI行程生成成功！');
  }, [form, selectedInterests]);

  // 发送聊天消息
  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: dayjs().format()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatting(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `我已收到您的反馈："${chatInput}"。正在为您分析并提供优化建议...`,
      timestamp: dayjs().format()
    };

    setChatMessages(prev => [...prev, aiMessage]);

    // 生成优化建议
    setOptimizationSuggestions([
      {
        id: '1',
        type: 'adjustment',
        title: '调整建议',
        content: '根据您的反馈，建议调整第二天的行程安排',
        confidence: 0.9
      },
      {
        id: '2',
        type: 'addition',
        title: '新增推荐',
        content: '为您推荐一个符合需求的特色景点',
        confidence: 0.85
      },
      {
        id: '3',
        type: 'alternative',
        title: '替代方案',
        content: '提供一个不同风格的行程选择',
        confidence: 0.8
      }
    ]);
    setShowOptimizationPanel(true);
    setIsChatting(false);
  }, [chatInput]);

  // 保存版本
  const handleSaveVersion = useCallback(() => {
    if (generatedItinerary) {
      const newVersion: SavedVersion = {
        id: Date.now().toString(),
        version: savedVersions.length + 1,
        itinerary: { ...generatedItinerary },
        timestamp: dayjs().format()
      };
      setSavedVersions(prev => [...prev, newVersion]);
      message.success(`版本 V${newVersion.version} 已保存`);
    }
  }, [generatedItinerary, savedVersions]);

  // 渲染入口页
  const renderEntryPage = () => (
    <div className="ai-planning-entry fade-in">
      {/* Hero Section */}
      <div className="entry-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <RobotOutlined />
            <span>AI 智能规划助手</span>
          </div>
          <Title level={1} className="hero-title">
            让 AI 为您定制
            <span className="gradient-text">完美旅程</span>
          </Title>
          <Paragraph className="hero-description">
            基于深度学习技术，分析您的偏好和需求，生成个性化的江浙沪旅游行程方案。
            <br />
            只需几分钟，即可获得专业级的旅行规划。
          </Paragraph>
          <Space size="large" className="hero-actions">
            <Button
              type="primary"
              size="large"
              icon={<ThunderboltOutlined />}
              onClick={handleStartPlanning}
              className="btn-start"
            >
              开始智能规划
            </Button>
            <Button
              size="large"
              icon={<EyeOutlined />}
              className="btn-demo"
            >
              查看示例
            </Button>
          </Space>
        </div>
        <div className="hero-visual">
          <div className="floating-cards">
            <Card className="float-card card-1">
              <CompassOutlined />
              <Text>智能推荐</Text>
            </Card>
            <Card className="float-card card-2">
              <ClockCircleOutlined />
              <Text>时间优化</Text>
            </Card>
            <Card className="float-card card-3">
              <DollarOutlined />
              <Text>预算控制</Text>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <Title level={3} className="section-title">AI 核心能力</Title>
        <Row gutter={[24, 24]}>
          {[
            {
              icon: <BulbOutlined />,
              title: '智能意图识别',
              desc: '深度理解您的旅行需求，精准匹配最佳方案'
            },
            {
              icon: <ThunderboltOutlined />,
              title: '多维度优化',
              desc: '同时考虑时间、预算、兴趣等多维度约束'
            },
            {
              icon: <MessageOutlined />,
              title: '自然语言交互',
              desc: '像与朋友聊天一样，轻松调整行程细节'
            },
            {
              icon: <CheckCircleOutlined />,
              title: '实时反馈优化',
              desc: '根据您的反馈持续学习，不断优化推荐'
            }
          ].map((feature, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card className="feature-card hover-lift">
                <div className="feature-icon">{feature.icon}</div>
                <Title level={5}>{feature.title}</Title>
                <Paragraph>{feature.desc}</Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Popular Destinations */}
      <div className="destinations-section">
        <Title level={3} className="section-title">热门目的地</Title>
        <Row gutter={[16, 16]}>
          {POPULAR_DESTINATIONS.slice(0, 6).map((dest) => (
            <Col xs={24} sm={12} md={8} key={dest.id}>
              <Card
                className="destination-card hover-scale"
                cover={
                  <div className="destination-cover">
                    <img src={dest.image} alt={dest.name} />
                    <div className="destination-overlay">
                      <Rate disabled defaultValue={dest.rating} allowHalf />
                      <Text className="rating-text">{dest.rating}</Text>
                    </div>
                  </div>
                }
                onClick={() => {
                  form.setFieldsValue({ destination: dest.name });
                  handleStartPlanning();
                }}
              >
                <div className="destination-info">
                  <Title level={5}>{dest.name}</Title>
                  <Paragraph ellipsis={{ rows: 1 }}>{dest.description}</Paragraph>
                  <div className="destination-tags">
                    {dest.tags.slice(0, 3).map((tag, idx) => (
                      <Tag key={idx} size="small">{tag}</Tag>
                    ))}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );

  // 渲染偏好设置页
  const renderPreferencesPage = () => (
    <div className="ai-planning-preferences fade-in">
      <div className="wizard-header">
        <Steps current={currentStep} className="wizard-steps">
          {PLANNING_STEPS.map(step => (
            <Step
              key={step.id}
              title={step.title}
              description={step.description}
            />
          ))}
        </Steps>
      </div>

      <Card className="wizard-content">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            days: 3,
            budget: 3000,
            travelStyle: 'relaxed'
          }}
        >
          {/* Step 1: 基础信息 */}
          {currentStep === 0 && (
            <div className="step-content fade-in">
              <Title level={4}>
                <EnvironmentOutlined /> 基础信息
              </Title>
              <Paragraph type="secondary">告诉我们您的出发地和目的地</Paragraph>

              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="出发地"
                    name="origin"
                    rules={[{ required: true, message: '请输入出发地' }]}
                  >
                    <Input
                      size="large"
                      placeholder="例如：上海"
                      prefix={<HomeOutlined />}
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
                      size="large"
                      placeholder="选择目的地"
                      showSearch
                      optionFilterProp="children"
                    >
                      {POPULAR_DESTINATIONS.map(dest => (
                        <Option key={dest.id} value={dest.name}>
                          <Space>
                            <span>{dest.name}</span>
                            <Rate disabled defaultValue={dest.rating} style={{ fontSize: 12 }} />
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="出行日期"
                    name="travelDate"
                    rules={[{ required: true, message: '请选择出行日期' }]}
                  >
                    <DatePicker
                      size="large"
                      style={{ width: '100%' }}
                      placeholder="选择出行日期"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="出行人数"
                    name="travelers"
                    rules={[{ required: true, message: '请选择出行人数' }]}
                  >
                    <Select size="large" placeholder="选择出行人数">
                      <Option value={1}>1人独行</Option>
                      <Option value={2}>2人同行</Option>
                      <Option value={3}>3人小团</Option>
                      <Option value={4}>4人家庭</Option>
                      <Option value={5}>5人及以上</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          {/* Step 2: 行程偏好 */}
          {currentStep === 1 && (
            <div className="step-content fade-in">
              <Title level={4}>
                <HeartOutlined /> 行程偏好
              </Title>
              <Paragraph type="secondary">选择您喜欢的旅行方式和兴趣标签</Paragraph>

              <Form.Item
                label="行程天数"
                name="days"
                rules={[{ required: true }]}
              >
                <div className="days-selector">
                  <Slider
                    min={1}
                    max={15}
                    marks={{
                      1: '1天',
                      3: '3天',
                      7: '7天',
                      15: '15天'
                    }}
                  />
                </div>
              </Form.Item>

              <Form.Item
                label="出游类型"
                name="travelStyle"
                rules={[{ required: true }]}
              >
                <Radio.Group className="travel-style-group">
                  <Radio.Button value="relaxed">
                    <RestOutlined />
                    <div>休闲度假</div>
                    <small>轻松自在，享受慢生活</small>
                  </Radio.Button>
                  <Radio.Button value="compact">
                    <RocketOutlined />
                    <div>紧凑高效</div>
                    <small>行程充实，打卡更多景点</small>
                  </Radio.Button>
                  <Radio.Button value="deep">
                    <CompassOutlined />
                    <div>深度体验</div>
                    <small>深入探索，感受当地文化</small>
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item label="兴趣标签">
                <div className="interests-grid">
                  {INTEREST_OPTIONS.map(option => (
                    <div
                      key={option.value}
                      className={`interest-card ${selectedInterests.includes(option.value) ? 'selected' : ''}`}
                      onClick={() => toggleInterest(option.value)}
                      style={{ '--accent-color': option.color } as React.CSSProperties}
                    >
                      <div className="interest-icon" style={{ color: option.color }}>
                        {option.icon === 'EnvironmentOutlined' && <EnvironmentOutlined />}
                        {option.icon === 'CameraOutlined' && <CameraOutlined />}
                        {option.icon === 'CoffeeOutlined' && <CoffeeOutlined />}
                        {option.icon === 'CompassOutlined' && <CompassOutlined />}
                        {option.icon === 'SafetyOutlined' && <SafetyOutlined />}
                        {option.icon === 'TeamOutlined' && <TeamOutlined />}
                        {option.icon === 'ThunderboltOutlined' && <ThunderboltOutlined />}
                      </div>
                      <div className="interest-info">
                        <Text strong>{option.label}</Text>
                        <Text type="secondary" className="interest-desc">{option.description}</Text>
                      </div>
                      {selectedInterests.includes(option.value) && (
                        <CheckCircleOutlined className="check-icon" style={{ color: option.color }} />
                      )}
                    </div>
                  ))}
                </div>
              </Form.Item>
            </div>
          )}

          {/* Step 3: 预算约束 */}
          {currentStep === 2 && (
            <div className="step-content fade-in">
              <Title level={4}>
                <WalletOutlined /> 预算与约束
              </Title>
              <Paragraph type="secondary">设定您的预算范围和特殊需求</Paragraph>

              <Form.Item
                label="预算范围"
                name="budget"
                rules={[{ required: true }]}
              >
                <div className="budget-slider">
                  <Slider
                    min={500}
                    max={20000}
                    step={500}
                    marks={{
                      500: '¥500',
                      5000: '¥5k',
                      10000: '¥10k',
                      20000: '¥20k'
                    }}
                    tipFormatter={(value) => `¥${value?.toLocaleString()}`}
                  />
                </div>
              </Form.Item>

              <Form.Item label="出行方式" name="transportMode">
                <Radio.Group className="transport-group">
                  <Radio.Button value="self-drive">
                    <CarOutlined />
                    <div>自驾</div>
                  </Radio.Button>
                  <Radio.Button value="high-speed">
                    <RocketOutlined />
                    <div>高铁</div>
                  </Radio.Button>
                  <Radio.Button value="flight">
                    <GlobalOutlined />
                    <div>飞机</div>
                  </Radio.Button>
                  <Radio.Button value="group">
                    <TeamOutlined />
                    <div>跟团</div>
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item label="规划约束">
                <div className="constraints-grid">
                  {CONSTRAINT_OPTIONS.map(option => (
                    <div
                      key={option.value}
                      className={`constraint-card ${selectedConstraints.includes(option.value) ? 'selected' : ''}`}
                      onClick={() => toggleConstraint(option.value)}
                    >
                      <div className="constraint-icon" style={{ color: option.color }}>
                        {option.icon === 'DollarOutlined' && <DollarOutlined />}
                        {option.icon === 'ClockCircleOutlined' && <ClockCircleOutlined />}
                        {option.icon === 'SafetyOutlined' && <SafetyOutlined />}
                        {option.icon === 'CameraOutlined' && <CameraOutlined />}
                        {option.icon === 'FireOutlined' && <FireOutlined />}
                        {option.icon === 'CompassOutlined' && <CompassOutlined />}
                      </div>
                      <div className="constraint-info">
                        <Text strong>{option.label}</Text>
                        <Text type="secondary" className="constraint-desc">{option.description}</Text>
                      </div>
                    </div>
                  ))}
                </div>
              </Form.Item>
            </div>
          )}

          {/* Step 4: 确认生成 */}
          {currentStep === 3 && (
            <div className="step-content fade-in">
              <Title level={4}>
                <CheckCircleOutlined /> 确认信息
              </Title>
              <Paragraph type="secondary">确认以下信息，AI将为您生成专属行程</Paragraph>

              <div className="summary-cards">
                <Card className="summary-card">
                  <div className="summary-item">
                    <EnvironmentOutlined />
                    <div>
                      <Text type="secondary">行程路线</Text>
                      <Text strong>{form.getFieldValue('origin')} → {form.getFieldValue('destination')}</Text>
                    </div>
                  </div>
                </Card>
                <Card className="summary-card">
                  <div className="summary-item">
                    <CalendarOutlined />
                    <div>
                      <Text type="secondary">出行日期</Text>
                      <Text strong>{form.getFieldValue('travelDate')?.format?.('YYYY-MM-DD') || '待选择'}</Text>
                    </div>
                  </div>
                </Card>
                <Card className="summary-card">
                  <div className="summary-item">
                    <ClockCircleOutlined />
                    <div>
                      <Text type="secondary">行程天数</Text>
                      <Text strong>{form.getFieldValue('days')} 天</Text>
                    </div>
                  </div>
                </Card>
                <Card className="summary-card">
                  <div className="summary-item">
                    <WalletOutlined />
                    <div>
                      <Text type="secondary">预算范围</Text>
                      <Text strong>¥{form.getFieldValue('budget')?.toLocaleString?.()}</Text>
                    </div>
                  </div>
                </Card>
              </div>

              <Alert
                message="AI 即将为您规划行程"
                description={`基于您的偏好：${selectedInterests.map(i => INTEREST_OPTIONS.find(o => o.value === i)?.label).filter(Boolean).join('、') || '未选择'}，我们将生成最优行程方案`}
                type="info"
                showIcon
                className="planning-alert"
              />
            </div>
          )}
        </Form>
      </Card>

      <div className="wizard-footer">
        <Button
          size="large"
          icon={<ArrowLeftOutlined />}
          onClick={handlePrev}
          disabled={currentStep === 0}
        >
          上一步
        </Button>
        <Button
          type="primary"
          size="large"
          icon={currentStep === PLANNING_STEPS.length - 1 ? <ThunderboltOutlined /> : <ArrowRightOutlined />}
          onClick={handleNext}
          className="btn-next"
        >
          {currentStep === PLANNING_STEPS.length - 1 ? '生成行程' : '下一步'}
        </Button>
      </div>
    </div>
  );

  // 渲染加载页
  const renderLoadingPage = () => (
    <div className="ai-planning-loading fade-in">
      <div className="loading-container">
        <div className="loading-avatar">
          <Avatar size={80} icon={<RobotOutlined />} className="ai-avatar" />
          <div className="loading-pulse" />
        </div>

        <Title level={3} className="loading-title">
          AI 正在为您规划行程
        </Title>

        <div className="loading-progress">
          <Progress
            percent={progress.percentage}
            strokeColor={{
              '0%': '#667eea',
              '100%': '#764ba2'
            }}
            strokeWidth={8}
            showInfo={false}
          />
          <Text className="progress-text">{Math.round(progress.percentage)}%</Text>
        </div>

        <div className="loading-steps">
          {AI_PROCESSING_STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`loading-step ${progress.completedSteps.includes(index) ? 'completed' : ''} ${progress.currentStep === index ? 'active' : ''}`}
            >
              <div className="step-icon">
                {progress.completedSteps.includes(index) ? (
                  <CheckOutlined />
                ) : progress.currentStep === index ? (
                  <LoadingOutlined spin />
                ) : (
                  <div className="step-dot" />
                )}
              </div>
              <div className="step-info">
                <Text strong={progress.currentStep === index}>{step.name}</Text>
                <Text type="secondary" className="step-desc">{step.description}</Text>
              </div>
            </div>
          ))}
        </div>

        <Text type="secondary" className="estimated-time">
          预计剩余时间: {progress.estimatedTimeRemaining} 秒
        </Text>
      </div>
    </div>
  );

  // 渲染结果页
  const renderResultPage = () => {
    if (!generatedItinerary) return null;

    return (
      <div className="ai-planning-result fade-in">
        {/* 行程概览 */}
        <Card className="itinerary-overview">
          <div className="overview-header">
            <div className="overview-title">
              <Title level={3}>{generatedItinerary.title}</Title>
              <div className="overview-tags">
                <Tag icon={<CalendarOutlined />}>{generatedItinerary.days}天</Tag>
                <Tag icon={<WalletOutlined />}>预算 ¥{generatedItinerary.budget.toLocaleString()}</Tag>
                <Tag icon={<CheckCircleOutlined />} color="success">AI生成</Tag>
              </div>
            </div>
            <div className="overview-score">
              <div className="score-circle">
                <Text className="score-value">{generatedItinerary.optimizationScore}</Text>
                <Text className="score-label">优化评分</Text>
              </div>
            </div>
          </div>

          <Divider />

          <Row gutter={[24, 24]} className="overview-stats">
            <Col xs={12} sm={6}>
              <Statistic
                title="预估费用"
                value={generatedItinerary.estimatedCost}
                prefix="¥"
                formatter={(value) => value?.toLocaleString()}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="景点数量"
                value={generatedItinerary.dailyPlan.reduce((sum, day) => sum + day.activities.filter(a => a.type === 'sightseeing').length, 0)}
                suffix="个"
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="餐饮安排"
                value={generatedItinerary.dailyPlan.reduce((sum, day) => sum + day.activities.filter(a => a.type === 'dining').length, 0)}
                suffix="顿"
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="节省预算"
                value={Math.round((1 - generatedItinerary.estimatedCost / generatedItinerary.budget) * 100)}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>
        </Card>

        {/* AI洞察 */}
        <div className="ai-insights-section">
          <Title level={4}>
            <BulbOutlined /> AI 智能洞察
          </Title>
          <Row gutter={[16, 16]}>
            {generatedItinerary.aiInsights.map((insight, index) => (
              <Col xs={24} md={8} key={index}>
                <Card className="insight-card">
                  <div className="insight-header">
                    {insight.type === 'budget' && <DollarOutlined style={{ color: '#52c41a' }} />}
                    {insight.type === 'time' && <ClockCircleOutlined style={{ color: '#1890ff' }} />}
                    {insight.type === 'experience' && <StarOutlined style={{ color: '#faad14' }} />}
                    <Text strong>{insight.title}</Text>
                  </div>
                  <Paragraph>{insight.content}</Paragraph>
                  {insight.suggestion && (
                    <Alert
                      message={insight.suggestion}
                      type="info"
                      showIcon
                      className="insight-suggestion"
                    />
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* 行程安排 */}
        <div className="daily-plan-section">
          <Title level={4}>
            <CalendarOutlined /> 详细行程
          </Title>
          <Collapse defaultActiveKey={['0']} className="daily-plan-collapse">
            {generatedItinerary.dailyPlan.map((day, dayIndex) => (
              <Panel
                key={dayIndex}
                header={
                  <div className="day-header">
                    <Badge count={day.day} className="day-badge" />
                    <div className="day-info">
                      <Text strong>第 {day.day} 天</Text>
                      <Text type="secondary">{day.date} {day.weekday}</Text>
                    </div>
                    <Tag className="day-theme">{day.theme}</Tag>
                  </div>
                }
              >
                <Timeline className="activities-timeline">
                  {day.activities.map((activity, actIndex) => (
                    <Timeline.Item
                      key={actIndex}
                      dot={
                        <div className={`activity-dot ${activity.type}`}>
                          {activity.type === 'sightseeing' && <CameraOutlined />}
                          {activity.type === 'dining' && <CoffeeOutlined />}
                          {activity.type === 'culture' && <ShopOutlined />}
                          {activity.type === 'leisure' && <RestOutlined />}
                        </div>
                      }
                    >
                      <Card className="activity-card" size="small">
                        <div className="activity-header">
                          <div className="activity-time">
                            <ClockCircleOutlined />
                            <Text strong>{activity.time}</Text>
                            <Text type="secondary">{activity.duration}</Text>
                          </div>
                          <Tag color={
                            activity.type === 'sightseeing' ? 'blue' :
                            activity.type === 'dining' ? 'orange' :
                            activity.type === 'culture' ? 'purple' : 'green'
                          }>
                            {activity.type === 'sightseeing' ? '景点' :
                             activity.type === 'dining' ? '餐饮' :
                             activity.type === 'culture' ? '文化' : '休闲'}
                          </Tag>
                        </div>
                        <Title level={5} className="activity-title">{activity.title}</Title>
                        <Paragraph className="activity-desc">{activity.description}</Paragraph>
                        <div className="activity-footer">
                          <Text type="secondary">
                            <EnvironmentOutlined /> {activity.location}
                          </Text>
                          {activity.cost && (
                            <Text type="secondary">
                              <DollarOutlined /> ¥{activity.cost}
                            </Text>
                          )}
                          {activity.rating && (
                            <Rate disabled defaultValue={activity.rating} style={{ fontSize: 12 }} />
                          )}
                        </div>
                      </Card>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Panel>
            ))}
          </Collapse>
        </div>

        {/* 贴心提示 */}
        <Card className="tips-section">
          <Title level={5}>
            <InfoCircleOutlined /> 贴心提示
          </Title>
          <ul className="tips-list">
            {generatedItinerary.tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </Card>

        {/* 智能对话 */}
        <Card className="chat-section">
          <Title level={5}>
            <MessageOutlined /> 与 AI 对话优化
          </Title>
          <div className="chat-messages">
            {chatMessages.length === 0 ? (
              <Empty description="发送消息与AI对话，调整您的行程" />
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className={`chat-message ${msg.role}`}>
                  <Avatar
                    icon={msg.role === 'assistant' ? <RobotOutlined /> : <UserOutlined />}
                    className={msg.role}
                  />
                  <div className="message-content">
                    <Text>{msg.content}</Text>
                    <Text type="secondary" className="message-time">
                      {dayjs(msg.timestamp).format('HH:mm')}
                    </Text>
                  </div>
                </div>
              ))
            )}
            {isChatting && (
              <div className="chat-message assistant loading">
                <Avatar icon={<RobotOutlined />} className="assistant" />
                <Spin size="small" />
              </div>
            )}
          </div>
          <div className="chat-input">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onPressEnter={handleSendMessage}
              placeholder="告诉AI您的想法，例如：我想增加一些美食体验..."
              suffix={
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isChatting}
                />
              }
            />
          </div>
        </Card>

        {/* 优化建议面板 */}
        {showOptimizationPanel && optimizationSuggestions.length > 0 && (
          <Card className="optimization-panel">
            <div className="panel-header">
              <Title level={5}>
                <BulbOutlined /> 优化建议
              </Title>
              <Button
                type="text"
                icon={<CloseCircleOutlined />}
                onClick={() => setShowOptimizationPanel(false)}
              />
            </div>
            <Space direction="vertical" style={{ width: '100%' }}>
              {optimizationSuggestions.map((suggestion) => (
                <Card key={suggestion.id} size="small" className="suggestion-card">
                  <div className="suggestion-header">
                    <Tag color={
                      suggestion.type === 'adjustment' ? 'blue' :
                      suggestion.type === 'addition' ? 'green' : 'orange'
                    }>
                      {suggestion.type === 'adjustment' ? '调整' :
                       suggestion.type === 'addition' ? '新增' : '替代'}
                    </Tag>
                    <Text strong>{suggestion.title}</Text>
                  </div>
                  <Paragraph>{suggestion.content}</Paragraph>
                  <Button type="primary" size="small" block>
                    应用建议
                  </Button>
                </Card>
              ))}
            </Space>
          </Card>
        )}

        {/* 操作按钮 */}
        <div className="result-actions">
          <Button
            size="large"
            icon={<ReloadOutlined />}
            onClick={() => setCurrentState(PlanningState.PREFERENCES)}
          >
            重新规划
          </Button>
          <Button
            size="large"
            icon={<EditOutlined />}
          >
            编辑行程
          </Button>
          <Button
            size="large"
            icon={<SaveOutlined />}
            onClick={handleSaveVersion}
          >
            保存行程
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<ShareAltOutlined />}
          >
            分享行程
          </Button>
        </div>
      </div>
    );
  };

  // 根据当前状态渲染对应页面
  const renderContent = () => {
    switch (currentState) {
      case PlanningState.ENTRY:
        return renderEntryPage();
      case PlanningState.PREFERENCES:
        return renderPreferencesPage();
      case PlanningState.LOADING:
        return renderLoadingPage();
      case PlanningState.RESULT:
        return renderResultPage();
      default:
        return renderEntryPage();
    }
  };

  return (
    <div className="ai-planning-wizard">
      {renderContent()}
    </div>
  );
};

export default AIPlanningWizard;
