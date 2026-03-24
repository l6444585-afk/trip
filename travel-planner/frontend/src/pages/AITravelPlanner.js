import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, Input, Button, message, Space, Row, Col, Typography, Divider, Tag, Rate, Modal, Badge, Spin, Alert, Collapse, Checkbox, Select, InputNumber, Tooltip, Avatar, List, Drawer, Form, Popconfirm, Empty } from 'antd';
import { RocketOutlined, ThunderboltOutlined, EnvironmentOutlined, DollarOutlined, CameraOutlined, CoffeeOutlined, CompassOutlined, SafetyOutlined, TeamOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, SendOutlined, ReloadOutlined, SaveOutlined, BulbOutlined, FireOutlined, StarOutlined, RobotOutlined, AimOutlined, TrophyOutlined, MessageOutlined, EyeOutlined, DeleteOutlined, HistoryOutlined, SettingOutlined, ExportOutlined, CopyOutlined, HeartOutlined, HeartFilled, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import '../styles/design-system.css';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8890';

const AITravelPlanner = () => {
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [showQuickPlan, setShowQuickPlan] = useState(false);
  const [quickPlanForm] = Form.useForm();
  const [generatedItinerary, setGeneratedItinerary] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [savedItineraries, setSavedItineraries] = useState([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [context, setContext] = useState({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  const userId = localStorage.getItem('userId') || 'guest_user';

  const destinationOptions = [
    { value: '杭州', label: '杭州', emoji: '🌸', image: '/images/cities/hangzhou.jpg', highlights: ['西湖', '灵隐寺', '宋城'] },
    { value: '上海', label: '上海', emoji: '🌃', image: '/images/cities/shanghai.jpg', highlights: ['外滩', '迪士尼', '豫园'] },
    { value: '苏州', label: '苏州', emoji: '🏯', image: '/images/cities/suzhou.jpg', highlights: ['拙政园', '虎丘', '平江路'] },
    { value: '南京', label: '南京', emoji: '🏛️', image: '/images/cities/nanjing.jpg', highlights: ['夫子庙', '中山陵', '玄武湖'] },
    { value: '无锡', label: '无锡', emoji: '🌊', image: '/images/cities/wuxi.jpg', highlights: ['太湖', '灵山', '鼋头渚'] },
    { value: '宁波', label: '宁波', emoji: '🌅', image: '/images/cities/ningbo.jpg', highlights: ['天一阁', '东钱湖', '老外滩'] },
    { value: '嘉兴', label: '嘉兴', emoji: '🏘️', image: '/images/cities/jiaxing.jpg', highlights: ['乌镇', '西塘', '南湖'] },
    { value: '舟山', label: '舟山', emoji: '🏝️', image: '/images/cities/zhoushan.jpg', highlights: ['普陀山', '朱家尖', '桃花岛'] }
  ];

  const interestOptions = [
    { label: '自然风光', value: '自然风光', icon: <EnvironmentOutlined />, color: '#52c41a' },
    { label: '历史文化', value: '历史文化', icon: <CameraOutlined />, color: '#722ed1' },
    { label: '美食探索', value: '美食探索', icon: <CoffeeOutlined />, color: '#fa8c16' },
    { label: '城市漫步', value: '城市漫步', icon: <CompassOutlined />, color: '#1890ff' },
    { label: '摄影打卡', value: '摄影打卡', icon: <CameraOutlined />, color: '#eb2f96' },
    { label: '休闲度假', value: '休闲度假', icon: <SafetyOutlined />, color: '#13c2c2' },
    { label: '亲子游玩', value: '亲子游玩', icon: <TeamOutlined />, color: '#faad14' },
    { label: '户外探险', value: '户外探险', icon: <ThunderboltOutlined />, color: '#f5222d' }
  ];

  const companionOptions = [
    { value: '情侣', label: '情侣出行', icon: '💑' },
    { value: '朋友', label: '朋友结伴', icon: '👥' },
    { value: '家人', label: '家庭出游', icon: '👨‍👩‍👧‍👦' },
    { value: '独自', label: '独自旅行', icon: '🧳' },
    { value: '团建', label: '公司团建', icon: '🏢' }
  ];

  useEffect(() => {
    loadChatHistory();
    loadSavedItineraries();
    handleQuickPlanFromHome();
  }, []);

  const handleQuickPlanFromHome = () => {
    const quickPlanData = sessionStorage.getItem('quickPlanDestination');
    if (quickPlanData) {
      try {
        const data = JSON.parse(quickPlanData);
        if (data.timestamp && Date.now() - data.timestamp < 60000) {
          const welcomeMessage = {
            role: 'assistant',
            content: `欢迎来到AI规划模块！🎉\n\n您选择了【${data.destination}】作为目的地${data.preferences?.length ? `，偏好：${data.preferences.join('、')}` : ''}。\n\n请告诉我您的行程天数、预算等信息，我来为您规划完美的旅程！`,
            timestamp: dayjs().toISOString()
          };
          setChatMessages([welcomeMessage]);
          setUserInput(`我想去${data.destination}旅游${data.preferences?.length ? `，喜欢${data.preferences.join('、')}` : ''}，请帮我规划行程`);
        }
      } catch (e) {
        console.error('Failed to parse quick plan data:', e);
      }
      sessionStorage.removeItem('quickPlanDestination');
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, streamingContent]);

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-travel/history/${userId}`);
      const data = await response.json();
      if (data.success && data.history) {
        setChatMessages(data.history);
        setContext(data.context || {});
      }
    } catch (error) {
      console.log('No previous history');
    }
  };

  const loadSavedItineraries = () => {
    const saved = localStorage.getItem('savedItineraries');
    if (saved) {
      setSavedItineraries(JSON.parse(saved));
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isChatting) return;

    const userMessage = {
      role: 'user',
      content: userInput,
      timestamp: dayjs().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsChatting(true);
    setStreamingContent('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-travel/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message: userInput,
          stream: false
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const aiMessage = {
          role: 'assistant',
          content: data.reply,
          timestamp: dayjs().toISOString()
        };
        setChatMessages(prev => [...prev, aiMessage]);
        setContext(data.context || {});
        
        if (data.reply.includes('```json') || data.reply.includes('"itinerary"')) {
          tryExtractItinerary(data.reply);
        }
      } else {
        message.error('AI响应失败，请重试');
      }
    } catch (error) {
      console.error('Chat error:', error);
      message.error('网络错误，请检查连接');
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，网络连接出现问题。请检查您的网络后重试。',
        timestamp: dayjs().toISOString()
      }]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleStreamMessage = async () => {
    if (!userInput.trim() || isStreaming) return;

    const userMessage = {
      role: 'user',
      content: userInput,
      timestamp: dayjs().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsStreaming(true);
    setStreamingContent('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-travel/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message: userInput,
          stream: true
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                setStreamingContent(fullContent);
              }
              if (data.done) {
                setContext(data.context || {});
              }
            } catch (e) {}
          }
        }
      }

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: fullContent,
        timestamp: dayjs().toISOString()
      }]);
      setStreamingContent('');
      
    } catch (error) {
      console.error('Stream error:', error);
      message.error('流式响应失败');
    } finally {
      setIsStreaming(false);
    }
  };

  const tryExtractItinerary = (content) => {
    try {
      let jsonStr = content;
      if (content.includes('```json')) {
        jsonStr = content.split('```json')[1].split('```')[0];
      } else if (content.includes('```')) {
        jsonStr = content.split('```')[1].split('```')[0];
      }
      
      const parsed = JSON.parse(jsonStr.trim());
      if (parsed.itinerary || parsed.trip_id) {
        setGeneratedItinerary(parsed);
      }
    } catch (e) {}
  };

  const handleQuickPlan = async (values) => {
    setShowQuickPlan(false);
    setIsChatting(true);

    const prompt = `请为我规划一个行程：
- 出发城市：${values.departure}
- 目的地：${values.destination}
- 天数：${values.days}天
- 预算：${values.budget}元
- 同行人员：${values.companionType}
- 兴趣偏好：${values.interests?.join('、') || '无特别偏好'}
- 交通方式：${values.travelMode || '公共交通'}

请生成详细的JSON格式行程规划。`;

    setChatMessages(prev => [...prev, {
      role: 'user',
      content: prompt,
      timestamp: dayjs().toISOString()
    }]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-travel/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ...values
        })
      });

      const data = await response.json();
      
      if (data.success && data.itinerary) {
        setGeneratedItinerary(data.itinerary);
        setShowResultModal(true);
        
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ 行程规划完成！已为您生成${values.days}天的${values.destination}之旅。\n\n点击查看详细行程，或继续与我对话进行调整。`,
          timestamp: dayjs().toISOString()
        }]);
      }
    } catch (error) {
      message.error('生成失败，请重试');
    } finally {
      setIsChatting(false);
    }
  };

  const handleClearSession = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/ai-travel/session/${userId}`, { method: 'DELETE' });
      setChatMessages([]);
      setContext({});
      message.success('对话已重置');
    } catch (error) {
      message.error('重置失败');
    }
  };

  const handleSaveItinerary = () => {
    if (!generatedItinerary) return;
    
    const newSaved = {
      id: Date.now(),
      itinerary: generatedItinerary,
      savedAt: dayjs().toISOString()
    };
    
    const updated = [newSaved, ...savedItineraries].slice(0, 20);
    setSavedItineraries(updated);
    localStorage.setItem('savedItineraries', JSON.stringify(updated));
    message.success('行程已保存');
  };

  const handleExportJSON = () => {
    if (!generatedItinerary) return;
    
    const blob = new Blob([JSON.stringify(generatedItinerary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `行程规划_${dayjs().format('YYYYMMDD_HHmmss')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('已导出JSON文件');
  };

  const handleCopyContent = (content) => {
    navigator.clipboard.writeText(content);
    message.success('已复制到剪贴板');
  };

  const quickActions = [
    { label: '周末2日游推荐', prompt: '推荐一个适合周末2天的江浙沪旅游目的地' },
    { label: '情侣浪漫游', prompt: '推荐适合情侣的浪漫旅游路线' },
    { label: '家庭亲子游', prompt: '推荐适合带小孩的家庭旅游路线' },
    { label: '小众秘境探索', prompt: '推荐一些江浙沪的小众秘境景点' }
  ];

  const renderMessage = (msg, index) => {
    const isUser = msg.role === 'user';
    
    return (
      <div 
        key={index} 
        style={{ 
          marginBottom: 16,
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start'
        }}
      >
        <div style={{ maxWidth: '80%' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            {!isUser && (
              <Avatar 
                style={{ backgroundColor: '#1A936F', flexShrink: 0 }}
                icon={<RobotOutlined />}
              />
            )}
            <div>
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  background: isUser ? 'linear-gradient(135deg, #1A936F 0%, #114B5F 100%)' : '#fff',
                  color: isUser ? '#fff' : '#1a1a1a',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: 'none'
                }}
                bodyStyle={{ padding: '12px 16px' }}
              >
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 14 }}>
                  {msg.content}
                </div>
              </Card>
              <div style={{ 
                fontSize: 11, 
                color: '#8a8a8a',
                marginTop: 4,
                textAlign: isUser ? 'right' : 'left'
              }}>
                {dayjs(msg.timestamp).format('HH:mm')}
                {!isUser && (
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyContent(msg.content)}
                    style={{ marginLeft: 8, color: '#8a8a8a' }}
                  />
                )}
              </div>
            </div>
            {isUser && (
              <Avatar 
                style={{ backgroundColor: '#52c41a', flexShrink: 0 }}
                icon={<TeamOutlined />}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
              <RobotOutlined style={{ color: '#1A936F' }} />
              AI 智能规划
            </Title>
            <Paragraph style={{ color: '#8a8a8a', marginTop: 8, marginBottom: 0 }}>
              江浙沪旅游规划专家 · 自然对话式行程规划
            </Paragraph>
          </div>
          <Space>
            <Tooltip title="历史行程">
              <Button 
                icon={<HistoryOutlined />} 
                onClick={() => setShowHistoryDrawer(true)}
              />
            </Tooltip>
            <Tooltip title="快速规划">
              <Button 
                type="primary"
                icon={<ThunderboltOutlined />} 
                onClick={() => setShowQuickPlan(true)}
                style={{ background: 'linear-gradient(135deg, #1A936F 0%, #114B5F 100%)', border: 'none' }}
              >
                快速规划
              </Button>
            </Tooltip>
          </Space>
        </div>
      </div>

      <Row gutter={16} style={{ flex: 1, minHeight: 0 }}>
        <Col xs={24} lg={18} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Card 
            style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 16 }}
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
          >
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: 16,
              background: 'linear-gradient(180deg, #f8f9ff 0%, #fff 100%)'
            }}>
              {chatMessages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <RobotOutlined style={{ fontSize: 64, color: '#1A936F', marginBottom: 24 }} />
                  <Title level={3} style={{ marginBottom: 16 }}>你好！我是江浙沪旅游规划专家 🌟</Title>
                  <Paragraph style={{ color: '#666', marginBottom: 32 }}>
                    我可以帮你规划江浙沪地区的完美旅程<br/>
                    告诉我你的想法，我来为你量身定制行程
                  </Paragraph>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
                    {quickActions.map((action, idx) => (
                      <Tag 
                        key={idx}
                        style={{ 
                          padding: '8px 16px', 
                          cursor: 'pointer',
                          borderRadius: 20,
                          background: '#fff',
                          border: '1px solid #d9d9d9'
                        }}
                        onClick={() => {
                          setUserInput(action.prompt);
                        }}
                      >
                        {action.label}
                      </Tag>
                    ))}
                  </div>
                  <Alert
                    message="💡 提示"
                    description="你可以直接描述需求，如：'我想从上海出发，周末两天去杭州玩，预算1000元左右'"
                    type="info"
                    showIcon
                    style={{ textAlign: 'left', maxWidth: 500, margin: '0 auto' }}
                  />
                </div>
              )}
              
              {chatMessages.map((msg, index) => renderMessage(msg, index))}
              
              {(isStreaming || isChatting) && streamingContent && (
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ maxWidth: '80%' }}>
                    <Card
                      size="small"
                      style={{
                        borderRadius: 12,
                        background: '#fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                        {streamingContent}
                        <span className="typing-cursor">▊</span>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
              
              {(isChatting || isStreaming) && !streamingContent && (
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-start' }}>
                  <Avatar style={{ backgroundColor: '#1A936F' }} icon={<RobotOutlined />} />
                  <div style={{ marginLeft: 8, padding: '12px 16px', background: '#fff', borderRadius: 12 }}>
                    <Spin indicator={<LoadingOutlined style={{ color: '#1A936F' }} spin />} />
                    <Text style={{ marginLeft: 8, color: '#8a8a8a' }}>AI正在思考...</Text>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
            
            <div style={{ 
              padding: 16, 
              borderTop: '1px solid #f0f0f0',
              background: '#fff'
            }}>
              <Space.Compact style={{ width: '100%' }}>
                <TextArea
                  placeholder="描述你的旅行想法... 例如：我想从上海出发，周末两天去杭州玩"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isChatting || isStreaming}
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  style={{ flex: 1, borderRadius: '8px 0 0 8px' }}
                />
                <Popconfirm
                  title="确定要重置对话吗？"
                  onConfirm={handleClearSession}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button 
                    icon={<ReloadOutlined />}
                    style={{ borderRadius: 0 }}
                  />
                </Popconfirm>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  disabled={isChatting || isStreaming || !userInput.trim()}
                  style={{ 
                    borderRadius: '0 8px 8px 0',
                    background: 'linear-gradient(135deg, #1A936F 0%, #114B5F 100%)',
                    border: 'none'
                  }}
                >
                  发送
                </Button>
              </Space.Compact>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#8a8a8a' }}>
                  按 Enter 发送，Shift + Enter 换行
                </Text>
                {context.destination && (
                  <Space>
                    <Tag color="blue">{context.departure} → {context.destination}</Tag>
                    {context.days && <Tag color="green">{context.days}天</Tag>}
                    {context.budget && <Tag color="orange">¥{context.budget}</Tag>}
                  </Space>
                )}
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={6} style={{ height: '100%' }}>
          <Card 
            title={
              <Space>
                <BulbOutlined style={{ color: '#faad14', fontSize: 20 }} />
                <span style={{ fontSize: 18, fontWeight: 600 }}>热门目的地</span>
              </Space>
            }
            style={{ marginBottom: 16, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <List
              dataSource={destinationOptions}
              renderItem={item => (
                <List.Item 
                  style={{ cursor: 'pointer', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                  onClick={() => setUserInput(`推荐${item.label}的旅游攻略`)}
                >
                  <List.Item.Meta
                    avatar={<span style={{ fontSize: 32 }}>{item.emoji}</span>}
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: 16, fontWeight: 600 }}>{item.label}</span>
                        <div style={{
                          width: 80,
                          height: 50,
                          borderRadius: 8,
                          backgroundImage: `url(${item.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }} />
                      </div>
                    }
                    description={
                      <div style={{ marginTop: 6 }}>
                        {item.highlights.slice(0, 2).map((h, i) => (
                          <Tag key={i} style={{ fontSize: 12, margin: '3px', padding: '2px 8px' }}>{h}</Tag>
                        ))}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card 
            title={
              <Space>
                <SettingOutlined style={{ color: '#1A936F' }} />
                <span>兴趣偏好</span>
              </Space>
            }
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {interestOptions.map(opt => (
                <Tag 
                  key={opt.value}
                  style={{ 
                    cursor: 'pointer',
                    borderRadius: 16,
                    padding: '4px 12px'
                  }}
                  color={opt.color}
                  onClick={() => setUserInput(prev => prev + (prev ? '，' : '') + opt.label)}
                >
                  {opt.icon} {opt.label}
                </Tag>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#1A936F' }} />
            <span>快速规划</span>
          </Space>
        }
        open={showQuickPlan}
        onCancel={() => setShowQuickPlan(false)}
        footer={null}
        width={600}
      >
        <Form
          form={quickPlanForm}
          layout="vertical"
          onFinish={handleQuickPlan}
          initialValues={{
            days: 3,
            budget: 2000,
            companionType: '朋友',
            travelMode: '公共交通'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="出发城市" name="departure" rules={[{ required: true }]}>
                <Select placeholder="选择出发城市">
                  {destinationOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="目的地" name="destination" rules={[{ required: true }]}>
                <Select placeholder="选择目的地">
                  {destinationOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="天数" name="days">
                <Select>
                  {[1,2,3,4,5,6,7,8,9,10].map(d => (
                    <Option key={d} value={d}>{d}天</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="预算（元）" name="budget">
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={500} 
                  max={50000} 
                  step={500}
                  formatter={v => `¥${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="同行人员" name="companionType">
                <Select>
                  {companionOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="交通方式" name="travelMode">
                <Select>
                  <Option value="公共交通">公共交通</Option>
                  <Option value="自驾">自驾</Option>
                  <Option value="混合">混合</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="兴趣偏好" name="interests">
            <Checkbox.Group style={{ width: '100%' }}>
              <Row>
                {interestOptions.map(opt => (
                  <Col span={12} key={opt.value}>
                    <Checkbox value={opt.value}>
                      <span style={{ color: opt.color }}>{opt.icon}</span> {opt.label}
                    </Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large"
              icon={<RocketOutlined />}
              style={{ 
                background: 'linear-gradient(135deg, #1A936F 0%, #114B5F 100%)',
                border: 'none'
              }}
            >
              开始规划
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span>行程规划结果</span>
          </Space>
        }
        open={showResultModal}
        onCancel={() => setShowResultModal(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setShowResultModal(false)}>关闭</Button>,
          <Button key="export" icon={<ExportOutlined />} onClick={handleExportJSON}>导出JSON</Button>,
          <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleSaveItinerary}>保存行程</Button>
        ]}
      >
        {generatedItinerary && (
          <div>
            <Alert
              message={generatedItinerary.title || '行程规划'}
              description={
                <Space direction="vertical" size={4}>
                  <Text>天数：{generatedItinerary.total_days || generatedItinerary.itinerary?.length || 0}天</Text>
                  <Text>预算：¥{generatedItinerary.budget_per_person || '待定'}</Text>
                  <Text>目的地：{(generatedItinerary.destinations || []).join('、')}</Text>
                </Space>
              }
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Collapse defaultActiveKey={['0']}>
              {(generatedItinerary.itinerary || []).map((day, idx) => (
                <Panel 
                  header={<><Badge count={day.day || idx + 1} style={{ backgroundColor: '#1A936F', marginRight: 8 }} /> {day.theme || `第${day.day || idx + 1}天`}</>}
                  key={idx}
                >
                  <List
                    dataSource={day.activities || []}
                    renderItem={activity => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Tag color={activity.type === 'attraction' ? 'blue' : activity.type === 'meal' ? 'orange' : 'green'}>{activity.time}</Tag>}
                          title={activity.name}
                          description={
                            <div>
                              <Text type="secondary">{activity.location}</Text>
                              <br/>
                              <Text>{activity.description}</Text>
                              {activity.tips && <><br/><Text type="warning">💡 {activity.tips}</Text></>}
                            </div>
                          }
                        />
                        <Text strong>¥{activity.cost || 0}</Text>
                      </List.Item>
                    )}
                  />
                </Panel>
              ))}
            </Collapse>
            
            {generatedItinerary.practical_info && (
              <Card size="small" title="实用信息" style={{ marginTop: 16 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>必带物品：</Text>
                    <br/>
                    {(generatedItinerary.practical_info.packing_list || []).map((item, i) => (
                      <Tag key={i}>{item}</Tag>
                    ))}
                  </Col>
                  <Col span={12}>
                    <Text strong>注意事项：</Text>
                    <br/>
                    {(generatedItinerary.practical_info.booking_reminders || []).map((item, i) => (
                      <Tag key={i} color="warning">{item}</Tag>
                    ))}
                  </Col>
                </Row>
              </Card>
            )}
          </div>
        )}
      </Modal>

      <Drawer
        title={
          <Space>
            <HistoryOutlined />
            <span>历史行程</span>
          </Space>
        }
        placement="right"
        width={400}
        open={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
      >
        {savedItineraries.length === 0 ? (
          <Empty description="暂无保存的行程" />
        ) : (
          <List
            dataSource={savedItineraries}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button 
                    type="link" 
                    size="small"
                    onClick={() => {
                      setGeneratedItinerary(item.itinerary);
                      setShowResultModal(true);
                      setShowHistoryDrawer(false);
                    }}
                  >
                    查看
                  </Button>,
                  <Button 
                    type="link" 
                    danger 
                    size="small"
                    onClick={() => {
                      const updated = savedItineraries.filter(s => s.id !== item.id);
                      setSavedItineraries(updated);
                      localStorage.setItem('savedItineraries', JSON.stringify(updated));
                    }}
                  >
                    删除
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={item.itinerary.title || '未命名行程'}
                  description={dayjs(item.savedAt).format('YYYY-MM-DD HH:mm')}
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>

      <style>{`
        .typing-cursor {
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default AITravelPlanner;