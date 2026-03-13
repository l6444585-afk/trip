import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Typography, Button, Card, Row, Col, Divider, Form, Input, InputNumber, Select, message, Tag, Modal, Timeline, Space, DatePicker, Slider, Radio, Checkbox, Progress, Rate, Statistic, Tabs, Badge, Spin, Alert, Collapse, Avatar, Tooltip, Empty, Drawer } from 'antd';
import { RocketOutlined, EnvironmentOutlined, HeartOutlined, CameraOutlined, StarOutlined, SearchOutlined, SaveOutlined, ReloadOutlined, CheckCircleOutlined, FireOutlined, ThunderboltOutlined, TagOutlined, CompassOutlined, CoffeeOutlined, CalendarOutlined, ClockCircleOutlined, DollarOutlined, SafetyOutlined, TeamOutlined, CameraFilled, PieChartOutlined, RiseOutlined, FallOutlined, WalletOutlined, CalculatorOutlined, RobotOutlined, BulbOutlined, AimOutlined, MessageOutlined, SendOutlined, CloseCircleOutlined, EyeOutlined, ShareAltOutlined, DownloadOutlined, SettingOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import AIAccounting from '../components/AIAccounting';
import '../styles/hero-title.css';


const { Title, Paragraph, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const Home = () => {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  
  // 原有状态
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState('休闲型');
  const [budget, setBudget] = useState({ total: 5000, transport: 1000, accommodation: 2000, food: 1200, tickets: 500, shopping: 300 });
  const [tripDays, setTripDays] = useState(3);
  const [dateRange, setDateRange] = useState(null);
  const [dailyTimeSlots, setDailyTimeSlots] = useState({ morning: true, afternoon: true, evening: true });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [form] = Form.useForm();
  
  // AI规划增强状态
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

  const popularDestinations = [
    {
      id: 1,
      name: '杭州西湖',
      city: '杭州',
      rating: 4.9,
      heat: 98,
      image: '/images/cities/hangzhou.jpg',
      tags: ['自然风光', '人文古迹', '网红打卡'],
      description: '断桥残雪、苏堤春晓、雷峰夕照，西湖十景美不胜收'
    },
    {
      id: 2,
      name: '上海外滩',
      city: '上海',
      rating: 4.8,
      heat: 95,
      image: '/images/cities/shanghai.jpg',
      tags: ['都市风情', '夜景', '历史建筑'],
      description: '万国建筑博览群，黄浦江畔璀璨夜景'
    },
    {
      id: 3,
      name: '苏州园林',
      city: '苏州',
      rating: 4.9,
      heat: 92,
      image: '/images/cities/suzhou.jpg',
      tags: ['园林艺术', '文化遗产', '摄影圣地'],
      description: '拙政园、留园、狮子林，一步一景皆是画'
    },
    {
      id: 4,
      name: '南京夫子庙',
      city: '南京',
      rating: 4.7,
      heat: 88,
      image: '/images/cities/nanjing.jpg',
      tags: ['历史底蕴', '美食打卡', '文化体验'],
      description: '秦淮河畔古韵悠长，小吃美食应有尽有'
    },
    {
      id: 5,
      name: '乌镇古镇',
      city: '嘉兴',
      rating: 4.8,
      heat: 90,
      image: '/images/cities/jiaxing.jpg',
      tags: ['古镇水乡', '历史文化', '摄影圣地'],
      description: '小桥流水人家，江南水乡的典型代表'
    },
    {
      id: 6,
      name: '普陀山',
      city: '舟山',
      rating: 4.8,
      heat: 87,
      image: '/images/cities/zhoushan.jpg',
      tags: ['佛教圣地', '自然风光', '文化体验'],
      description: '海天佛国，观音菩萨的道场'
    },
    {
      id: 7,
      name: '雪窦山',
      city: '宁波',
      rating: 4.6,
      heat: 83,
      image: '/images/cities/ningbo.jpg',
      tags: ['自然风光', '佛教文化', '登山徒步'],
      description: '弥勒佛道场，四明山第一山'
    },
    {
      id: 8,
      name: '无锡太湖',
      city: '无锡',
      rating: 4.6,
      heat: 85,
      image: '/images/cities/wuxi.jpg',
      tags: ['自然风光', '湖光山色', '休闲度假'],
      description: '鼋头渚樱花盛开，太湖明珠风光旖旎'
    }
  ];

  const interestTags = [
    { label: '自然风光', icon: <EnvironmentOutlined />, color: '#52c41a' },
    { label: '历史文化', icon: <CameraOutlined />, color: '#722ed1' },
    { label: '美食购物', icon: <CoffeeOutlined />, color: '#fa8c16' },
    { label: '城市漫步', icon: <CompassOutlined />, color: '#1890ff' },
    { label: '摄影打卡', icon: <CameraFilled />, color: '#eb2f96' },
    { label: '休闲度假', icon: <SafetyOutlined />, color: '#13c2c2' },
    { label: '亲子游玩', icon: <TeamOutlined />, color: '#faad14' },
    { label: '户外探险', icon: <ThunderboltOutlined />, color: '#f5222d' }
  ];

  const travelStyles = [
    { label: '冒险型', value: '冒险型', icon: <ThunderboltOutlined />, color: '#f5222d' },
    { label: '休闲型', value: '休闲型', icon: <SafetyOutlined />, color: '#52c41a' },
    { label: '文化深度型', value: '文化深度型', icon: <CameraOutlined />, color: '#722ed1' },
    { label: '亲子型', value: '亲子型', icon: <TeamOutlined />, color: '#faad14' }
  ];

  const attractionsData = [
    {
      name: '杭州西湖',
      openTime: '全天开放',
      ticketPrice: '免费',
      suggestedDuration: '4-6小时',
      bestSeason: '春秋两季',
      rating: 4.9
    },
    {
      name: '上海外滩',
      openTime: '全天开放',
      ticketPrice: '免费',
      suggestedDuration: '2-3小时',
      bestSeason: '全年',
      rating: 4.8
    },
    {
      name: '苏州拙政园',
      openTime: '07:30-17:30',
      ticketPrice: '¥70',
      suggestedDuration: '3-4小时',
      bestSeason: '春夏',
      rating: 4.9
    },
    {
      name: '南京夫子庙',
      openTime: '09:00-22:00',
      ticketPrice: '免费',
      suggestedDuration: '2-3小时',
      bestSeason: '全年',
      rating: 4.7
    }
  ];

  const accommodationData = [
    {
      name: '杭州西湖国宾馆',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
      rating: 4.9,
      price: '¥1,200/晚',
      description: '西湖边五星级园林式酒店，环境优美'
    },
    {
      name: '上海外滩华尔道夫',
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
      rating: 4.8,
      price: '¥2,500/晚',
      description: '外滩历史建筑，奢华体验'
    },
    {
      name: '苏州书香府邸',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop',
      rating: 4.7,
      price: '¥800/晚',
      description: '古典园林风格，文化氛围浓厚'
    },
    {
      name: '南京金陵饭店',
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop',
      rating: 4.6,
      price: '¥600/晚',
      description: '南京地标性酒店，交通便利'
    }
  ];

  const diningData = [
    {
      name: '楼外楼',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
      rating: 4.8,
      price: '¥200/人',
      cuisine: '杭帮菜',
      description: '百年老店，正宗西湖醋鱼'
    },
    {
      name: '外滩三号',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
      rating: 4.9,
      price: '¥500/人',
      cuisine: '西餐',
      description: '外滩顶级西餐厅，江景绝佳'
    },
    {
      name: '得月楼',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
      rating: 4.7,
      price: '¥180/人',
      cuisine: '苏帮菜',
      description: '苏州百年老店，松鼠桂鱼'
    },
    {
      name: '南京大牌档',
      image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop',
      rating: 4.6,
      price: '¥80/人',
      cuisine: '南京菜',
      description: '地道南京小吃，性价比高'
    }
  ];

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

  // AI规划增强配置
  const interestOptions = [
    { label: '自然风光', value: '自然风光', icon: <EnvironmentOutlined />, color: '#52c41a', description: '山水美景,亲近自然' },
    { label: '历史文化', value: '历史文化', icon: <CameraOutlined />, color: '#722ed1', description: '古迹遗址,文化体验' },
    { label: '美食购物', value: '美食购物', icon: <CoffeeOutlined />, color: '#fa8c16', description: '特色美食,购物天堂' },
    { label: '城市漫步', value: '城市漫步', icon: <CompassOutlined />, color: '#1890ff', description: '都市风情,街头探索' },
    { label: '摄影打卡', value: '摄影打卡', icon: <CameraFilled />, color: '#eb2f96', description: '网红景点,摄影圣地' },
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

  const planningSteps = [
    { title: '意图识别', icon: <BulbOutlined />, description: 'GLM-4.7 分析您的旅行需求' },
    { title: '约束分析', icon: <AimOutlined />, description: '理解预算、时间等限制条件' },
    { title: '智能规划', icon: <RobotOutlined />, description: '多Agent并行生成最优方案' },
    { title: '方案优化', icon: <ThunderboltOutlined />, description: '基于反馈持续优化行程' }
  ];

  const features = [
    {
      icon: <EnvironmentOutlined style={{ fontSize: 32, color: '#667eea' }} />,
      title: '智能推荐',
      description: 'GLM-4.7 推理引擎驱动 - 基于200K超长上下文窗口，结合实时联网数据，为您推荐最符合个人喜好的景点、美食和活动。模型的多语言理解能力确保推荐精准度。'
    },
    {
      icon: <CameraOutlined style={{ fontSize: 32, color: '#f5576c' }} />,
      title: '路线优化',
      description: '多Agent并行规划 - 采用类似Claude Code的Session隔离技术，多个GLM-4.7 Agent同时工作：一个规划景点顺序，一个计算交通时间，一个优化步行路线，最终生成最短时间和最佳体验的行程。'
    },
    {
      icon: <StarOutlined style={{ fontSize: 32, color: '#00f2fe' }} />,
      title: '行程管理',
      description: 'Claude Code式工作流 - 所有行程基于GLM-4.7生成，支持随时调整参数并一键重新规划。保留式思考模式确保修改历史完整，可随时回溯或微调。'
    },
    {
      icon: <HeartOutlined style={{ fontSize: 32, color: '#764ba2' }} />,
      title: '预算管理',
      description: '动态工具调用 - GLM-4.7的精准工具调用能力实时分析价格趋势，自动计算交通、住宿、餐饮成本，并提供预算预警和替代方案，确保您的行程在预算范围内。'
    }
  ];

  const handleGenerateItinerary = useCallback(async (values) => {
    setIsGenerating(true);
    setPlanningStep(0);
    setPlanningProgress(0);
    setGeneratedItinerary(null);

    try {
      // 模拟规划步骤
      for (let step = 0; step < planningSteps.length; step++) {
        setPlanningStep(step);
        await new Promise(resolve => setTimeout(resolve, 800));
        setPlanningProgress(((step + 1) / planningSteps.length) * 100);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const mockItinerary = {
        id: Date.now(),
        title: `${values.origin || '出发地'} → ${values.destination} ${values.days}日游`,
        origin: values.origin || '出发地',
        destination: values.destination,
        days: values.days,
        budget: values.budget,
        preferences: values.preferences || [],
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
          'GLM-4.7 采用交错式思考模式，深度分析您的需求',
          '多Agent并行规划 - 景点顺序、交通时间、步行路线同时优化',
          '动态工具调用 - 实时分析价格趋势，确保预算范围内',
          '建议提前预订热门景点门票',
          '关注当地天气，合理安排行程',
          '准备舒适的步行鞋'
        ],
        aiInsights: [
          { type: 'budget', title: '预算分析', content: '您的预算分配合理，建议适当增加餐饮预算以获得更好的美食体验' },
          { type: 'time', title: '时间安排', content: '行程节奏适中，每天有充足的休息时间' },
          { type: 'experience', title: '体验建议', content: '根据您的兴趣偏好，推荐增加一些小众景点的探索' }
        ],
        optimizationScore: 85 + Math.floor(Math.random() * 12),
        generatedAt: dayjs()
      };

      setGeneratedItinerary(mockItinerary);
      setShowResultModal(true);
      message.success(`GLM-4.7 行程生成成功！优化评分：${mockItinerary.optimizationScore}分`);
    } catch (error) {
      message.error('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedConstraints, planningSteps.length]);

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
    } catch (error) {
      message.error('发送消息失败');
    } finally {
      setIsChatting(false);
    }
  };

  const handleSaveItinerary = () => {
    if (generatedItinerary) {
      message.success('行程已保存到我的行程列表');
      setShowResultModal(false);
      form.resetFields();
      setGeneratedItinerary(null);
    }
  };

  const handleRegenerate = () => {
    form.submit();
  };

  const [isNavigating, setIsNavigating] = useState(false);

  const handleQuickPlan = (destination) => {
    setIsNavigating(true);
    sessionStorage.setItem('quickPlanDestination', JSON.stringify({
      destination: destination.city,
      preferences: destination.tags.slice(0, 2),
      timestamp: Date.now()
    }));
    setTimeout(() => {
      navigate('/ai-planning');
    }, 300);
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleBudgetChange = (category, value) => {
    setBudget(prev => ({ ...prev, [category]: value }));
  };

  const filteredDestinations = popularDestinations.filter(dest =>
    dest.name.toLowerCase().includes(searchText.toLowerCase()) ||
    dest.city.toLowerCase().includes(searchText.toLowerCase())
  );

  const totalAllocated = budget.transport + budget.accommodation + budget.food + budget.tickets + budget.shopping;

  // 聊天自动滚动
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);
  const budgetPercentage = Math.round((totalAllocated / budget.total) * 100);
  const remainingBudget = budget.total - totalAllocated;

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
        .destination-name-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          font-weight: 700;
        }
      `}</style>

      <div style={{ marginBottom: 60 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 32, position: 'relative' }}>
          <Title level={2} style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>
            热门目的地
          </Title>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginLeft: 16 }}>
            <Input
              placeholder="搜索目的地..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Tag color="red" icon={<FireOutlined />}>实时热度</Tag>
          </div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {filteredDestinations.map((dest) => (
            <Card
              key={dest.id}
              hoverable
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                padding: 0,
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}
              styles={{ body: { padding: 0 } }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              }}
            >
              <div style={{
                height: 200,
                backgroundImage: `url(${dest.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  backdropFilter: 'blur(8px)'
                }}>
                  <FireOutlined style={{ color: '#ff4d4f' }} />
                  {dest.heat}
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 100%)',
                  padding: '50px 16px 16px'
                }}>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: 600, display: 'block' }}>
                    {dest.name}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                    {dest.city}
                  </Text>
                </div>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Space size={6}>
                    <StarOutlined style={{ color: '#faad14', fontSize: 14 }} />
                    <Text style={{ fontSize: 14, fontWeight: 500 }}>{dest.rating}</Text>
                  </Space>
                  <Tag color="blue" style={{ fontSize: 11, margin: 0, padding: '2px 8px' }}>{dest.city}</Tag>
                </div>
                <Paragraph
                  ellipsis={{ rows: 2 }}
                  style={{ fontSize: 13, color: '#666', marginBottom: 12, height: 40, lineHeight: 1.5 }}
                >
                  {dest.description}
                </Paragraph>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {dest.tags.slice(0, 2).map((tag, idx) => (
                    <Tag key={idx} style={{ fontSize: 11, margin: 0, padding: '2px 8px' }}>{tag}</Tag>
                  ))}
                </div>
                <Button
                  type="primary"
                  size="small"
                  block
                  icon={isNavigating ? <LoadingOutlined /> : <ThunderboltOutlined />}
                  onClick={() => handleQuickPlan(dest)}
                  loading={isNavigating}
                  style={{
                    borderRadius: 8,
                    height: 36,
                    fontSize: 14,
                    fontWeight: 500,
                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isNavigating) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {isNavigating ? '正在跳转...' : '一键规划'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

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
              <div className="hero-decoration left" />
              <div className="hero-decoration right" />
              
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

      <div style={{ marginBottom: 60 }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 40, fontSize: 28, fontWeight: 600 }}>
          行程规划配置
        </Title>
        
        {/* AI智能记账模块 - 紧凑模式 */}
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <AIAccounting 
              initialBudget={budget.total}
              compact={true}
              onBudgetUpdate={(budgetData) => {
                // 同步更新首页预算状态
                setBudget(prev => ({ ...prev, total: budgetData.total }));
              }}
            />
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card 
              style={{ 
                borderRadius: 20, 
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                height: '100%',
                border: '1px solid rgba(0,0,0,0.06)'
              }}
              styles={{ body: { padding: 28 } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16
                }}>
                  <PieChartOutlined style={{ fontSize: 24, color: '#fff' }} />
                </div>
                <Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>旅游记账与预算分配</Title>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)', padding: 20, borderRadius: 16, marginBottom: 24 }}>
                <Row gutter={16}>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="总预算"
                      value={budget.total}
                      prefix="¥"
                      valueStyle={{ color: '#52c41a', fontSize: 20, fontWeight: 600 }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="已分配"
                      value={totalAllocated}
                      prefix="¥"
                      valueStyle={{ color: '#1890ff', fontSize: 20, fontWeight: 600 }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="剩余"
                      value={remainingBudget}
                      prefix="¥"
                      valueStyle={{ color: remainingBudget >= 0 ? '#faad14' : '#f5222d', fontSize: 20, fontWeight: 600 }}
                      suffix={remainingBudget >= 0 ? <RiseOutlined /> : <FallOutlined />}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="分配率"
                      value={budgetPercentage}
                      suffix="%"
                      valueStyle={{ color: '#722ed1', fontSize: 20, fontWeight: 600 }}
                    />
                  </Col>
                </Row>
              </div>

              <div style={{ marginBottom: 24 }}>
                <Text strong style={{ fontSize: 16, marginBottom: 12, display: 'block' }}>调整总预算</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  size="large"
                  min={1000}
                  max={100000}
                  step={500}
                  value={budget.total}
                  onChange={(value) => handleBudgetChange('total', value)}
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/[¥\s,]/g, '')}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <Text strong style={{ fontSize: 16, marginBottom: 16, display: 'block' }}>预算分配明细</Text>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div style={{ 
                    padding: 16, 
                    borderRadius: 12, 
                    background: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(82, 196, 26, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong>交通</Text>
                      <Text style={{ color: '#52c41a', fontWeight: 600 }}>¥{budget.transport.toLocaleString()}</Text>
                    </div>
                    <Slider 
                      value={budget.transport} 
                      max={budget.total}
                      onChange={(value) => handleBudgetChange('transport', value)}
                      trackStyle={{ backgroundColor: '#52c41a' }}
                    />
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                      占比 {Math.round(budget.transport / budget.total * 100)}%
                    </div>
                  </div>

                  <div style={{ 
                    padding: 16, 
                    borderRadius: 12, 
                    background: '#e6f7ff',
                    border: '1px solid #91d5ff',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(24, 144, 255, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong>住宿</Text>
                      <Text style={{ color: '#1890ff', fontWeight: 600 }}>¥{budget.accommodation.toLocaleString()}</Text>
                    </div>
                    <Slider 
                      value={budget.accommodation} 
                      max={budget.total}
                      onChange={(value) => handleBudgetChange('accommodation', value)}
                      trackStyle={{ backgroundColor: '#1890ff' }}
                    />
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                      占比 {Math.round(budget.accommodation / budget.total * 100)}%
                    </div>
                  </div>

                  <div style={{ 
                    padding: 16, 
                    borderRadius: 12, 
                    background: '#fff7e6',
                    border: '1px solid #ffd591',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(250, 140, 22, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong>餐饮</Text>
                      <Text style={{ color: '#fa8c16', fontWeight: 600 }}>¥{budget.food.toLocaleString()}</Text>
                    </div>
                    <Slider 
                      value={budget.food} 
                      max={budget.total}
                      onChange={(value) => handleBudgetChange('food', value)}
                      trackStyle={{ backgroundColor: '#fa8c16' }}
                    />
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                      占比 {Math.round(budget.food / budget.total * 100)}%
                    </div>
                  </div>

                  <div style={{ 
                    padding: 16, 
                    borderRadius: 12, 
                    background: '#f9f0ff',
                    border: '1px solid #d3adf7',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(114, 46, 209, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong>门票</Text>
                      <Text style={{ color: '#722ed1', fontWeight: 600 }}>¥{budget.tickets.toLocaleString()}</Text>
                    </div>
                    <Slider 
                      value={budget.tickets} 
                      max={budget.total}
                      onChange={(value) => handleBudgetChange('tickets', value)}
                      trackStyle={{ backgroundColor: '#722ed1' }}
                    />
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                      占比 {Math.round(budget.tickets / budget.total * 100)}%
                    </div>
                  </div>

                  <div style={{ 
                    padding: 16, 
                    borderRadius: 12, 
                    background: '#fff0f6',
                    border: '1px solid #ffadd2',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(235, 47, 150, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong>购物</Text>
                      <Text style={{ color: '#eb2f96', fontWeight: 600 }}>¥{budget.shopping.toLocaleString()}</Text>
                    </div>
                    <Slider 
                      value={budget.shopping} 
                      max={budget.total}
                      onChange={(value) => handleBudgetChange('shopping', value)}
                      trackStyle={{ backgroundColor: '#eb2f96' }}
                    />
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                      占比 {Math.round(budget.shopping / budget.total * 100)}%
                    </div>
                  </div>
                </div>
              </div>

              <Progress 
                percent={budgetPercentage} 
                status={budgetPercentage > 100 ? 'exception' : budgetPercentage === 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#52c41a',
                  '50%': '#1890ff',
                  '100%': '#722ed1'
                }}
                size={12}
                format={(percent) => `${percent}% 已分配`}
                style={{ marginBottom: 8 }}
              />
              <Text style={{ fontSize: 12, color: '#8c8c8c' }}>
                {budgetPercentage > 100 ? '⚠️ 预算超支，请调整分配' : budgetPercentage === 100 ? '✓ 预算分配完美' : '💡 还可以继续分配预算'}
              </Text>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Card 
                  style={{ 
                    borderRadius: 20, 
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    height: '100%',
                    border: '1px solid rgba(0,0,0,0.06)'
                  }}
                  styles={{ body: { padding: 24 } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <TagOutlined style={{ fontSize: 20, color: '#fff' }} />
                </div>
                <Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>兴趣标签</Title>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {interestTags.map((tag, index) => (
                  <Tag
                    key={index}
                    icon={tag.icon}
                    color={selectedTags.includes(tag.label) ? tag.color : 'default'}
                    style={{ 
                      padding: '8px 16px',
                      cursor: 'pointer',
                      border: selectedTags.includes(tag.label) ? '2px solid ' + tag.color : '1px solid #d9d9d9',
                      borderRadius: 24,
                      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      fontWeight: 500
                    }}
                    onClick={() => handleTagToggle(tag.label)}
                    onMouseEnter={(e) => {
                      if (!selectedTags.includes(tag.label)) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {tag.label}
                  </Tag>
                ))}
              </div>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card 
                  style={{ 
                    borderRadius: 20, 
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    height: '100%',
                    border: '1px solid rgba(0,0,0,0.06)'
                  }}
                  styles={{ body: { padding: 24 } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <CompassOutlined style={{ fontSize: 20, color: '#fff' }} />
                </div>
                <Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>旅游风格</Title>
              </div>
                  <Radio.Group 
                    value={selectedStyle} 
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {travelStyles.map((style, index) => (
                        <Radio 
                          key={index} 
                          value={style.value}
                          style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            padding: '10px 14px',
                            borderRadius: 10,
                            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                            border: selectedStyle === style.value ? '2px solid ' + style.color : '1px solid #d9d9d9',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            if (selectedStyle !== style.value) {
                              e.currentTarget.style.transform = 'translateX(8px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateX(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <span style={{ color: style.color, marginRight: 10 }}>{style.icon}</span>
                          {style.label}
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                </Card>
              </Col>

              <Col xs={24}>
                <Card 
                  style={{ 
                    borderRadius: 20, 
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    height: '100%',
                    border: '1px solid rgba(0,0,0,0.06)'
                  }}
                  styles={{ body: { padding: 24 } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <CalendarOutlined style={{ fontSize: 20, color: '#fff' }} />
                </div>
                <Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>时间设定</Title>
              </div>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ fontSize: 15 }}>出行天数</Text>
                        <Space.Compact style={{ width: '100%', marginTop: 8 }}>
                          <InputNumber
                            style={{ width: '100%' }}
                            min={1}
                            max={15}
                            value={tripDays}
                            onChange={(value) => setTripDays(value)}
                            size="large"
                          />
                          <Input
                            style={{ width: 50, textAlign: 'center' }}
                            defaultValue="天"
                            disabled
                          />
                        </Space.Compact>
                      </div>
                    </Col>
                    <Col xs={24} md={12}>
                      <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ fontSize: 15 }}>日期范围</Text>
                        <RangePicker
                          style={{ width: '100%', marginTop: 8 }}
                          value={dateRange}
                          onChange={setDateRange}
                          format="YYYY-MM-DD"
                          size="large"
                        />
                      </div>
                    </Col>
                  </Row>
                  <div style={{ marginTop: 16 }}>
                    <Text strong style={{ fontSize: 15 }}>每日游玩时段</Text>
                    <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <Checkbox 
                        checked={dailyTimeSlots.morning}
                        onChange={(e) => setDailyTimeSlots(prev => ({ ...prev, morning: e.target.checked }))}
                        style={{ fontSize: 14 }}
                      >
                        上午 (8:00-12:00)
                      </Checkbox>
                      <Checkbox 
                        checked={dailyTimeSlots.afternoon}
                        onChange={(e) => setDailyTimeSlots(prev => ({ ...prev, afternoon: e.target.checked }))}
                        style={{ fontSize: 14 }}
                      >
                        下午 (13:00-17:00)
                      </Checkbox>
                      <Checkbox 
                        checked={dailyTimeSlots.evening}
                        onChange={(e) => setDailyTimeSlots(prev => ({ ...prev, evening: e.target.checked }))}
                        style={{ fontSize: 14 }}
                      >
                        晚上 (18:00-22:00)
                      </Checkbox>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      <Divider style={{ margin: '60px 0' }} />

      <div style={{ marginBottom: 60 }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 40, fontSize: 28, fontWeight: 600 }}>
          景点数据库
        </Title>
        <Row gutter={[24, 24]}>
          {attractionsData.map((attraction, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card
                style={{
                  borderRadius: 20,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  height: '100%',
                  border: '1px solid rgba(0,0,0,0.06)'
                }}
                hoverable
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 12px 36px -10px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <Title level={5} style={{ marginBottom: 8, fontSize: 17, fontWeight: 600 }}>{attraction.name}</Title>
                  <Rate disabled defaultValue={attraction.rating} style={{ fontSize: 14 }} />
                </div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 2.2 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <ClockCircleOutlined style={{ marginRight: 10, color: '#1890ff', fontSize: 16 }} />
                    <span><strong>开放时间：</strong>{attraction.openTime}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <DollarOutlined style={{ marginRight: 10, color: '#52c41a', fontSize: 16 }} />
                    <span><strong>门票价格：</strong>{attraction.ticketPrice}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <SafetyOutlined style={{ marginRight: 10, color: '#fa8c16', fontSize: 16 }} />
                    <span><strong>建议时长：</strong>{attraction.suggestedDuration}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <EnvironmentOutlined style={{ marginRight: 10, color: '#722ed1', fontSize: 16 }} />
                    <span><strong>最佳季节：</strong>{attraction.bestSeason}</span>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Divider style={{ margin: '60px 0' }} />

      <div style={{ marginBottom: 60 }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 40, fontSize: 28, fontWeight: 600 }}>
          住宿推荐
        </Title>
        <Row gutter={[24, 24]}>
          {accommodationData.map((hotel, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card
                hoverable
                style={{
                  borderRadius: 20,
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.06)'
                }}
                styles={{ body: { padding: 0 } }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 12px 36px -10px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{
                  height: 180,
                  backgroundImage: `url(${hotel.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }} />
                <div style={{ padding: 20 }}>
                  <Title level={5} style={{ marginBottom: 10, fontSize: 16, fontWeight: 600 }}>{hotel.name}</Title>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                    <Rate disabled defaultValue={hotel.rating} style={{ fontSize: 13 }} />
                    <Text style={{ marginLeft: 8, fontSize: 13, color: '#666' }}>{hotel.rating}</Text>
                  </div>
                  <Text style={{ color: '#f5222d', fontSize: 18, fontWeight: 600, display: 'block', marginBottom: 10 }}>
                    {hotel.price}
                  </Text>
                  <Paragraph
                    ellipsis={{ rows: 2 }}
                    style={{ fontSize: 13, color: '#666', marginBottom: 0, lineHeight: 1.6 }}
                  >
                    {hotel.description}
                  </Paragraph>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Divider style={{ margin: '60px 0' }} />

      <div style={{ marginBottom: 60 }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 40, fontSize: 28, fontWeight: 600 }}>
          餐饮推荐
        </Title>
        <Row gutter={[24, 24]}>
          {diningData.map((restaurant, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card
                hoverable
                style={{
                  borderRadius: 20,
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.06)'
                }}
                styles={{ body: { padding: 0 } }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 12px 36px -10px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{
                  height: 180,
                  backgroundImage: `url(${restaurant.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }} />
                <div style={{ padding: 20 }}>
                  <Title level={5} style={{ marginBottom: 10, fontSize: 16, fontWeight: 600 }}>{restaurant.name}</Title>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                    <Rate disabled defaultValue={restaurant.rating} style={{ fontSize: 13 }} />
                    <Text style={{ marginLeft: 8, fontSize: 13, color: '#666' }}>{restaurant.rating}</Text>
                  </div>
                  <Tag color="blue" style={{ marginBottom: 10, fontSize: 12 }}>{restaurant.cuisine}</Tag>
                  <Text style={{ color: '#f5222d', fontSize: 18, fontWeight: 600, display: 'block', marginBottom: 10 }}>
                    {restaurant.price}
                  </Text>
                  <Paragraph
                    ellipsis={{ rows: 2 }}
                    style={{ fontSize: 13, color: '#666', marginBottom: 0, lineHeight: 1.6 }}
                  >
                    {restaurant.description}
                  </Paragraph>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Divider style={{ margin: '60px 0' }} />

      {/* AI智能规划 - 集成增强版 */}
      <div id="ai-planning-section" style={{ marginBottom: 60 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Title level={2} style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>
            <RocketOutlined style={{ color: '#667eea', marginRight: 12 }} />
            AI 智能规划
          </Title>
          <Paragraph style={{ color: '#666', fontSize: 16, maxWidth: 600, margin: '0 auto' }}>
            基于 GLM-4.7 人工智能模型，为您量身定制个性化旅游攻略
          </Paragraph>
        </div>

        <Card
          style={{
            borderRadius: 24,
            boxShadow: '0 12px 48px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}
        >
          {/* 彩虹渐变顶部条 */}
          <div style={{
            height: '4px',
            background: 'linear-gradient(90deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000)',
            backgroundSize: '400% 100%',
            animation: 'gradientMove 3s ease infinite'
          }} />

          <Tabs
            activeKey={activePlanningTab}
            onChange={setActivePlanningTab}
            type="card"
            style={{ padding: '24px 24px 0' }}
            items={[
              {
                key: 'quick',
                label: (
                  <span>
                    <ThunderboltOutlined style={{ marginRight: 8 }} />
                    快速规划
                  </span>
                ),
                children: (
                  <div style={{ padding: '20px 0' }}>
                    <Row gutter={[32, 32]}>
                      <Col xs={24} lg={12}>
                        <Form
                          form={aiPlanningForm}
                          layout="vertical"
                          onFinish={handleGenerateItinerary}
                        >
                          <Form.Item
                            name="destination"
                            label={<Text strong>目的地</Text>}
                            rules={[{ required: true, message: '请选择目的地' }]}
                          >
                            <Select
                              size="large"
                              placeholder="选择目的地城市"
                              options={destinationOptions}
                              showSearch
                              optionFilterProp="label"
                            />
                          </Form.Item>

                          <Form.Item
                            name="days"
                            label={<Text strong>行程天数</Text>}
                            rules={[{ required: true, message: '请输入行程天数' }]}
                          >
                            <InputNumber
                              size="large"
                              min={1}
                              max={10}
                              style={{ width: '100%' }}
                              placeholder="1-10天"
                            />
                          </Form.Item>

                          <Form.Item
                            name="budget"
                            label={<Text strong>预算范围（元/人）</Text>}
                            rules={[{ required: true, message: '请输入预算' }]}
                          >
                            <InputNumber
                              size="large"
                              min={500}
                              max={50000}
                              step={500}
                              style={{ width: '100%' }}
                              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                              parser={value => value.replace(/[¥\s,]/g, '')}
                            />
                          </Form.Item>

                          <Form.Item
                            name="preferences"
                            label={<Text strong>兴趣偏好（多选）</Text>}
                          >
                            <Select
                              mode="multiple"
                              size="large"
                              placeholder="选择您感兴趣的标签"
                              options={interestOptions}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>

                          <Form.Item>
                            <Button
                              type="primary"
                              size="large"
                              htmlType="submit"
                              loading={isGenerating}
                              block
                              icon={<RocketOutlined />}
                              style={{
                                height: 48,
                                fontSize: 16,
                                fontWeight: 600,
                                borderRadius: 12,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none'
                              }}
                            >
                              {isGenerating ? 'AI规划中...' : '开始智能规划'}
                            </Button>
                          </Form.Item>
                        </Form>
                      </Col>

                      <Col xs={24} lg={12}>
                        <div style={{
                          background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
                          borderRadius: 16,
                          padding: 24,
                          height: '100%'
                        }}>
                          <Title level={4} style={{ marginBottom: 20 }}>
                            <BulbOutlined style={{ color: '#faad14', marginRight: 8 }} />
                            规划小贴士
                          </Title>
                          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                            <li>输入越详细，生成的行程越符合您的需求</li>
                            <li>可以多次调整参数重新生成</li>
                            <li>生成后可与AI对话进行优化</li>
                            <li>支持保存多个版本对比选择</li>
                          </ul>

                          <Divider style={{ margin: '20px 0' }} />

                          <Title level={5} style={{ marginBottom: 12 }}>热门目的地推荐</Title>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {['杭州', '上海', '苏州', '南京'].map(city => (
                              <Tag
                                key={city}
                                color="blue"
                                style={{ cursor: 'pointer', padding: '4px 12px' }}
                                onClick={() => aiPlanningForm.setFieldsValue({ destination: city })}
                              >
                                {city}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                )
              },
              {
                key: 'advanced',
                label: (
                  <span>
                    <SettingOutlined style={{ marginRight: 8 }} />
                    高级规划
                  </span>
                ),
                children: (
                  <div style={{ padding: '20px 0' }}>
                    <Row gutter={[32, 32]}>
                      <Col xs={24} lg={16}>
                        <Form
                          form={aiPlanningForm}
                          layout="vertical"
                          onFinish={handleGenerateItinerary}
                        >
                          <Row gutter={16}>
                            <Col xs={24} sm={12}>
                              <Form.Item
                                name="origin"
                                label={<Text strong>出发地</Text>}
                              >
                                <Input size="large" placeholder="您的出发城市" />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                              <Form.Item
                                name="destination"
                                label={<Text strong>目的地</Text>}
                                rules={[{ required: true, message: '请选择目的地' }]}
                              >
                                <Select
                                  size="large"
                                  placeholder="选择目的地"
                                  options={destinationOptions}
                                  showSearch
                                />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row gutter={16}>
                            <Col xs={24} sm={12}>
                              <Form.Item
                                name="days"
                                label={<Text strong>行程天数</Text>}
                                rules={[{ required: true }]}
                              >
                                <InputNumber size="large" min={1} max={10} style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                              <Form.Item
                                name="companions"
                                label={<Text strong>出行人数</Text>}
                              >
                                <Select
                                  size="large"
                                  placeholder="选择出行类型"
                                  options={[
                                    { value: '单人', label: '单人' },
                                    { value: '情侣', label: '情侣' },
                                    { value: '家庭', label: '家庭' },
                                    { value: '朋友', label: '朋友' },
                                    { value: '团队', label: '团队' }
                                  ]}
                                />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Form.Item
                            name="constraints"
                            label={<Text strong>规划约束条件</Text>}
                          >
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                              {constraintOptions.map(option => (
                                <Tag
                                  key={option.value}
                                  color={selectedConstraints.includes(option.value) ? 'blue' : 'default'}
                                  style={{
                                    cursor: 'pointer',
                                    padding: '8px 16px',
                                    fontSize: 14,
                                    transition: 'all 0.3s'
                                  }}
                                  onClick={() => {
                                    setSelectedConstraints(prev =>
                                      prev.includes(option.value)
                                        ? prev.filter(c => c !== option.value)
                                        : [...prev, option.value]
                                    );
                                  }}
                                >
                                  <Space>
                                    {option.icon}
                                    {option.label}
                                  </Space>
                                </Tag>
                              ))}
                            </div>
                          </Form.Item>

                          <Form.Item>
                            <Button
                              type="primary"
                              size="large"
                              htmlType="submit"
                              loading={isGenerating}
                              block
                              icon={<RocketOutlined />}
                              style={{
                                height: 48,
                                fontSize: 16,
                                fontWeight: 600,
                                borderRadius: 12,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none'
                              }}
                            >
                              {isGenerating ? 'AI深度规划中...' : '开始高级规划'}
                            </Button>
                          </Form.Item>
                        </Form>
                      </Col>

                      <Col xs={24} lg={8}>
                        <div style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: 16,
                          padding: 24,
                          color: '#fff'
                        }}>
                          <Title level={4} style={{ color: '#fff', marginBottom: 16 }}>
                            <RobotOutlined style={{ marginRight: 8 }} />
                            高级功能
                          </Title>
                          <ul style={{ paddingLeft: 20, lineHeight: 2, color: 'rgba(255,255,255,0.9)' }}>
                            <li>多维度约束条件</li>
                            <li>智能预算分配</li>
                            <li>个性化路线优化</li>
                            <li>实时天气适配</li>
                            <li>人流密度预测</li>
                          </ul>
                        </div>
                      </Col>
                    </Row>
                  </div>
                )
              },
              {
                key: 'chat',
                label: (
                  <span>
                    <MessageOutlined style={{ marginRight: 8 }} />
                    AI对话规划
                  </span>
                ),
                children: (
                  <div style={{ padding: '20px 0' }}>
                    <Row gutter={[32, 32]}>
                      <Col xs={24} lg={16}>
                        <div style={{
                          background: '#f5f5f5',
                          borderRadius: 16,
                          padding: 20,
                          height: 400,
                          overflowY: 'auto',
                          marginBottom: 16
                        }}>
                          {chatMessages.map((msg, index) => (
                            <div
                              key={index}
                              style={{
                                display: 'flex',
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                marginBottom: 16
                              }}
                            >
                              <div
                                style={{
                                  maxWidth: '70%',
                                  padding: '12px 16px',
                                  borderRadius: 16,
                                  background: msg.role === 'user' ? '#667eea' : '#fff',
                                  color: msg.role === 'user' ? '#fff' : '#333',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                  whiteSpace: 'pre-line'
                                }}
                              >
                                {msg.content}
                              </div>
                            </div>
                          ))}
                          {isChatting && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                              <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 16 }}>
                                <LoadingOutlined style={{ color: '#667eea' }} />
                              </div>
                            </div>
                          )}
                          <div ref={chatEndRef} />
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                          <TextArea
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="输入您的旅行想法，例如：我想去杭州玩3天，预算3000元..."
                            autoSize={{ minRows: 2, maxRows: 4 }}
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
                            style={{
                              height: 'auto',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              border: 'none'
                            }}
                          />
                        </div>

                        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {['推荐杭州3日游', '预算5000元怎么玩', '亲子游推荐', '美食攻略'].map((text, idx) => (
                            <Tag
                              key={idx}
                              color="default"
                              style={{ cursor: 'pointer' }}
                              onClick={() => setUserInput(text)}
                            >
                              {text}
                            </Tag>
                          ))}
                        </div>
                      </Col>

                      <Col xs={24} lg={8}>
                        <Card title="AI助手能力" size="small">
                          <ul style={{ paddingLeft: 16, lineHeight: 2 }}>
                            <li>🎯 智能意图识别</li>
                            <li>🗺️ 自动路线规划</li>
                            <li>💰 预算优化建议</li>
                            <li>🍜 美食推荐</li>
                            <li>🏨 住宿筛选</li>
                            <li>🎫 门票提醒</li>
                          </ul>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                )
              }
            ]}
          />

          {/* 规划进度显示 */}
          {isGenerating && (
            <div style={{ padding: '0 24px 24px' }}>
              <Card style={{ background: '#f8f9fa', border: 'none' }}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <Spin size="large" style={{ marginBottom: 16 }} />
                  <Title level={4} style={{ margin: 0 }}>
                    {planningSteps[planningStep]?.title}
                  </Title>
                  <Text type="secondary">{planningSteps[planningStep]?.description}</Text>
                </div>
                <Progress
                  percent={planningProgress}
                  status="active"
                  strokeColor={{ from: '#667eea', to: '#764ba2' }}
                />
              </Card>
            </div>
          )}
        </Card>
      </div>

      <Divider style={{ margin: '60px 0' }} />

      <div style={{ marginBottom: 60 }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 40, fontSize: 28, fontWeight: 600 }}>
          系统特色
        </Title>
        <Row gutter={[32, 32]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card
                style={{
                  textAlign: 'center',
                  borderRadius: 20,
                  height: '100%',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.06)'
                }}
                hoverable
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 12px 36px -10px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{ marginBottom: 20 }}>
                  {feature.icon}
                </div>
                <Title level={4} style={{ marginBottom: 14, fontSize: 17, fontWeight: 600 }}>{feature.title}</Title>
                <Paragraph style={{ color: '#666', fontSize: 14, lineHeight: 1.7 }}>{feature.description}</Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span>行程生成成功</span>
          </Space>
        }
        open={showResultModal}
        onCancel={() => setShowResultModal(false)}
        width={800}
        footer={[
          <Button key="back" onClick={() => setShowResultModal(false)}>
            关闭
          </Button>,
          <Button key="regenerate" icon={<ReloadOutlined />} onClick={handleRegenerate}>
            重新生成
          </Button>,
          <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleSaveItinerary}>
            保存行程
          </Button>
        ]}
      >
        {generatedItinerary && (
          <div>
            <div style={{ marginBottom: 24, padding: 20, background: '#f5f5f5', borderRadius: 12 }}>
              <Title level={4} style={{ margin: '0 0 14px 0' }}>{generatedItinerary.title}</Title>
              <Space direction="vertical" size={10}>
                <Text><strong>预算：</strong>¥{generatedItinerary.budget.toLocaleString()}</Text>
                <Text><strong>预估费用：</strong>¥{generatedItinerary.estimatedCost.toLocaleString()}</Text>
                <Text><strong>偏好：</strong>{generatedItinerary.preferences.join('、')}</Text>
              </Space>
            </div>

            <Title level={5} style={{ marginBottom: 18 }}>行程安排</Title>
            <Timeline
              items={generatedItinerary.dailyPlan.map(day => ({
                children: (
                  <div>
                    <Text strong>第 {day.day} 天</Text>
                    {day.activities.map((activity, idx) => (
                      <div key={idx} style={{ marginTop: 10, padding: '10px 14px', background: '#fafafa', borderRadius: 8 }}>
                        <Space direction="vertical" size={5}>
                          <Text type="secondary" style={{ fontSize: 13 }}>{activity.time}</Text>
                          <Text strong>{activity.title}</Text>
                          <Text style={{ fontSize: 13 }}>{activity.description}</Text>
                          <Text style={{ fontSize: 13, color: '#666' }}>📍 {activity.location}</Text>
                        </Space>
                      </div>
                    ))}
                  </div>
                )
              }))}
            />

            <div style={{ marginTop: 28, padding: 18, background: '#e6f7ff', borderRadius: 12, border: '1px solid #91d5ff' }}>
              <Title level={5} style={{ margin: '0 0 14px 0', color: '#1890ff' }}>贴心提示</Title>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {generatedItinerary.tips.map((tip, idx) => (
                  <li key={idx} style={{ marginBottom: 10, color: '#666' }}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Home;
