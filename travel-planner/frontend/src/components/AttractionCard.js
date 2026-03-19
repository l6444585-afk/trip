import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Space, Typography, Tag, Divider, Avatar, Rate, Tooltip, message } from 'antd';
import {
  EnvironmentOutlined,
  ClockOutlined,
  DollarOutlined,
  StarOutlined,
  HeartOutlined,
  ShareAltOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CameraOutlined
} from '@ant-design/icons';
import ImageGenerator from './ImageGenerator';

const { Title, Text, Paragraph } = Typography;

const AttractionCard = ({ attraction, onFavorite, onShare, onAddToItinerary }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

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

  const handleAddToItinerary = () => {
    if (onAddToItinerary) {
      onAddToItinerary(attraction);
    }
    message.success(`已将「${attraction.name}」添加到行程规划`);
  };

  return (
    <Card
      className={`ink-card hover-lift ${isHovered ? 'hovered' : ''}`}
      style={{
        borderRadius: 20,
        height: '100%',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
      }}
      styles={{ body: { padding: 0 } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      cover={
        <div
          style={{
            height: 240,
            background: generatedImage
              ? 'transparent'
              : 'linear-gradient(135deg, #2E8B57 0%, #4CAF50 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {!imageLoaded && !generatedImage && (
            <div style={{
              fontSize: 80,
              opacity: 0.9
            }}>
              🏞️
            </div>
          )}
          {generatedImage && (
            <img
              src={generatedImage}
              alt={attraction.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: isHovered ? 1 : 0.9,
                transition: 'opacity 0.3s ease'
              }}
              onLoad={() => setImageLoaded(true)}
            />
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
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '40px 16px 12px',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          >
            <Space size="small">
              <Tooltip title="收藏">
                <Button
                  type="text"
                  size="small"
                  icon={<HeartOutlined />}
                  onClick={handleFavorite}
                  style={{ color: isFavorite ? '#E91E63' : '#fff' }}
                />
              </Tooltip>
              <Tooltip title="分享">
                <Button
                  type="text"
                  size="small"
                  icon={<ShareAltOutlined />}
                  onClick={handleShare}
                  style={{ color: '#fff' }}
                />
              </Tooltip>
            </Space>
          </div>
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

          {attraction.ticket_price !== undefined && attraction.ticket_price !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarOutlined style={{ color: '#2E8B57', fontSize: 14 }} />
              <Text style={{ color: '#5a5a5a', fontSize: 13 }}>
                {attraction.ticket_price === 0 ? '免费' : `门票 ¥${attraction.ticket_price}`}
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

        {attraction.tips && (
          <div style={{
            background: '#F5F5F5',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8
          }}>
            <InfoCircleOutlined style={{ color: '#4A90A4', fontSize: 14, marginTop: 2 }} />
            <Text style={{ color: '#5a5a5a', fontSize: 12 }}>
              {attraction.tips}
            </Text>
          </div>
        )}

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
          <Space size="small">
            <Button
              type="primary"
              size="small"
              icon={<CameraOutlined />}
              onClick={() => setShowImageGenerator(!showImageGenerator)}
              style={{
                borderRadius: 8,
                background: 'linear-gradient(135deg, #2E8B57 0%, #4CAF50 100%)',
                border: 'none'
              }}
            >
              {showImageGenerator ? '收起' : '生成图片'}
            </Button>
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={handleAddToItinerary}
              style={{
                borderRadius: 8,
                background: 'linear-gradient(135deg, #4A90A4 0%, #2E8B57 100%)',
                border: 'none'
              }}
            >
              加入行程
            </Button>
          </Space>
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
