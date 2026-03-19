import React, { useState } from 'react';
import { Card, Row, Col, Button, Space, Typography, Tag, Rate, Dropdown, message } from 'antd';
import { 
  EnvironmentOutlined, 
  PhoneOutlined, 
  StarOutlined,
  HomeOutlined,
  LinkOutlined,
  HeartOutlined,
  HeartFilled,
  MoreOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const HotelCard = ({ hotel, onFavorite, checkIn, checkOut }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  const getStarRatingDisplay = (starRating) => {
    if (!starRating) return null;
    const stars = '⭐'.repeat(Math.min(starRating, 5));
    return stars;
  };

  const getPriceDisplay = (priceMin, priceMax, starRating) => {
    if (priceMin && priceMax) return `¥${priceMin} - ¥${priceMax}`;
    if (priceMin) return `¥${priceMin}起`;
    
    const star = starRating || 3;
    let basePrice;
    switch (star) {
      case 5:
        basePrice = 800;
        return `¥${basePrice} - ¥${basePrice + 1200}`;
      case 4:
        basePrice = 500;
        return `¥${basePrice} - ¥${basePrice + 1500}`;
      case 3:
        basePrice = 200;
        return `¥${basePrice} - ¥${basePrice + 200}`;
      case 2:
        basePrice = 120;
        return `¥${basePrice} - ¥${basePrice + 100}`;
      default:
        basePrice = 150;
        return `¥${basePrice} - ¥${basePrice + 150}`;
    }
  };

  const getStarTagColor = (starRating) => {
    if (!starRating) return 'default';
    if (starRating >= 5) return 'gold';
    if (starRating >= 4) return 'orange';
    if (starRating >= 3) return 'blue';
    return 'default';
  };

  const getStarTagText = (starRating) => {
    if (!starRating) return '酒店';
    if (starRating >= 5) return '豪华型';
    if (starRating >= 4) return '高档型';
    if (starRating >= 3) return '舒适型';
    return '经济型';
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    if (onFavorite) {
      onFavorite(hotel, !isFavorite);
    }
    message.success(isFavorite ? '已取消收藏' : '已添加收藏');
  };

  const handleBooking = (platform) => {
    const url = hotel.booking_links?.[platform];
    if (url) {
      window.open(url, '_blank');
    } else {
      message.warning('暂无预订链接');
    }
  };

  const bookingMenuItems = [
    {
      key: 'ctrip',
      label: (
        <span onClick={() => handleBooking('ctrip')}>
          🏨 携程预订
        </span>
      ),
    },
    {
      key: 'fliggy',
      label: (
        <span onClick={() => handleBooking('fliggy')}>
          ✈️ 飞猪预订
        </span>
      ),
    },
    {
      key: 'meituan',
      label: (
        <span onClick={() => handleBooking('meituan')}>
          📱 美团预订
        </span>
      ),
    },
    {
      key: 'qunar',
      label: (
        <span onClick={() => handleBooking('qunar')}>
          🔍 去哪儿预订
        </span>
      ),
    },
  ];

  return (
    <Card
      className="ink-card hover-lift"
      style={{ 
        borderRadius: 16,
        height: '100%',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column'
      }}
      styles={{ body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column' } }}
      cover={
        <div style={{ 
          height: 180,
          flexShrink: 0,
          background: 'linear-gradient(135deg, #1A936F 0%, #114B5F 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {hotel.image_url ? (
            <img
              src={hotel.image_url}
              alt={hotel.name}
              style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{ 
              fontSize: 60,
              opacity: 0.9
            }}>
              🏨
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
            {hotel.source === 'mock' ? '模拟数据' : hotel.city}
          </div>
          <Tag 
            color={getStarTagColor(hotel.star_rating)}
            style={{ 
              position: 'absolute',
              top: 12,
              left: 12,
              borderRadius: '12px',
              padding: '4px 12px',
              fontSize: 12,
              border: 'none',
              fontWeight: 600
            }}
          >
            {getStarTagText(hotel.star_rating)}
          </Tag>
        </div>
      }
    >
      <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 8
        }}>
          <Title level={5} style={{ 
            marginBottom: 0, 
            color: '#1a1a1a',
            fontSize: 16,
            flex: 1,
            marginRight: 8
          }}>
            {hotel.name}
          </Title>
          <Button
            type="text"
            icon={isFavorite ? <HeartFilled style={{ color: '#E91E63' }} /> : <HeartOutlined />}
            onClick={handleFavorite}
            style={{ fontSize: 18 }}
          />
        </div>

        {hotel.rating && (
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Rate disabled defaultValue={hotel.rating / 5 * 5} style={{ fontSize: 12 }} />
            <Text style={{ color: '#E8B86D', fontSize: 13, fontWeight: 600 }}>
              {hotel.rating}
            </Text>
          </div>
        )}

        <div style={{ flex: 1 }}>
          <Paragraph 
            style={{ 
              color: '#5a5a5a', 
              fontSize: 13,
              marginBottom: 12,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {hotel.description || hotel.address}
          </Paragraph>

          <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <EnvironmentOutlined style={{ color: '#4A90A4', fontSize: 14 }} />
              <Text style={{ color: '#5a5a5a', fontSize: 13 }}>
                {hotel.address}
              </Text>
            </div>

            {hotel.distance_km && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: '#8a8a8a', fontSize: 12 }}>
                  距离目的地 {hotel.distance_km} 公里
                </Text>
              </div>
            )}

            {hotel.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PhoneOutlined style={{ color: '#2E8B57', fontSize: 14 }} />
                <Text style={{ color: '#5a5a5a', fontSize: 13 }}>
                  {hotel.phone}
                </Text>
              </div>
            )}

            {hotel.amenities && hotel.amenities.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {hotel.amenities.slice(0, 4).map((amenity, index) => (
                  <Tag 
                    key={index}
                    style={{ 
                      borderRadius: '8px',
                      padding: '2px 8px',
                      fontSize: 11,
                      background: '#F5F5F5',
                      border: 'none'
                    }}
                  >
                    {amenity}
                  </Tag>
                ))}
                {hotel.amenities.length > 4 && (
                  <Tag 
                    style={{ 
                      borderRadius: '8px',
                      padding: '2px 8px',
                      fontSize: 11,
                      background: '#E8F5E9',
                      border: 'none'
                    }}
                  >
                    +{hotel.amenities.length - 4}
                  </Tag>
                )}
              </div>
            )}
          </Space>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          paddingTop: 12,
          borderTop: '1px solid #f0f0f0',
          marginTop: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <Text style={{ color: '#E91E63', fontSize: 18, fontWeight: 600, lineHeight: 1 }}>
              {getPriceDisplay(hotel.price_min, hotel.price_max, hotel.star_rating)}
            </Text>
            <Text style={{ color: '#8a8a8a', fontSize: 12, marginLeft: 4, lineHeight: 1 }}>
              /晚
            </Text>
          </div>
          
          <Dropdown
            menu={{ items: bookingMenuItems }}
            placement="bottomRight"
          >
            <Button
              type="primary"
              icon={<LinkOutlined />}
              style={{ 
                borderRadius: 8,
                background: 'linear-gradient(135deg, #1A936F 0%, #114B5F 100%)',
                border: 'none'
              }}
            >
              预订
            </Button>
          </Dropdown>
        </div>
      </div>
    </Card>
  );
};

export default HotelCard;
