import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Typography, Button, Card, Row, Col, Divider, Form, Input, Select, message, Tag, Modal, Space, DatePicker, Checkbox, Progress, Tabs, Badge, Spin, Alert } from 'antd';
import { RocketOutlined, SearchOutlined, SaveOutlined, ReloadOutlined, CheckCircleOutlined, CalendarOutlined, ClockCircleOutlined, RobotOutlined, BulbOutlined, AimOutlined, MessageOutlined, SendOutlined, CloseCircleOutlined, EyeOutlined, ShareAltOutlined, DownloadOutlined, SettingOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import AIAccounting from '../../components/AIAccounting';
import '../../styles/hero-title.css';

import { PopularDestinations, InterestTags, BudgetPlanner, TravelStyleSelector } from './components';
import { useBudgetState, usePlanningState } from './hooks';
import { popularDestinations, interestTags, travelStyles, attractionsData, accommodationData, diningData } from './constants/destinations';

const { Title, Paragraph, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const Home = () => {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  
  const [searchText, setSearchText] = useState('');
  const [showResultModal, setShowResultModal] = useState(false);
  const [form] = Form.useForm();
  const [isNavigating, setIsNavigating] = useState(false);
  
  const { budget, updateBudget, resetBudget } = useBudgetState();
  const {
    tripDays,
    setTripDays,
    dateRange,
    setDateRange,
    dailyTimeSlots,
    selectedTags,
    selectedStyle,
    isGenerating,
    setIsGenerating,
    generatedItinerary,
    setGeneratedItinerary,
    handleTagChange,
    handleStyleChange,
    handleTimeSlotChange,
    resetPlanning
  } = usePlanningState();

  const [activePlanningTab, setActivePlanningTab] = useState('quick');
  const [planningStep, setPlanningStep] = useState(0);
  const [planningProgress, setPlanningProgress] = useState(0);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: '您好！我是GLM-4.7智能旅行规划助手。\n\n我可以帮您：\n• 规划个性化行程\n• 推荐景点和美食\n• 优化预算分配\n• 解答旅行疑问\n\n请告诉我您的旅行想法，例如"我想去杭州玩3天，预算3000元"',
      timestamp: dayjs()
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [selectedConstraints, setSelectedConstraints] = useState([]);
  const [aiPlanningForm] = Form.useForm();

  const filteredDestinations = useMemo(() => {
    if (!searchText) return popularDestinations;
    return popularDestinations.filter(dest => 
      dest.name.toLowerCase().includes(searchText.toLowerCase()) ||
      dest.city.toLowerCase().includes(searchText.toLowerCase()) ||
      dest.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()))
    );
  }, [searchText]);

  const handleQuickPlan = useCallback(async (destination) => {
    setIsNavigating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate('/itinerary/new', {
        state: {
          destination: destination.city,
          days: 3,
          style: selectedStyle,
          interests: selectedTags
        }
      });
    } catch (error) {
      message.error('跳转失败，请重试');
    } finally {
      setIsNavigating(false);
    }
  }, [navigate, selectedStyle, selectedTags]);

  const handleGenerateItinerary = useCallback(async () => {
    setIsGenerating(true);
    setPlanningProgress(0);
    setPlanningStep(1);

    try {
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setPlanningProgress(i);
        if (i === 30) setPlanningStep(2);
        if (i === 60) setPlanningStep(3);
        if (i === 90) setPlanningStep(4);
      }

      const mockItinerary = {
        title: `${selectedStyle}之旅 - ${tripDays}天`,
        days: Array.from({ length: tripDays }, (_, i) => ({
          day: i + 1,
          date: dateRange ? dayjs(dateRange[0]).add(i, 'day').format('YYYY-MM-DD') : `第${i + 1}天`,
          activities: [
            { time: '09:00', activity: '出发前往目的地', type: 'transport' },
            { time: '10:00', activity: '游览主要景点', type: 'attraction' },
            { time: '12:00', activity: '午餐时间', type: 'dining' },
            { time: '14:00', activity: '下午活动', type: 'attraction' },
            { time: '18:00', activity: '晚餐', type: 'dining' },
            { time: '20:00', activity: '夜景欣赏', type: 'attraction' }
          ]
        })),
        budget: budget,
        style: selectedStyle,
        interests: selectedTags
      };

      setGeneratedItinerary(mockItinerary);
      setShowResultModal(true);
      message.success('行程生成成功！');
    } catch (error) {
      message.error('生成失败，请重试');
    } finally {
      setIsGenerating(false);
      setPlanningStep(0);
      setPlanningProgress(0);
    }
  }, [tripDays, dateRange, budget, selectedStyle, selectedTags]);

  const handleSendMessage = useCallback(async () => {
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

      const assistantMessage = {
        role: 'assistant',
        content: `感谢您的咨询！根据您的需求"${userInput}"，我为您推荐以下方案：\n\n1. 建议游玩天数：3-5天\n2. 推荐景点：西湖、灵隐寺、宋城\n3. 预算参考：人均2000-3000元\n\n您还有其他问题吗？`,
        timestamp: dayjs()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      message.error('发送失败，请重试');
    } finally {
      setIsChatting(false);
    }
  }, [userInput]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  return (
    <div className="fade-in">
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .fade-in {
          animation: fadeIn 0.6s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <PopularDestinations 
        destinations={filteredDestinations}
        onQuickPlan={handleQuickPlan}
        isNavigating={isNavigating}
      />

      <div style={{ 
        background: 'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)',
        padding: '60px 20px',
        borderRadius: '24px',
        marginBottom: 60,
        boxShadow: '0 20px 60px rgba(0, 188, 212, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000)',
          backgroundSize: '400% 100%',
          animation: 'gradientMove 3s ease infinite'
        }} />
        
        <Row gutter={[32, 32]} align="middle" justify="center">
          <Col xs={24}>
            <div className="hero-title-container">
              <h1 className="hero-main-title">
                江浙沪旅游行程规划系统
              </h1>
              <p className="hero-subtitle">
                智能规划 · 品质出行 · 畅游江南
              </p>
              <div className="hero-tags">
                <span className="hero-tag">🎯 智能推荐</span>
                <span className="hero-tag">🗺️ 路线优化</span>
                <span className="hero-tag">💰 预算管理</span>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 60 }}>
        <Col xs={24} lg={12}>
          <Card style={{ borderRadius: 16, height: '100%' }}>
            <InterestTags 
              selectedTags={selectedTags}
              onTagChange={handleTagChange}
              tags={interestTags}
            />
            <TravelStyleSelector
              selectedStyle={selectedStyle}
              onStyleChange={handleStyleChange}
              styles={travelStyles}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <BudgetPlanner 
            budget={budget}
            onBudgetChange={updateBudget}
          />
        </Col>
      </Row>

      <Card style={{ borderRadius: 16, marginBottom: 60 }}>
        <Tabs activeKey={activePlanningTab} onChange={setActivePlanningTab}>
          <Tabs.TabPane tab="快速规划" key="quick">
            <Row gutter={[24, 24]}>
              <Col xs={24} md={8}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>行程天数</Text>
                  <Input 
                    type="number" 
                    min={1} 
                    max={30}
                    value={tripDays}
                    onChange={(e) => setTripDays(parseInt(e.target.value) || 1)}
                    style={{ marginTop: 8 }}
                    addonAfter="天"
                  />
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>出行日期</Text>
                  <RangePicker 
                    style={{ width: '100%', marginTop: 8 }}
                    value={dateRange}
                    onChange={setDateRange}
                  />
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>每日时段</Text>
                  <div style={{ marginTop: 8 }}>
                    <Checkbox 
                      checked={dailyTimeSlots.morning}
                      onChange={() => handleTimeSlotChange('morning')}
                    >上午</Checkbox>
                    <Checkbox 
                      checked={dailyTimeSlots.afternoon}
                      onChange={() => handleTimeSlotChange('afternoon')}
                    >下午</Checkbox>
                    <Checkbox 
                      checked={dailyTimeSlots.evening}
                      onChange={() => handleTimeSlotChange('evening')}
                    >晚上</Checkbox>
                  </div>
                </div>
              </Col>
            </Row>
            <Button
              type="primary"
              size="large"
              icon={isGenerating ? <LoadingOutlined /> : <RocketOutlined />}
              onClick={handleGenerateItinerary}
              loading={isGenerating}
              style={{
                marginTop: 24,
                borderRadius: 8,
                height: 48,
                padding: '0 48px'
              }}
            >
              {isGenerating ? '正在生成...' : '开始智能规划'}
            </Button>
            {isGenerating && (
              <div style={{ marginTop: 24 }}>
                <Progress percent={planningProgress} status="active" />
                <Text type="secondary">
                  {planningStep === 1 && '正在分析您的偏好...'}
                  {planningStep === 2 && '正在匹配景点数据...'}
                  {planningStep === 3 && '正在优化行程路线...'}
                  {planningStep === 4 && '正在生成最终方案...'}
                </Text>
              </div>
            )}
          </Tabs.TabPane>
          <Tabs.TabPane tab="AI对话规划" key="ai">
            <div style={{ height: 400, overflowY: 'auto', marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: 16
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: 16,
                    background: msg.role === 'user' ? '#1890ff' : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#333',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <TextArea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="输入您的旅行需求..."
                autoSize={{ minRows: 1, maxRows: 3 }}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button 
                type="primary" 
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                loading={isChatting}
              >
                发送
              </Button>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Card>

      <Modal
        title="生成的行程方案"
        open={showResultModal}
        onCancel={() => setShowResultModal(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setShowResultModal(false)}>
            关闭
          </Button>,
          <Button key="save" type="primary" icon={<SaveOutlined />}>
            保存行程
          </Button>
        ]}
      >
        {generatedItinerary && (
          <div>
            <Title level={4}>{generatedItinerary.title}</Title>
            {generatedItinerary.days.map((day, idx) => (
              <Card key={idx} size="small" style={{ marginBottom: 16 }}>
                <Title level={5}>{day.date}</Title>
                {day.activities.map((activity, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <Text strong>{activity.time}</Text>
                    <Text> - {activity.activity}</Text>
                  </div>
                ))}
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Home;
