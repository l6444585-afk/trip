import React, { useState, useEffect } from 'react';
import { Card, Spin, Alert, Row, Col, Typography, Tag, Space, Tooltip } from 'antd';
import { 
  CloudOutlined, 
  SunOutlined, 
  CloudFilled, 
  ThunderboltOutlined, 
  EnvironmentOutlined,
  ClockCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Text, Title } = Typography;

const getWeatherIcon = (weather: string, size: number = 32) => {
  const icons: Record<string, React.ReactNode> = {
    '晴': <SunOutlined style={{ fontSize: size, color: '#faad14' }} />,
    '多云': <CloudOutlined style={{ fontSize: size, color: '#1890ff' }} />,
    '阴': <CloudFilled style={{ fontSize: size, color: '#8c8c8c' }} />,
    '雨': <CloudFilled style={{ fontSize: size, color: '#52c41a' }} />,
    '雪': <CloudFilled style={{ fontSize: size, color: '#91d5ff' }} />,
    '雷': <ThunderboltOutlined style={{ fontSize: size, color: '#fa8c16' }} />,
  };
  return icons[weather] || <CloudOutlined style={{ fontSize: size, color: '#1890ff' }} />;
};

const getWeatherColor = (weather: string) => {
  const colors: Record<string, string> = {
    '晴': 'gold',
    '多云': 'blue',
    '阴': 'default',
    '雨': 'green',
    '雪': 'cyan',
    '雷': 'orange',
  };
  return colors[weather] || 'default';
};

interface WeatherCardProps {
  city: string;
  showForecast?: boolean;
  compact?: boolean;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ 
  city, 
  showForecast = true,
  compact = false 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchWeather();
  }, [city]);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [currentRes, forecastRes, alertsRes] = await Promise.all([
        axios.get(`/api/weather/current/${encodeURIComponent(city)}`),
        showForecast ? axios.get(`/api/weather/forecast/${encodeURIComponent(city)}?days=3`) : Promise.resolve({ data: null }),
        axios.get(`/api/weather/alerts/${encodeURIComponent(city)}`)
      ]);

      setWeather(currentRes.data);
      if (forecastRes.data) {
        setForecast(forecastRes.data.forecast || []);
      }
      setAlerts(alertsRes.data?.alerts || []);
    } catch (err: any) {
      console.error('获取天气数据失败:', err);
      setError(err.response?.data?.detail || '获取天气数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card style={{ borderRadius: 12 }}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin tip="加载天气数据..." />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={{ borderRadius: 12 }}>
        <Alert 
          message="天气数据获取失败" 
          description={error} 
          type="warning" 
          showIcon 
        />
      </Card>
    );
  }

  if (!weather) {
    return null;
  }

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {getWeatherIcon(weather.weather, 24)}
        <Text>{weather.temperature}°C</Text>
        <Tag color={getWeatherColor(weather.weather)}>{weather.weather}</Tag>
      </div>
    );
  }

  return (
    <Card 
      style={{ borderRadius: 12, marginBottom: 16 }}
      title={
        <Space>
          <EnvironmentOutlined />
          <span>{weather.city} 天气</span>
          {alerts.length > 0 && (
            <Tooltip title={alerts.map(a => a.title).join(', ')}>
              <WarningOutlined style={{ color: '#faad14' }} />
            </Tooltip>
          )}
        </Space>
      }
      extra={
        <Text type="secondary" style={{ fontSize: 12 }}>
          <ClockCircleOutlined /> {weather.update_time}
        </Text>
      }
    >
      {alerts.length > 0 && (
        <Alert
          message={alerts[0].title}
          description={alerts[0].description}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 8 }}>
              {getWeatherIcon(weather.weather, 48)}
            </div>
            <Title level={2} style={{ margin: 0 }}>
              {weather.temperature}°C
            </Title>
            <Tag color={getWeatherColor(weather.weather)} style={{ marginTop: 8 }}>
              {weather.weather}
            </Tag>
          </div>
        </Col>
        
        <Col xs={24} sm={16}>
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Text type="secondary">体感温度</Text>
              <br />
              <Text strong>{weather.feels_like}°C</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">湿度</Text>
              <br />
              <Text strong>{weather.humidity}%</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">风速</Text>
              <br />
              <Text strong>{weather.wind_speed} m/s</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">风向</Text>
              <br />
              <Text strong>{weather.wind_direction}</Text>
            </Col>
          </Row>
        </Col>
      </Row>

      {showForecast && forecast.length > 0 && (
        <>
          <div style={{ margin: '16px 0', borderTop: '1px solid #f0f0f0' }} />
          <Row gutter={8}>
            {forecast.map((day, index) => (
              <Col span={8} key={index}>
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {day.date}
                  </Text>
                  <div style={{ margin: '4px 0' }}>
                    {getWeatherIcon(day.weather, 24)}
                  </div>
                  <Text strong>{day.temp_high}°</Text>
                  <Text type="secondary"> / {day.temp_low}°</Text>
                </div>
              </Col>
            ))}
          </Row>
        </>
      )}
    </Card>
  );
};

export default WeatherCard;
