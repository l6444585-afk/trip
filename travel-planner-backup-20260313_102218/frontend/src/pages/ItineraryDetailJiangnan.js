import React, { useState, useEffect } from 'react';
import { Timeline, Button, Tag, Progress, Empty, Spin, Modal, Rate, Divider, message, Typography } from 'antd';
import { 
  EnvironmentOutlined, 
  CoffeeOutlined, 
  CarOutlined, 
  HomeOutlined,
  EditOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  HeartOutlined,
  StarOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const mockItineraryData = {
  id: 1,
  title: '苏杭四日深度游',
  coverImage: '/images/cities/hangzhou.jpg',
  totalDays: 3,
  startDate: '2024-04-15',
  endDate: '2024-04-18',
  budget: 5000,
  estimatedCost: 4850,
  companionType: '情侣',
  interests: ['自然风光', '历史文化', '美食打卡'],
  dailyPlans: [
    {
      day: 1,
      date: '2024-04-15',
      city: '上海',
      summary: '外滩风情 · 都市漫步',
      activities: [
        {
          type: 'attraction',
          time: '09:00',
          title: '外滩',
          image: '/images/cities/shanghai.jpg',
          description: '万国建筑博览群，欣赏黄浦江两岸风光',
          duration: '2-3小时',
          ticketPrice: '免费',
          rating: 4.8,
          location: '黄浦区中山东一路',
          tags: ['网红打卡', '夜景', '历史建筑']
        },
        {
          type: 'transport',
          time: '12:00',
          title: '地铁前往南京路',
          description: '乘坐地铁2号线，约15分钟',
          duration: '15分钟',
          cost: '¥4'
        },
        {
          type: 'food',
          time: '12:30',
          title: '南翔馒头店',
          image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop',
          description: '百年老店，品尝正宗小笼包',
          cuisine: '上海本帮菜',
          price: '¥80/人',
          rating: 4.7,
          location: '豫园老街',
          signatureDish: '小笼包、蟹粉小笼'
        },
        {
          type: 'attraction',
          time: '14:00',
          title: '豫园',
          image: 'https://images.unsplash.com/photo-1560448204-e02f11bad511?w=400&h=300&fit=crop',
          description: '江南古典园林，体验传统文化',
          duration: '2-3小时',
          ticketPrice: '¥40',
          rating: 4.6,
          location: '黄浦区安仁街',
          tags: ['园林艺术', '文化遗产']
        },
        {
          type: 'food',
          time: '18:00',
          title: '外滩三号',
          image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
          description: '外滩顶级西餐厅，江景绝佳',
          cuisine: '西餐',
          price: '¥500/人',
          rating: 4.9,
          location: '外滩三号',
          signatureDish: '澳洲和牛、法式甜点'
        },
        {
          type: 'accommodation',
          time: '20:00',
          title: '上海外滩华尔道夫',
          image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
          description: '外滩历史建筑，奢华体验',
          price: '¥2,500/晚',
          rating: 4.8,
          location: '黄浦区中山东一路2号',
          amenities: ['江景房', '早餐', '健身房']
        }
      ]
    },
    {
      day: 2,
      date: '2024-04-16',
      city: '苏州',
      summary: '园林雅韵 · 姑苏风情',
      activities: [
        {
          type: 'transport',
          time: '08:00',
          title: '高铁前往苏州',
          description: '上海虹桥站 → 苏州站，约30分钟',
          duration: '30分钟',
          cost: '¥35'
        },
        {
          type: 'attraction',
          time: '09:30',
          title: '拙政园',
          image: 'https://images.unsplash.com/photo-1560448204-e02f11bad511?w=400&h=300&fit=crop',
          description: '中国四大名园之一，一步一景皆是画',
          duration: '3-4小时',
          ticketPrice: '¥70',
          rating: 4.9,
          location: '姑苏区东北街178号',
          tags: ['园林艺术', '文化遗产', '摄影圣地']
        },
        {
          type: 'food',
          time: '13:00',
          title: '得月楼',
          image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
          description: '苏州百年老店，正宗苏帮菜',
          cuisine: '苏帮菜',
          price: '¥180/人',
          rating: 4.7,
          location: '姑苏区太监弄',
          signatureDish: '松鼠桂鱼、响油鳝糊'
        },
        {
          type: 'attraction',
          time: '15:00',
          title: '留园',
          image: 'https://images.unsplash.com/photo-1560448204-e02f11bad511?w=400&h=300&fit=crop',
          description: '以建筑艺术著称的古典园林',
          duration: '2-3小时',
          ticketPrice: '¥55',
          rating: 4.8,
          location: '姑苏区留园路338号',
          tags: ['园林艺术', '建筑美学']
        },
        {
          type: 'food',
          time: '18:00',
          title: '松鹤楼',
          image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
          description: '苏州老字号，品尝正宗苏帮菜',
          cuisine: '苏帮菜',
          price: '¥200/人',
          rating: 4.6,
          location: '姑苏区太监弄',
          signatureDish: '清炒河虾仁、蟹粉豆腐'
        },
        {
          type: 'accommodation',
          time: '20:00',
          title: '苏州书香府邸',
          image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop',
          description: '古典园林风格，文化氛围浓厚',
          price: '¥800/晚',
          rating: 4.7,
          location: '姑苏区平江路',
          amenities: ['园林景观', '早餐', '茶室']
        }
      ]
    },
    {
      day: 3,
      date: '2024-04-17',
      city: '乌镇',
      summary: '水乡古镇 · 江南韵味',
      activities: [
        {
          type: 'transport',
          time: '08:00',
          title: '大巴前往乌镇',
          description: '苏州汽车站 → 乌镇汽车站，约1.5小时',
          duration: '1.5小时',
          cost: '¥50'
        },
        {
          type: 'attraction',
          time: '10:00',
          title: '乌镇东栅',
          image: 'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=400&h=300&fit=crop',
          description: '原汁原味的水乡古镇，小桥流水人家',
          duration: '3-4小时',
          ticketPrice: '¥100',
          rating: 4.8,
          location: '嘉兴市桐乡市乌镇',
          tags: ['古镇水乡', '历史文化', '摄影圣地']
        },
        {
          type: 'food',
          time: '13:00',
          title: '乌镇羊肉面',
          image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop',
          description: '当地特色美食，暖胃暖心',
          cuisine: '江南菜',
          price: '¥60/人',
          rating: 4.5,
          location: '乌镇东栅景区内',
          signatureDish: '红烧羊肉面、定胜糕'
        },
        {
          type: 'attraction',
          time: '15:00',
          title: '乌镇西栅',
          image: 'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=400&h=300&fit=crop',
          description: '夜景璀璨，体验江南水乡的浪漫',
          duration: '4-5小时',
          ticketPrice: '¥150',
          rating: 4.9,
          location: '嘉兴市桐乡市乌镇',
          tags: ['夜景', '古镇水乡', '浪漫']
        },
        {
          type: 'food',
          time: '19:00',
          title: '乌镇民宿晚餐',
          image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
          description: '品尝当地农家菜',
          cuisine: '农家菜',
          price: '¥100/人',
          rating: 4.4,
          location: '乌镇西栅景区内',
          signatureDish: '白水鱼、酱鸭'
        },
        {
          type: 'accommodation',
          time: '21:00',
          title: '乌镇通安客栈',
          image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop',
          description: '水乡特色客栈，枕水而眠',
          price: '¥600/晚',
          rating: 4.6,
          location: '乌镇西栅景区内',
          amenities: ['水景房', '早餐', '免费WiFi']
        }
      ]
    },
    {
      day: 4,
      date: '2024-04-18',
      city: '杭州',
      summary: '西湖美景 · 诗画江南',
      activities: [
        {
          type: 'transport',
          time: '08:00',
          title: '大巴前往杭州',
          description: '乌镇汽车站 → 杭州汽车东站，约2小时',
          duration: '2小时',
          cost: '¥60'
        },
        {
          type: 'attraction',
          time: '10:30',
          title: '西湖',
          image: '/images/cities/hangzhou.jpg',
          description: '断桥残雪、苏堤春晓、雷峰夕照，西湖十景美不胜收',
          duration: '4-6小时',
          ticketPrice: '免费',
          rating: 4.9,
          location: '杭州市西湖区',
          tags: ['自然风光', '人文古迹', '网红打卡']
        },
        {
          type: 'food',
          time: '12:30',
          title: '楼外楼',
          image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
          description: '百年老店，正宗西湖醋鱼',
          cuisine: '杭帮菜',
          price: '¥200/人',
          rating: 4.8,
          location: '孤山路30号',
          signatureDish: '西湖醋鱼、东坡肉'
        },
        {
          type: 'attraction',
          time: '14:30',
          title: '雷峰塔',
          image: '/images/cities/hangzhou.jpg',
          description: '登高望远，俯瞰西湖全景',
          duration: '1-2小时',
          ticketPrice: '¥40',
          rating: 4.7,
          location: '杭州市西湖区南山路',
          tags: ['历史古迹', '观景']
        },
        {
          type: 'food',
          time: '18:00',
          title: '知味观',
          image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop',
          description: '杭州老字号，品尝地道杭帮菜',
          cuisine: '杭帮菜',
          price: '¥120/人',
          rating: 4.6,
          location: '仁和路83号',
          signatureDish: '龙井虾仁、叫化鸡'
        },
        {
          type: 'accommodation',
          time: '20:00',
          title: '杭州西湖国宾馆',
          image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
          description: '西湖边五星级园林式酒店，环境优美',
          price: '¥1,200/晚',
          rating: 4.9,
          location: '西湖区杨公堤',
          amenities: ['西湖景观', '早餐', '泳池', '健身房']
        }
      ]
    }
  ]
};

const ItineraryDetailJiangnan = () => {
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);
  const [detailModal, setDetailModal] = useState({ visible: false, data: null });

  useEffect(() => {
    setTimeout(() => {
      setItinerary(mockItineraryData);
      setLoading(false);
    }, 1500);
  }, []);

  const getActivityIcon = (type) => {
    const icons = {
      attraction: <EnvironmentOutlined style={{ color: '#52c41a' }} />,
      food: <CoffeeOutlined style={{ color: '#fa8c16' }} />,
      transport: <CarOutlined style={{ color: '#1890ff' }} />,
      accommodation: <HomeOutlined style={{ color: '#722ed1' }} />
    };
    return icons[type] || <EnvironmentOutlined />;
  };

  const getActivityTypeLabel = (type) => {
    const labels = {
      attraction: '景点',
      food: '美食',
      transport: '交通',
      accommodation: '住宿'
    };
    return labels[type] || '其他';
  };

  const getActivityTypeColor = (type) => {
    const colors = {
      attraction: '#52c41a',
      food: '#fa8c16',
      transport: '#1890ff',
      accommodation: '#722ed1'
    };
    return colors[type] || '#666';
  };

  const handleActivityClick = (activity) => {
    setDetailModal({ visible: true, data: activity });
  };

  const handleExportPDF = () => {
    message.success('PDF导出功能开发中...');
  };

  const handleShare = () => {
    message.success('分享链接已复制到剪贴板');
  };

  const handleEdit = () => {
    message.info('编辑功能开发中...');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #E8F5F3 0%, #F0F4F8 100%)'
      }}>
        <Spin size="large" tip="加载行程中..." />
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #E8F5F3 0%, #F0F4F8 100%)'
      }}>
        <Empty description="暂无行程数据" />
      </div>
    );
  }

  const budgetProgress = Math.round((itinerary.estimatedCost / itinerary.budget) * 100);
  const currentDayPlan = itinerary.dailyPlans.find(day => day.day === selectedDay);

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #E8F5F3 0%, #F0F4F8 100%)',
      paddingBottom: '100px'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        .slide-in {
          animation: slideIn 0.5s ease-out;
        }
        .card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 16px 40px rgba(74, 85, 104, 0.15);
        }
        .day-tab-active {
          background: linear-gradient(135deg, #4A90A4 0%, #5BA3B8 100%);
          color: #fff;
          transform: scale(1.05);
        }
        .timeline-item {
          animation: slideIn 0.5s ease-out;
        }
        .timeline-item:nth-child(1) { animation-delay: 0.1s; }
        .timeline-item:nth-child(2) { animation-delay: 0.2s; }
        .timeline-item:nth-child(3) { animation-delay: 0.3s; }
        .timeline-item:nth-child(4) { animation-delay: 0.4s; }
        .timeline-item:nth-child(5) { animation-delay: 0.5s; }
        .timeline-item:nth-child(6) { animation-delay: 0.6s; }
      `}</style>

      <div className="fade-in" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <div style={{ 
          position: 'relative',
          borderRadius: '24px',
          overflow: 'hidden',
          marginBottom: '32px',
          boxShadow: '0 8px 32px rgba(74, 85, 104, 0.12)'
        }}>
          <div style={{
            height: '300px',
            backgroundImage: `url(${itinerary.coverImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, rgba(74, 85, 104, 0.3) 0%, rgba(74, 85, 104, 0.7) 100%)'
            }} />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '32px',
              color: '#fff'
            }}>
              <Title level={1} style={{ 
                color: '#fff', 
                margin: 0, 
                fontSize: '36px',
                fontWeight: 700,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
                {itinerary.title}
              </Title>
              <div style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Tag color="white" style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  color: '#fff',
                  border: 'none',
                  padding: '6px 16px',
                  fontSize: '14px'
                }}>
                  <CalendarOutlined /> {itinerary.startDate} ~ {itinerary.endDate}
                </Tag>
                <Tag color="white" style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  color: '#fff',
                  border: 'none',
                  padding: '6px 16px',
                  fontSize: '14px'
                }}>
                  <ClockCircleOutlined /> {itinerary.totalDays} 天
                </Tag>
                <Tag color="white" style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  color: '#fff',
                  border: 'none',
                  padding: '6px 16px',
                  fontSize: '14px'
                }}>
                  <HeartOutlined /> {itinerary.companionType}
                </Tag>
              </div>
            </div>
          </div>
        </div>

        <div style={{ 
          background: '#fff',
          borderRadius: '20px',
          padding: '28px',
          marginBottom: '32px',
          boxShadow: '0 4px 20px rgba(74, 85, 104, 0.08)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <Text strong style={{ fontSize: '18px', color: '#4A5568' }}>预算进度</Text>
          </div>
          <Progress 
            percent={budgetProgress} 
            strokeColor={{
              '0%': '#4A90A4',
              '100%': '#5BA3B8'
            }}
            trailColor="#E8F5F3"
            strokeWidth={12}
            format={(percent) => `${percent}%`}
            style={{ marginBottom: '16px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
            <Text>预估花费：¥{itinerary.estimatedCost.toLocaleString()}</Text>
            <Text>总预算：¥{itinerary.budget.toLocaleString()}</Text>
          </div>
        </div>

        <div style={{ 
          background: '#fff',
          borderRadius: '20px',
          padding: '28px',
          marginBottom: '32px',
          boxShadow: '0 4px 20px rgba(74, 85, 104, 0.08)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <Text strong style={{ fontSize: '18px', color: '#4A5568' }}>兴趣标签</Text>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {itinerary.interests.map((interest, index) => (
              <Tag 
                key={index} 
                color="#4A90A4"
                style={{ 
                  padding: '8px 20px',
                  fontSize: '14px',
                  borderRadius: '20px',
                  border: 'none'
                }}
              >
                {interest}
              </Tag>
            ))}
          </div>
        </div>

        <div style={{ 
          background: '#fff',
          borderRadius: '20px',
          padding: '28px',
          marginBottom: '32px',
          boxShadow: '0 4px 20px rgba(74, 85, 104, 0.08)'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <Text strong style={{ fontSize: '18px', color: '#4A5568' }}>行程日期</Text>
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            overflowX: 'auto',
            paddingBottom: '8px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {itinerary.dailyPlans.map((day) => (
              <button
                key={day.day}
                onClick={() => setSelectedDay(day.day)}
                style={{
                  minWidth: '140px',
                  padding: '16px 24px',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  background: selectedDay === day.day 
                    ? 'linear-gradient(135deg, #4A90A4 0%, #5BA3B8 100%)' 
                    : '#F8FAFC',
                  color: selectedDay === day.day ? '#fff' : '#4A5568',
                  boxShadow: selectedDay === day.day 
                    ? '0 8px 24px rgba(74, 144, 164, 0.3)' 
                    : '0 2px 8px rgba(74, 85, 104, 0.08)',
                  transform: selectedDay === day.day ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                <div style={{ fontSize: '14px', marginBottom: '4px', opacity: 0.9 }}>
                  Day {day.day}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>
                  {day.city}
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                  {day.summary}
                </div>
              </button>
            ))}
          </div>
        </div>

        {currentDayPlan && (
          <div className="fade-in" style={{ 
            background: '#fff',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '32px',
            boxShadow: '0 4px 20px rgba(74, 85, 104, 0.08)'
          }}>
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
              <Title level={2} style={{ 
                color: '#4A5568', 
                margin: 0,
                fontSize: '28px',
                fontWeight: 600
              }}>
                Day {currentDayPlan.day} · {currentDayPlan.city}
              </Title>
              <Text style={{ color: '#8B9AAF', fontSize: '16px', marginTop: '8px', display: 'block' }}>
                {currentDayPlan.summary}
              </Text>
            </div>

            <Timeline
              mode="left"
              style={{ marginTop: '24px' }}
              items={currentDayPlan.activities.map((activity, index) => ({
                color: getActivityTypeColor(activity.type),
                dot: getActivityIcon(activity.type),
                children: (
                  <div 
                    key={index}
                    className="timeline-item card-hover"
                    style={{
                      padding: '20px',
                      borderRadius: '16px',
                      background: activity.type === 'transport' ? '#F0F9FF' : '#FAF9F6',
                      border: `1px solid ${activity.type === 'transport' ? '#BAE6FD' : '#E8F5F3'}`,
                      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      cursor: activity.type !== 'transport' ? 'pointer' : 'default',
                      marginBottom: '16px'
                    }}
                    onClick={() => activity.type !== 'transport' && handleActivityClick(activity)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <Tag 
                          color={getActivityTypeColor(activity.type)}
                          style={{ 
                            marginBottom: '8px',
                            border: 'none',
                            padding: '4px 12px',
                            fontSize: '12px'
                          }}
                        >
                          {getActivityTypeLabel(activity.type)}
                        </Tag>
                        <div style={{ fontSize: '14px', color: '#8B9AAF', marginBottom: '4px' }}>
                          <ClockCircleOutlined style={{ marginRight: '4px' }} />
                          {activity.time}
                        </div>
                      </div>
                      {activity.rating && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <StarOutlined style={{ color: '#FAAD14', fontSize: '14px' }} />
                          <Text style={{ fontSize: '14px', fontWeight: 500 }}>{activity.rating}</Text>
                        </div>
                      )}
                    </div>

                    <Title level={4} style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '18px',
                      color: '#2D3748',
                      fontWeight: 600
                    }}>
                      {activity.title}
                    </Title>

                    {activity.image && (
                      <div style={{
                        height: '160px',
                        backgroundImage: `url(${activity.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '12px',
                        marginBottom: '12px'
                      }} />
                    )}

                    <Paragraph style={{ 
                      margin: '0 0 12px 0', 
                      color: '#4A5568',
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}>
                      {activity.description}
                    </Paragraph>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: '#718096' }}>
                      {activity.location && (
                        <span>
                          <EnvironmentOutlined style={{ marginRight: '4px', color: '#4A90A4' }} />
                          {activity.location}
                        </span>
                      )}
                      {activity.duration && (
                        <span>
                          <ClockCircleOutlined style={{ marginRight: '4px', color: '#4A90A4' }} />
                          {activity.duration}
                        </span>
                      )}
                      {activity.ticketPrice && (
                        <span>
                          <DollarOutlined style={{ marginRight: '4px', color: '#4A90A4' }} />
                          {activity.ticketPrice}
                        </span>
                      )}
                      {activity.cost && (
                        <span>
                          <DollarOutlined style={{ marginRight: '4px', color: '#4A90A4' }} />
                          {activity.cost}
                        </span>
                      )}
                    </div>

                    {activity.tags && (
                      <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {activity.tags.map((tag, idx) => (
                          <Tag key={idx} color="#4A90A4" style={{ fontSize: '12px', border: 'none' }}>
                            {tag}
                          </Tag>
                        ))}
                      </div>
                    )}

                    {activity.signatureDish && (
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '8px 12px', 
                        background: '#FFF7ED', 
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#C2410C'
                      }}>
                        <CoffeeOutlined style={{ marginRight: '4px' }} />
                        招牌：{activity.signatureDish}
                      </div>
                    )}

                    {activity.amenities && (
                      <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {activity.amenities.map((amenity, idx) => (
                          <Tag key={idx} color="#722ed1" style={{ fontSize: '12px', border: 'none' }}>
                            {amenity}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }))}
            />
          </div>
        )}

        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '16px 24px',
          boxShadow: '0 -4px 20px rgba(74, 85, 104, 0.1)',
          zIndex: 1000
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Button
              size="large"
              icon={<EditOutlined />}
              onClick={handleEdit}
              style={{
                borderRadius: '12px',
                height: '48px',
                fontSize: '16px',
                fontWeight: 500,
                border: '2px solid #4A90A4',
                color: '#4A90A4',
                background: 'transparent'
              }}
            >
              编辑行程
            </Button>
            <Button
              size="large"
              icon={<DownloadOutlined />}
              onClick={handleExportPDF}
              style={{
                borderRadius: '12px',
                height: '48px',
                fontSize: '16px',
                fontWeight: 500,
                border: '2px solid #4A90A4',
                color: '#4A90A4',
                background: 'transparent'
              }}
            >
              导出PDF
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<ShareAltOutlined />}
              onClick={handleShare}
              style={{
                borderRadius: '12px',
                height: '48px',
                fontSize: '16px',
                fontWeight: 500,
                background: 'linear-gradient(135deg, #4A90A4 0%, #5BA3B8 100%)',
                border: 'none'
              }}
            >
              分享给好友
            </Button>
          </div>
        </div>
      </div>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {getActivityIcon(detailModal.data?.type)}
            <span>{detailModal.data?.title}</span>
          </div>
        }
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, data: null })}
        footer={[
          <Button key="close" onClick={() => setDetailModal({ visible: false, data: null })}>
            关闭
          </Button>,
          <Button key="favorite" icon={<HeartOutlined />} type="default">
            收藏
          </Button>
        ]}
        width={600}
        style={{ borderRadius: '20px' }}
      >
        {detailModal.data && (
          <div>
            {detailModal.data.image && (
              <div style={{
                height: '200px',
                backgroundImage: `url(${detailModal.data.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '12px',
                marginBottom: '16px'
              }} />
            )}
            
            <div style={{ marginBottom: '16px' }}>
              <Tag 
                color={getActivityTypeColor(detailModal.data.type)}
                style={{ marginBottom: '8px', border: 'none' }}
              >
                {getActivityTypeLabel(detailModal.data.type)}
              </Tag>
              {detailModal.data.rating && (
                <Rate disabled defaultValue={detailModal.data.rating} style={{ marginLeft: '12px', fontSize: '14px' }} />
              )}
            </div>

            <Paragraph style={{ fontSize: '15px', lineHeight: '1.8', color: '#4A5568' }}>
              {detailModal.data.description}
            </Paragraph>

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {detailModal.data.location && (
                <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>位置</Text>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>
                    {detailModal.data.location}
                  </div>
                </div>
              )}
              {detailModal.data.duration && (
                <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>建议时长</Text>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>
                    {detailModal.data.duration}
                  </div>
                </div>
              )}
              {detailModal.data.ticketPrice && (
                <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>门票价格</Text>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '4px', color: '#52c41a' }}>
                    {detailModal.data.ticketPrice}
                  </div>
                </div>
              )}
              {detailModal.data.price && (
                <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>人均消费</Text>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '4px', color: '#fa8c16' }}>
                    {detailModal.data.price}
                  </div>
                </div>
              )}
            </div>

            {detailModal.data.signatureDish && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                background: '#FFF7ED', 
                borderRadius: '8px',
                border: '1px solid #FFEDD5'
              }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>招牌菜</Text>
                <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '4px', color: '#C2410C' }}>
                  {detailModal.data.signatureDish}
                </div>
              </div>
            )}

            {detailModal.data.tags && (
              <div style={{ marginTop: '16px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>标签</Text>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {detailModal.data.tags.map((tag, idx) => (
                    <Tag key={idx} color="#4A90A4" style={{ fontSize: '12px', border: 'none' }}>
                      {tag}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {detailModal.data.amenities && (
              <div style={{ marginTop: '16px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>设施服务</Text>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {detailModal.data.amenities.map((amenity, idx) => (
                    <Tag key={idx} color="#722ed1" style={{ fontSize: '12px', border: 'none' }}>
                      {amenity}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ItineraryDetailJiangnan;
