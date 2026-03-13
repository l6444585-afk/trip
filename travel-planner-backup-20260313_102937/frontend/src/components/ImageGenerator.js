import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Select, message, Spin, Image, Radio, Tag, Typography, Row, Col, Divider, Tooltip } from 'antd';
import { PictureOutlined, ReloadOutlined, DownloadOutlined, ShareAltOutlined, MagicOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

const ImageGenerator = ({ itinerary, schedule, onImageGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [style, setStyle] = useState('ink');
  const [prompt, setPrompt] = useState('');

  const styleOptions = [
    { 
      label: '水墨风格', 
      value: 'ink', 
      icon: '🎨',
      description: '中国水墨画风格，意境深远，留白艺术',
      color: '#2E8B57'
    },
    { 
      label: '写实风格', 
      value: 'realistic', 
      icon: '📷',
      description: '写实摄影风格，高清摄影，自然光线',
      color: '#4A90A4'
    },
    { 
      label: '艺术插画', 
      value: 'artistic', 
      icon: '🖼️',
      description: '艺术插画风格，色彩鲜艳，现代感强',
      color: '#E91E63'
    },
    { 
      label: '复古胶片', 
      value: 'vintage', 
      icon: '🎞️',
      description: '复古胶片风格，怀旧氛围，温暖色调',
      color: '#E8B86D'
    }
  ];

  useEffect(() => {
    if (schedule) {
      generatePrompt(schedule);
    } else if (itinerary) {
      generateItineraryPrompt(itinerary);
    }
  }, [itinerary, schedule]);

  const generatePrompt = (scheduleData) => {
    const basePrompt = `${scheduleData.activity}位于${scheduleData.location}`;
    setPrompt(basePrompt);
  };

  const generateItineraryPrompt = (itineraryData) => {
    const destination = itineraryData.departure || '江浙沪';
    const theme = '旅游';
    setPrompt(`${destination}${theme}`);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      let response;
      
      if (schedule) {
        response = await axios.post('/api/images/generate/attraction', {
          attraction_name: schedule.activity,
          location: schedule.location,
          category: '景点',
          style: style
        });
      } else if (itinerary) {
        response = await axios.post('/api/images/generate/itinerary-cover', {
          destination: itinerary.departure,
          theme: itinerary.title || '旅游',
          style: style
        });
      }

      if (response.data.status === 'success') {
        setImageUrl(response.data.data.image_url);
        message.success('图像生成成功！');
        
        if (onImageGenerated) {
          onImageGenerated(response.data.data.image_url);
        }
      } else {
        message.error(response.data.message || '图像生成失败');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      message.error('图像生成失败：' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `travel-image-${Date.now()}.png`;
    link.click();
    message.success('下载成功！');
  };

  const handleShare = async () => {
    if (!imageUrl) return;
    
    try {
      await navigator.clipboard.writeText(imageUrl);
      message.success('图片链接已复制到剪贴板');
    } catch (error) {
      message.error('复制失败');
    }
  };

  return (
    <Card
      className="ink-card"
      style={{ borderRadius: 20 }}
      styles={{ body: { padding: '28px 32px' } }}
      title={
        <Space>
          <MagicOutlined style={{ color: '#2E8B57', fontSize: 20 }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>AI 图像生成</span>
        </Space>
      }
      extra={
        <Tag color="#2E8B57" style={{ borderRadius: 12 }}>
          豆包 AI
        </Tag>
      }
    >
      <Row gutter={[32, 32]}>
        <Col xs={24} md={12}>
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ marginBottom: 12 }}>
              选择风格
            </Title>
            <Radio.Group 
              value={style} 
              onChange={(e) => setStyle(e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {styleOptions.map((option) => (
                  <Radio.Button 
                    key={option.value}
                    value={option.value}
                    style={{ 
                      width: '100%',
                      height: 'auto',
                      padding: '16px 20px',
                      borderRadius: 12,
                      border: '2px solid rgba(0, 0, 0, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Space>
                      <span style={{ fontSize: 28 }}>{option.icon}</span>
                      <div>
                        <Text style={{ 
                          fontSize: 15, 
                          fontWeight: 600,
                          color: '#1a1a1a',
                          display: 'block'
                        }}>
                          {option.label}
                        </Text>
                        <Text style={{ 
                          fontSize: 13, 
                          color: '#5a5a5a',
                          display: 'block'
                        }}>
                          {option.description}
                        </Text>
                      </div>
                    </Space>
                  </Radio.Button>
                ))}
              </Space>
            </Radio.Group>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ marginBottom: 12 }}>
              生成提示
            </Title>
            <div style={{ 
              padding: '16px',
              background: '#F5F5F5',
              borderRadius: 12,
              borderLeft: '3px solid #2E8B57'
            }}>
              <Text style={{ color: '#5a5a5a', fontSize: 14 }}>
                {prompt || '等待输入...'}
              </Text>
            </div>
          </div>

          <Space size="middle">
            <Button
              type="primary"
              icon={<PictureOutlined />}
              onClick={handleGenerate}
              loading={loading}
              size="large"
              style={{ 
                borderRadius: 12,
                height: 44,
                background: 'linear-gradient(135deg, #2E8B57 0%, #4CAF50 100%)',
                border: 'none',
                minWidth: 140
              }}
            >
              生成图像
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleGenerate}
              disabled={!imageUrl}
              size="large"
              style={{ borderRadius: 12, height: 44 }}
            >
              重新生成
            </Button>
          </Space>
        </Col>

        <Col xs={24} md={12}>
          <div style={{ 
            minHeight: 400,
            background: '#F5F5F5',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {loading ? (
              <div style={{ textAlign: 'center' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                  <Text style={{ color: '#5a5a5a' }}>AI 正在创作中...</Text>
                </div>
              </div>
            ) : imageUrl ? (
              <div style={{ width: '100%', height: '100%' }}>
                <Image
                  src={imageUrl}
                  alt="Generated Image"
                  style={{ 
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  preview
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ 
                  fontSize: 80,
                  marginBottom: 16,
                  opacity: 0.3
                }}>
                  🎨
                </div>
                <Text style={{ color: '#8a8a8a', fontSize: 16 }}>
                  点击"生成图像"开始创作
                </Text>
              </div>
            )}
          </div>

          {imageUrl && (
            <div style={{ marginTop: 16 }}>
              <Space size="middle">
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                  style={{ borderRadius: 8 }}
                >
                  下载
                </Button>
                <Button
                  icon={<ShareAltOutlined />}
                  onClick={handleShare}
                  style={{ borderRadius: 8 }}
                >
                  分享
                </Button>
              </Space>
            </div>
          )}
        </Col>
      </Row>

      <Divider style={{ margin: '24px 0' }} />

      <div>
        <Title level={5} style={{ marginBottom: 12 }}>
          💡 使用提示
        </Title>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text style={{ color: '#5a5a5a', fontSize: 14 }}>
            • 水墨风格：适合展现江南水乡、古典园林等传统景观
          </Text>
          <Text style={{ color: '#5a5a5a', fontSize: 14 }}>
            • 写实风格：适合展现现代都市、自然风光等真实场景
          </Text>
          <Text style={{ color: '#5a5a5a', fontSize: 14 }}>
            • 艺术插画：适合展现创意设计、艺术展览等现代主题
          </Text>
          <Text style={{ color: '#5a5a5a', fontSize: 14 }}>
            • 复古胶片：适合展现历史遗迹、怀旧氛围等复古主题
          </Text>
        </Space>
      </div>
    </Card>
  );
};

export default ImageGenerator;
