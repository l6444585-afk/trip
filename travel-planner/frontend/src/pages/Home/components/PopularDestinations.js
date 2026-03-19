import React from 'react';
import { Card, Tag, Space, Typography, Button } from 'antd';
import { StarOutlined, FireOutlined, ThunderboltOutlined, LoadingOutlined } from '@ant-design/icons';
import LazyImage from '../../../components/LazyImage';

const { Text, Paragraph } = Typography;

const PopularDestinations = ({ 
  destinations, 
  onQuickPlan, 
  isNavigating 
}) => {
  return (
    <div style={{ marginBottom: 60 }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-start', 
        alignItems: 'center', 
        marginBottom: 32, 
        position: 'relative' 
      }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>
          热门目的地
        </h2>
        <Tag color="red" icon={<FireOutlined />} style={{ marginLeft: 16 }}>实时热度</Tag>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px'
      }}>
        {destinations.map((dest) => (
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
            <div style={{ position: 'relative' }}>
              <LazyImage
                src={dest.image}
                alt={dest.name}
                style={{
                  height: 200,
                  width: '100%',
                  objectFit: 'cover'
                }}
              />
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
                onClick={() => onQuickPlan(dest)}
                loading={isNavigating}
                style={{
                  borderRadius: 8,
                  height: 36,
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  background: 'linear-gradient(135deg, #1A936F 0%, #114B5F 100%)',
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
  );
};

export default PopularDestinations;
