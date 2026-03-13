import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Space, Typography, Tag, Divider, Avatar, Rate } from 'antd';
import { EnvironmentOutlined, ClockOutlined, DollarOutlined, StarOutlined, HeartOutlined, ShareAltOutlined } from '@ant-design/icons';
import ImageGenerator from './ImageGenerator';

const { Title, Text, Paragraph } = Typography;

const AttractionCard = ({ attraction, onFavorite, onShare }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  const getCategoryColor = (category) => {
    const colors = {
      '自然风光': '#2E8B57',
      '历史文化': '#607D8B',
      '美食': '#E8B86D',
      '购物': '#E91E63',
      '娱乐': '#9C27B0',
      '艺术': '#4A90A4'
    };
    return colors[category] || '#607D8B';
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    if (onFavorite) {
      onFavorite(attraction, !isFavorite);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(attraction);
    }
  };

  const handleImageGenerated = (imageUrl) => {
    setGeneratedImage(imageUrl);
  };

  return (
    <Card
      className="ink-card hover-lift"
      style={{ 
        borderRadius: 20,
        height: '100%',
        overflow: 'hidden'
      }}
      styles={{ body: { padding: 0 } }}
      cover={
        <div style={{ 
          height: 240,
          background: 'linear-gradient(135deg, #2E8B57 0%, #4CAF50 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {generatedImage ? (
            <img
              src={generatedImage}
              alt={attraction.name}
              style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{ 
              fontSize: 80,
              opacity: 0.9
            }}>
              🏞️
            </div>
          )}
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '4px 12px',
            color: '#fff',
            fontSize: 12,
            fontWeight: 500
          }}>
            {attraction.city}
          </div>
          {attraction.is_featured && (
            <div style={{
              position: 'absolute',
              top: 12,
              left: 12,
              background: 'linear-gradient(135deg, #E8B86D 0%, #FFD54F 100%)',
              borderRadius: '12px',
              padding: '4px 12px',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <StarOutlined />
              精选
            </div>
          )}
        </div>
      }
    >
      <div style={{ padding: '20px 24px' }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 12
        }}>
          <div style={{ flex: 1 }}>
            <Title level={5} style={{ 
              marginBottom: 8, 
              color: '#1a1a1a',
              fontSize: 18
            }}>
              {attraction.name}
            </Title>
            <Space size={[4, 4]} wrap>
              <Tag 
                color={getCategoryColor(attraction.category)}
                style={{ 
                  borderRadius: '12px',
                  padding: '4px 12px',
                  fontSize: 12,
                  border: 'none'
                }}
              >
                {attraction.category}
              </Tag>
              {attraction.subcategory && (
                <Tag 
                  style={{ 
                    borderRadius: '12px',
                    padding: '4px 12px',
                    fontSize: 12,
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    background: '#F5F5F5'
                  }}
                >
                  {attraction.subcategory}
                </Tag>
              )}
            </Space>
          </div>
          <Button
            type="text"
            icon={<HeartOutlined />}
            onClick={handleFavorite}
            style={{ 
              color: isFavorite ? '#E91E63' : '#8a8a8a',
              fontSize: 20
            }}
          />
        </div>

        <Paragraph 
          style={{ 
            color: '#5a5a5a', 
            fontSize: 14,
            marginBottom: 16,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {attraction.description}
        </Paragraph>

        <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: '#4A90A4', fontSize: 14 }} />
            <Text style={{ color: '#5a5a5a', fontSize: 13 }}>
              {attraction.city}
            </Text>
          </div>

          {attraction.recommended_duration && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClockOutlined style={{ color: '#E8B86D', fontSize: 14 }} />
              <Text style={{ color: '#5a5a5a', fontSize: 13 }}>
                建议游玩 {attraction.recommended_duration} 小时
              </Text>
            </div>
          )}

          {attraction.ticket_price && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarOutlined style={{ color: '#2E8B57', fontSize: 14 }} />
              <Text style={{ color: '#5a5a5a', fontSize: 13 }}>
                门票 ¥{attraction.ticket_price}
              </Text>
            </div>
          )}

          {attraction.rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StarOutlined style={{ color: '#E8B86D', fontSize: 14 }} />
              <Text style={{ color: '#5a5a5a', fontSize: 13 }}>
                {attraction.rating} 分
              </Text>
              {attraction.review_count && (
                <Text style={{ color: '#8a8a8a', fontSize: 12 }}>
                  ({attraction.review_count} 条评价)
                </Text>
              )}
            </div>
          )}
        </Space>

        <Divider style={{ margin: '16px 0' }} />

        <Space size="small" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button
            type="text"
            icon={<ShareAltOutlined />}
            onClick={handleShare}
            style={{ color: '#4A90A4', fontSize: 13 }}
          >
            分享
          </Button>
          <Button
            type="primary"
            size="small"
            onClick={() => setShowImageGenerator(!showImageGenerator)}
            style={{ 
              borderRadius: 8,
              background: 'linear-gradient(135deg, #2E8B57 0%, #4CAF50 100%)',
              border: 'none'
            }}
          >
            {showImageGenerator ? '收起' : '生成图片'}
          </Button>
        </Space>

        {showImageGenerator && (
          <div style={{ marginTop: 16 }}>
            <ImageGenerator
              schedule={{
                activity: attraction.name,
                location: attraction.city
              }}
              onImageGenerated={handleImageGenerated}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default AttractionCard;
