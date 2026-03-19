import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Rate,
  Button,
  Spin,
  Typography,
  Space,
  Divider,
  Descriptions,
  Image,
  Tooltip,
  message,
  Breadcrumb,
  Modal,
  Carousel,
  Avatar
} from 'antd';
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  PhoneOutlined,
  GlobalOutlined,
  ArrowLeftOutlined,
  StarOutlined,
  ShareAltOutlined,
  HeartOutlined,
  HeartFilled,
  WarningOutlined,
  InfoCircleOutlined,
  CompassOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AMapLoader from '@amap/amap-jsapi-loader';
import './ScenicDetail.css';

const { Title, Text, Paragraph } = Typography;

const platformIcons = {
  ctrip: { name: '携程', color: '#2577E3', bgColor: '#E8F4FD' },
  qunar: { name: '去哪儿', color: '#FF7D00', bgColor: '#FFF4E6' },
  mafengwo: { name: '马蜂窝', color: '#FF9D00', bgColor: '#FFF8E6' },
  meituan: { name: '美团', color: '#FFC300', bgColor: '#FFFBEB' }
};

const ScenicDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [scenic, setScenic] = useState(null);
  const [favorite, setFavorite] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  
  const mapRef = useRef(null);
  const mapModalRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const carouselRef = useRef(null);

  useEffect(() => {
    fetchScenicDetail();
  }, [id]);

  useEffect(() => {
    if (scenic && scenic.latitude && scenic.longitude && mapRef.current) {
      initMap(mapRef, 'card');
    }
  }, [scenic]);

  useEffect(() => {
    if (mapModalVisible && scenic && scenic.latitude && scenic.longitude && mapModalRef.current) {
      initMap(mapModalRef, 'modal');
    }
  }, [mapModalVisible, scenic]);

  const fetchScenicDetail = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/scenic-spots/${id}`);
      if (response.data.success) {
        const data = response.data.data;
        if (typeof data.tags === 'string') {
          data.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
        }
        if (typeof data.suitable_for === 'string') {
          data.suitable_for = data.suitable_for.split(',').map(t => t.trim()).filter(Boolean);
        }
        setScenic(data);
      }
    } catch (error) {
      console.error('获取景区详情失败:', error);
      message.error('获取景区详情失败');
    } finally {
      setLoading(false);
    }
  };

  const initMap = async (mapElementRef, type) => {
    if (!mapElementRef?.current) return;

    if (type === 'modal' && mapInstanceRef.current) {
      mapInstanceRef.current.setTarget(null);
      mapInstanceRef.current = null;
    }

    try {
      const AMap = await AMapLoader.load({
        key: process.env.REACT_APP_AMAP_KEY || 'your_amap_key',
        version: '2.0',
        plugins: ['AMap.Marker', 'AMap.InfoWindow']
      });

      window._AMapSecurityConfig = {
        securityJsCode: process.env.REACT_APP_AMAP_SECURITY_CODE || ''
      };

      const map = new AMap.Map(mapElementRef.current, {
        zoom: type === 'modal' ? 15 : 14,
        center: [scenic.longitude, scenic.latitude],
        viewMode: '2D'
      });

      const marker = new AMap.Marker({
        position: [scenic.longitude, scenic.latitude],
        title: scenic.name
      });

      marker.setMap(map);

      const infoWindow = new AMap.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h4 style="margin: 0 0 8px;">${scenic.name}</h4>
            <p style="margin: 0; color: #666;">${scenic.address || ''}</p>
          </div>
        `,
        offset: new AMap.Pixel(0, -30)
      });

      marker.on('click', () => {
        infoWindow.open(map, marker.getPosition());
      });

      mapInstanceRef.current = map;
    } catch (error) {
      console.error('地图初始化失败:', error);
    }
  };

  const handleBack = () => {
    navigate('/scenic');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: scenic.name,
        text: scenic.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      message.success('链接已复制到剪贴板');
    }
  };

  const handlePlatformClick = (platform, url) => {
    window.open(url, '_blank');
  };

  const handlePrevImage = () => {
    if (carouselRef.current) {
      carouselRef.current.prev();
    }
  };

  const handleNextImage = () => {
    if (carouselRef.current) {
      carouselRef.current.next();
    }
  };

  const handleOpenFullscreen = () => {
    setFullscreenVisible(true);
  };

  const handleCloseFullscreen = () => {
    setFullscreenVisible(false);
  };

  const handleFullscreenPrev = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      if (carouselRef.current) {
        carouselRef.current.goTo(currentImageIndex - 1);
      }
    }
  };

  const handleFullscreenNext = () => {
    const images = scenic?.images || [];
    const displayImages = images.length > 0 ? images : [scenic?.image_url].filter(Boolean);
    if (currentImageIndex < displayImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      if (carouselRef.current) {
        carouselRef.current.goTo(currentImageIndex + 1);
      }
    }
  };

  const renderFullscreenGallery = () => {
    if (!fullscreenVisible) return null;

    const images = scenic?.images || [];
    const displayImages = images.length > 0 ? images : [scenic?.image_url].filter(Boolean);

    return (
      <div className="scenic-gallery-fullscreen">
        <div className="fullscreen-header">
          <h3>{scenic.name} ({currentImageIndex + 1}/{displayImages.length})</h3>
          <div className="fullscreen-close" onClick={handleCloseFullscreen}>×</div>
        </div>
        <div className="fullscreen-content">
          <button
            className="fullscreen-nav prev"
            onClick={handleFullscreenPrev}
            disabled={currentImageIndex === 0}
          >
            <LeftOutlined />
          </button>
          <img
            src={displayImages[currentImageIndex]}
            alt={`${scenic.name} - 图片${currentImageIndex + 1}`}
            className="fullscreen-image"
          />
          <button
            className="fullscreen-nav next"
            onClick={handleFullscreenNext}
            disabled={currentImageIndex === displayImages.length - 1}
          >
            <RightOutlined />
          </button>
        </div>
        <div className="fullscreen-footer">
          {displayImages.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`缩略图 ${index + 1}`}
              className={`fullscreen-thumb ${currentImageIndex === index ? 'active' : ''}`}
              onClick={() => {
                setCurrentImageIndex(index);
                if (carouselRef.current) {
                  carouselRef.current.goTo(index);
                }
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderPriceInfo = () => {
    if (!scenic) return null;
    
    if (scenic.ticket_price === 0) {
      return <Tag color="green" style={{ fontSize: 16, padding: '4px 12px' }}>免费开放</Tag>;
    }
    
    return (
      <div className="price-info">
        <Text type="secondary">门票价格：</Text>
        <Text strong style={{ fontSize: 24, color: '#ff4d4f' }}>¥{scenic.ticket_price}</Text>
        {scenic.ticket_price_peak > scenic.ticket_price && (
          <Text type="secondary" style={{ marginLeft: 8 }}>
            (旺季 ¥{scenic.ticket_price_peak})
          </Text>
        )}
      </div>
    );
  };

  const renderPlatformLinks = () => {
    if (!scenic?.platform_links) return null;
    
    const platforms = typeof scenic.platform_links === 'string' 
      ? JSON.parse(scenic.platform_links) 
      : scenic.platform_links;
    
    if (!platforms || Object.keys(platforms).length === 0) return null;
    
    return (
      <Card title="第三方平台" className="platform-card">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {Object.entries(platforms).map(([key, platform]) => {
            const iconInfo = platformIcons[key] || { name: platform.name, color: '#666', bgColor: '#f5f5f5' };
            return (
              <Button
                key={key}
                type="default"
                block
                onClick={() => handlePlatformClick(key, platform.url)}
                className="platform-button"
                style={{
                  borderColor: iconInfo.color,
                  color: iconInfo.color
                }}
              >
                <Space>
                  <Avatar 
                    size="small" 
                    style={{ 
                      backgroundColor: iconInfo.bgColor, 
                      color: iconInfo.color,
                      fontSize: 12,
                      fontWeight: 'bold'
                    }}
                  >
                    {iconInfo.name.charAt(0)}
                  </Avatar>
                  <span>在{platform.name}查看详情</span>
                </Space>
              </Button>
            );
          })}
        </Space>
      </Card>
    );
  };

  const renderImageGallery = () => {
    const images = scenic?.images || [];
    const displayImages = images.length > 0 ? images : [scenic?.image_url].filter(Boolean);

    if (displayImages.length === 0) {
      return (
        <div className="scenic-hero">
          <Image
            src="https://via.placeholder.com/800x400?text=暂无图片"
            alt={scenic.name}
            className="scenic-image"
            fallback="https://via.placeholder.com/800x400?text=暂无图片"
          />
        </div>
      );
    }

    if (displayImages.length === 1) {
      return (
        <div className="scenic-hero">
          <Image
            src={displayImages[0]}
            alt={scenic.name}
            className="scenic-image"
            fallback="https://via.placeholder.com/800x400?text=暂无图片"
            preview={{ mask: <div className="preview-mask"><span>点击预览</span></div> }}
          />
          <div className="scenic-badges">
            <Tag color="blue">{scenic.category}</Tag>
            {scenic.booking_required && (
              <Tag color="orange">需提前预约</Tag>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="scenic-gallery">
        <Carousel
          ref={carouselRef}
          dots={false}
          beforeChange={(from, to) => setCurrentImageIndex(to)}
        >
          {displayImages.map((img, index) => (
            <div key={index} onClick={handleOpenFullscreen}>
              <Image
                src={img}
                alt={`${scenic.name} - 图片${index + 1}`}
                className="scenic-image"
                fallback="https://via.placeholder.com/800x400?text=暂无图片"
                preview={false}
              />
            </div>
          ))}
        </Carousel>

        <div className="gallery-controls">
          <Button
            className="gallery-btn prev"
            icon={<LeftOutlined />}
            onClick={handlePrevImage}
          />
          <Button
            className="gallery-btn next"
            icon={<RightOutlined />}
            onClick={handleNextImage}
          />
        </div>

        <div className="gallery-indicator">
          {currentImageIndex + 1} / {displayImages.length}
        </div>

        <div className="scenic-badges">
          <Tag color="blue">{scenic.category}</Tag>
          {scenic.booking_required && (
            <Tag color="orange">需提前预约</Tag>
          )}
        </div>

        <div className="scenic-thumbnails">
          {displayImages.map((img, index) => (
            <div
              key={index}
              className={`thumbnail-item ${currentImageIndex === index ? 'active' : ''}`}
              onClick={() => {
                setCurrentImageIndex(index);
                if (carouselRef.current) {
                  carouselRef.current.goTo(index);
                }
              }}
            >
              <img src={img} alt={`缩略图 ${index + 1}`} />
            </div>
          ))}
        </div>

        {renderFullscreenGallery()}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="scenic-detail-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!scenic) {
    return (
      <div className="scenic-detail-empty">
        <Text>景区不存在或已下架</Text>
        <Button type="primary" onClick={handleBack}>返回列表</Button>
      </div>
    );
  }

  return (
    <div className="scenic-detail-page">
      <div className="scenic-detail-header">
        <div className="header-content">
          <Breadcrumb>
            <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              首页
            </Breadcrumb.Item>
            <Breadcrumb.Item onClick={handleBack} style={{ cursor: 'pointer' }}>
              景区列表
            </Breadcrumb.Item>
            <Breadcrumb.Item>{scenic.name}</Breadcrumb.Item>
          </Breadcrumb>
          <div className="header-actions">
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              返回列表
            </Button>
            <Tooltip title={favorite ? '取消收藏' : '收藏'}>
              <Button
                type={favorite ? 'primary' : 'default'}
                icon={favorite ? <HeartFilled /> : <HeartOutlined />}
                onClick={() => setFavorite(!favorite)}
              />
            </Tooltip>
            <Button icon={<ShareAltOutlined />} onClick={handleShare}>
              分享
            </Button>
          </div>
        </div>
      </div>

      <div className="scenic-detail-content">
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card className="main-card">
              {renderImageGallery()}

              <div className="scenic-info-section">
                <Title level={2}>{scenic.name}</Title>
                <Space className="scenic-meta">
                  <Text type="secondary">
                    <EnvironmentOutlined /> {scenic.province || ''} · {scenic.city}
                  </Text>
                  <Divider type="vertical" />
                  <Text>
                    <StarOutlined style={{ color: '#faad14' }} /> 
                    {scenic.rating?.toFixed(1) || '暂无评分'}
                  </Text>
                </Space>

                <Paragraph className="scenic-description">
                  {scenic.description}
                </Paragraph>

                {renderPriceInfo()}
              </div>

              <Divider />

              <Descriptions title="基本信息" column={{ xs: 1, sm: 2 }} bordered>
                <Descriptions.Item label="开放时间">
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {scenic.open_time} - {scenic.close_time}
                </Descriptions.Item>
                <Descriptions.Item label="建议游玩时长">
                  约 {scenic.avg_visit_duration} 分钟
                </Descriptions.Item>
                <Descriptions.Item label="地址">
                  {scenic.address}
                </Descriptions.Item>
                <Descriptions.Item label="最佳游览时间">
                  {scenic.best_time_to_visit || '全年适宜'}
                </Descriptions.Item>
                {scenic.phone && (
                  <Descriptions.Item label="联系电话">
                    <a href={`tel:${scenic.phone}`}>
                      <PhoneOutlined style={{ marginRight: 4 }} />
                      {scenic.phone}
                    </a>
                  </Descriptions.Item>
                )}
                {scenic.website && (
                  <Descriptions.Item label="官方网站">
                    <a href={scenic.website} target="_blank" rel="noopener noreferrer">
                      <GlobalOutlined style={{ marginRight: 4 }} />
                      访问官网
                    </a>
                  </Descriptions.Item>
                )}
                {scenic.closed_days && (
                  <Descriptions.Item label="闭馆日">
                    <WarningOutlined style={{ marginRight: 4, color: '#ff4d4f' }} />
                    {scenic.closed_days}
                  </Descriptions.Item>
                )}
              </Descriptions>

              {scenic.tags && scenic.tags.length > 0 && (
                <div className="scenic-tags-section">
                  <Title level={4}>标签</Title>
                  <Space wrap>
                    {scenic.tags.map((tag, index) => (
                      <Tag key={index} color="blue">{tag}</Tag>
                    ))}
                  </Space>
                </div>
              )}

              {scenic.suitable_for && scenic.suitable_for.length > 0 && (
                <div className="scenic-suitable-section">
                  <Title level={4}>适合人群</Title>
                  <Space wrap>
                    {scenic.suitable_for.map((item, index) => (
                      <Tag key={index} color="green">{item}</Tag>
                    ))}
                  </Space>
                </div>
              )}

              {scenic.tips && (
                <div className="scenic-tips-section">
                  <Title level={4}>
                    <InfoCircleOutlined style={{ marginRight: 8 }} />
                    游玩贴士
                  </Title>
                  <Paragraph>{scenic.tips}</Paragraph>
                </div>
              )}

              {scenic.warnings && (
                <div className="scenic-warnings-section">
                  <Title level={4} type="danger">
                    <WarningOutlined style={{ marginRight: 8 }} />
                    注意事项
                  </Title>
                  <Paragraph type="danger">{scenic.warnings}</Paragraph>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="景区位置" className="map-card">
              <div 
                ref={mapRef} 
                className="map-container"
                onClick={() => setMapModalVisible(true)}
              />
              <div className="map-actions">
                <Button 
                  type="primary" 
                  block
                  icon={<CompassOutlined />}
                  onClick={() => setMapModalVisible(true)}
                >
                  查看大图
                </Button>
              </div>
            </Card>

            {renderPlatformLinks()}

            {scenic.booking_url && (
              <Card className="booking-card">
                <Button
                  type="primary"
                  block
                  size="large"
                  href={scenic.booking_url}
                  target="_blank"
                >
                  立即预约购票
                </Button>
              </Card>
            )}
          </Col>
        </Row>
      </div>

      <Modal
        title={scenic?.name}
        open={mapModalVisible}
        onCancel={() => setMapModalVisible(false)}
        footer={null}
        width={800}
        className="map-modal"
      >
        <div className="map-modal-content" ref={mapModalRef} />
      </Modal>
    </div>
  );
};

export default ScenicDetail;
