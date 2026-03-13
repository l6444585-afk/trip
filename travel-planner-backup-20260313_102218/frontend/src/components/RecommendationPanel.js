import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Space, Typography, Button, Rate, Divider, Avatar, Tooltip } from 'antd';
import { EnvironmentOutlined, ClockOutlined, DollarOutlined, StarOutlined, HeartOutlined, ShareAltOutlined, ThunderboltOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

const RecommendationPanel = ({ userPreferences, onAttractionSelect }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [specialTags, setSpecialTags] = useState([]);

  useEffect(() => {
    if (userPreferences) {
      fetchRecommendations();
      fetchSpecialTags();
    }
  }, [userPreferences]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/recommendations/attractions', {
        interests: userPreferences.interests || [],
        companion_type: userPreferences.companion_type || '情侣',
        budget: userPreferences.budget || 3000,
        days: userPreferences.days || 3,
        departure: userPreferences.departure,
        current_season: '春',
        limit: 6
      });

      if (response.data.status === 'success') {
        setRecommendations(response.data.data.attractions);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialTags = async () => {
    try {
      const response = await axios.get('/api/recommendations/tags');
      if (response.data.status === 'success') {
        setSpecialTags(response.data.data.tags);
      }
    } catch (error) {
      console.error('Failed to fetch special tags:', error);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return '#2E8B57';
    if (score >= 0.6) return '#E8B86D';
    return '#607D8B';
  };

  const getCategoryColor = (category) => {
    const colors = {
      '自然风光': '#2E8B57',
      '历史文化': '#607D8B',
      '美食': '#E8B86D',
      '购物': '#E91E63',
      '娱乐': '#9C27B0',
      '现代都市': '#4A90A4'
    };
    return colors[category] || '#607D8B';
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <Space align="center">
          <ThunderboltOutlined style={{ color: '#2E8B57', fontSize: 24 }} />
          <Title level={3} style={{ margin: 0 }}>
            智能推荐
          </Title>
        </Space>
        <Paragraph style={{ color: '#5a5a5a', marginTop: 8 }}>
          基于您的偏好，为您精选江浙沪最佳景点
        </Paragraph>
      </div>

      {specialTags.length > 0 && (
        <Card
          className="ink-card"
          style={{ marginBottom: 24, borderRadius: 16 }}
          styles={{ body: { padding: '20px 24px' } }}
        >
          <Title level={5} style={{ marginBottom: 16 }}>
            特色标签
          </Title>
          <Space size={[8, 8]} wrap>
            {specialTags.map((tag, index) => (
              <Tag
                key={index}
                style={{
                  borderRadius: '16px',
                  padding: '6px 16px',
                  fontSize: 14,
                  border: 'none',
                  background: '#F5F5F5',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                className="hover-lift"
              >
                <Space size={4}>
                  <span>{tag.icon}</span>
                  <span>{tag.tag}</span>
                </Space>
              </Tag>
            ))}
          </Space>
        </Card>
      )}

      {loading ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: 300,
          gap: 16
        }}>
          <div style={{ fontSize: 48 }}>🎯</div>
          <Text style={{ color: '#5a5a5a' }}>正在为您生成推荐...</Text>
        </div>
      ) : recommendations.length > 0 ? (
        <Row gutter={[16, 16]}>
          {recommendations.map((attraction, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Card
                className="ink-card hover-lift"
                style={{ 
                  borderRadius: 16,
                  height: '100%',
                  border: '2px solid rgba(0, 0, 0, 0.05)'
                }}
                styles={{ body: { padding: '20px' } }}
                extra={
                  <div style={{
                    background: `${getScoreColor(attraction.recommendation_score)}15`,
                    padding: '4px 12px',
                    borderRadius: '12px',
                    color: getScoreColor(attraction.recommendation_score),
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    匹配度 {Math.round(attraction.recommendation_score * 100)}%
                  </div>
                }
              >
                <div style={{ marginBottom: 16 }}>
                  <Title level={5} style={{ 
                    marginBottom: 8, 
                    color: '#1a1a1a',
                    fontSize: 16
                  }}>
                    {attraction.name}
                  </Title>
                  <Space size={[4, 4]} wrap>
                    <Tag 
                      color={getCategoryColor(attraction.category)}
                      style={{ 
                        borderRadius: '12px',
                        padding: '2px 10px',
                        fontSize: 12,
                        border: 'none'
                      }}
                    >
                      {attraction.category}
                    </Tag>
                    {attraction.tags.slice(0, 2).map((tag, idx) => (
                      <Tag 
                        key={idx}
                        style={{ 
                          borderRadius: '12px',
                          padding: '2px 10px',
                          fontSize: 12,
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          background: '#F5F5F5'
                        }}
                      >
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                </div>

                <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <EnvironmentOutlined style={{ color: '#4A90A4', fontSize: 14 }} />
                    <Text style={{ color: '#5a5a5a', fontSize: 13 }}>
                      {attraction.city}
                    </Text>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ClockOutlined style={{ color: '#E8B86D', fontSize: 14 }} />
                    <Text style={{ color: '#5a5a5a', fontSize: 13 }}>
                      建议游玩 {Math.round(attraction.duration / 60)} 小时
                    </Text>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DollarOutlined style={{ color: '#2E8B57', fontSize: 14 }} />
                    <Text style={{ color: '#5a5a5a', fontSize: 13 }}>
                      {attraction.cost === 0 ? '免费' : `¥${attraction.cost}`}
                    </Text>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StarOutlined style={{ color: '#E8B86D', fontSize: 14 }} />
                    <Rate 
                      disabled 
                      defaultValue={attraction.rating} 
                      count={5}
                      style={{ fontSize: 14 }}
                    />
                    <Text style={{ color: '#5a5a5a', fontSize: 12 }}>
                      {attraction.rating}
                    </Text>
                  </div>
                </Space>

                {attraction.match_reasons && attraction.match_reasons.length > 0 && (
                  <div style={{ 
                    marginTop: 12,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)',
                    borderRadius: 8,
                    borderLeft: '3px solid #E8B86D'
                  }}>
                    <Space direction="vertical" size={4}>
                      {attraction.match_reasons.map((reason, idx) => (
                        <Text key={idx} style={{ 
                          color: '#5a5a5a', 
                          fontSize: 12,
                          display: 'block'
                        }}>
                          ✨ {reason}
                        </Text>
                      ))}
                    </Space>
                  </div>
                )}

                <Divider style={{ margin: '16px 0' }} />

                <Button
                  type="primary"
                  block
                  size="small"
                  onClick={() => onAttractionSelect && onAttractionSelect(attraction)}
                  style={{ 
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #2E8B57 0%, #4CAF50 100%)',
                    border: 'none'
                  }}
                >
                  添加到行程
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card
          style={{ 
            textAlign: 'center',
            borderRadius: 16,
            padding: '60px 20px'
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎯</div>
          <Title level={4} style={{ marginBottom: 8 }}>
            暂无推荐
          </Title>
          <Paragraph style={{ color: '#5a5a5a' }}>
            请完善您的偏好设置以获取个性化推荐
          </Paragraph>
        </Card>
      )}
    </div>
  );
};

export default RecommendationPanel;
