import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Space, Typography, Button, Tooltip, Divider } from 'antd';
import { EnvironmentOutlined, ClockOutlined, DollarOutlined, CameraOutlined, StarOutlined } from '@ant-design/icons';
import ImageGenerator from './ImageGenerator';

const { Title, Text, Paragraph } = Typography;

const ScheduleCard = ({ schedule, index, onEdit, onDelete, showImageGenerator = false }) => {
  const [imageGeneratorVisible, setImageGeneratorVisible] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  const getPeriodConfig = (period) => {
    const configs = {
      'morning': { label: '上午', color: '#FF9800', icon: '🌅', bg: '#FFF3E0' },
      'afternoon': { label: '下午', color: '#2196F3', icon: '☀️', bg: '#E3F2FD' },
      'evening': { label: '晚上', color: '#9C27B0', icon: '🌙', bg: '#F3E5F5' }
    };
    return configs[period] || { label: period, color: '#607D8B', icon: '📍', bg: '#ECEFF1' };
  };

  const periodConfig = getPeriodConfig(schedule.period);

  const handleImageGenerated = (imageUrl) => {
    setGeneratedImage(imageUrl);
  };

  return (
    <Card
      className="ink-card hover-lift"
      style={{ 
        borderRadius: 16,
        height: '100%',
        border: '2px solid rgba(0, 0, 0, 0.05)'
      }}
      styles={{ body: { padding: '24px' } }}
    >
      <div style={{ marginBottom: 20 }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16
        }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2E8B57 0%, #4CAF50 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 600,
              color: '#fff'
            }}>
              {index + 1}
            </div>
            <div>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 4
              }}>
                <span style={{ fontSize: 24 }}>
                  {periodConfig.icon}
                </span>
                <Tag 
                  color={periodConfig.color}
                  style={{ 
                    borderRadius: '12px',
                    padding: '4px 12px',
                    fontSize: 13,
                    fontWeight: 500
                  }}
                >
                  {periodConfig.label}
                </Tag>
              </div>
            </div>
          </div>
          
          {showImageGenerator && (
            <Tooltip title="生成景点图片">
              <Button
                type="text"
                icon={<CameraOutlined />}
                onClick={() => setImageGeneratorVisible(true)}
                style={{ color: '#2E8B57' }}
              />
            </Tooltip>
          )}
        </div>

        <Title level={5} style={{ marginBottom: 16, color: '#1a1a1a' }}>
          {schedule.activity}
        </Title>

        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: '#F5F5F5',
            borderRadius: 8
          }}>
            <EnvironmentOutlined style={{ color: '#4A90A4', fontSize: 14 }} />
            <Text style={{ color: '#5a5a5a', fontSize: 14 }}>
              {schedule.location}
            </Text>
          </div>

          {schedule.estimated_duration && (
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              background: '#F5F5F5',
              borderRadius: 8
            }}>
              <ClockOutlined style={{ color: '#E8B86D', fontSize: 14 }} />
              <Text style={{ color: '#5a5a5a', fontSize: 14 }}>
                约 {schedule.estimated_duration} 分钟
              </Text>
            </div>
          )}

          {schedule.estimated_cost && (
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              background: '#F5F5F5',
              borderRadius: 8
            }}>
              <DollarOutlined style={{ color: '#2E8B57', fontSize: 14 }} />
              <Text style={{ color: '#5a5a5a', fontSize: 14 }}>
                约 ¥{schedule.estimated_cost}
              </Text>
            </div>
          )}

          {schedule.notes && (
            <div style={{ 
              marginTop: 12,
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)',
              borderRadius: 8,
              borderLeft: '3px solid #E8B86D'
            }}>
              <Text style={{ color: '#5a5a5a', fontSize: 13 }}>
                💡 {schedule.notes}
              </Text>
            </div>
          )}
        </Space>
      </div>

      {generatedImage && (
        <div style={{ 
          marginTop: 16,
          borderRadius: 12,
          overflow: 'hidden',
          border: '2px solid rgba(0, 0, 0, 0.05)'
        }}>
          <img
            src={generatedImage}
            alt={schedule.activity}
            style={{ 
              width: '100%',
              height: 200,
              objectFit: 'cover'
            }}
          />
        </div>
      )}

      {imageGeneratorVisible && (
        <div style={{ marginTop: 24 }}>
          <Divider style={{ margin: '16px 0' }} />
          <ImageGenerator
            schedule={schedule}
            onImageGenerated={handleImageGenerated}
          />
        </div>
      )}
    </Card>
  );
};

export default ScheduleCard;
