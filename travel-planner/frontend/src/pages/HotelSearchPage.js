import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Input, 
  Select, 
  DatePicker, 
  Button, 
  Space, 
  Typography, 
  Empty, 
  message,
  Slider,
  Segmented,
  Affix,
  Skeleton
} from 'antd';
import { 
  SearchOutlined, 
  EnvironmentOutlined,
  HomeOutlined
} from '@ant-design/icons';
import HotelCard from '../components/HotelCard';
import axios from 'axios';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const BATCH_SIZE = 20;

const HotelSearchPage = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [displayCount, setDisplayCount] = useState(BATCH_SIZE);
  const [searchParams, setSearchParams] = useState({
    city: '杭州',
    latitude: 30.2741,
    longitude: 120.1551,
    checkIn: null,
    checkOut: null,
    priceMin: 0,
    priceMax: 2000,
    keyword: '',
    useMock: false,
    radius: 5000
  });
  const [viewMode, setViewMode] = useState('grid');

  const displayedHotels = useMemo(() => {
    return hotels.slice(0, displayCount);
  }, [hotels, displayCount]);

  const hasMore = displayCount < hotels.length;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setDisplayCount(prev => Math.min(prev + BATCH_SIZE, hotels.length));
    }
  }, [hasMore, hotels.length]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 500
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  useEffect(() => {
    setDisplayCount(BATCH_SIZE);
  }, [hotels]);

  useEffect(() => {
    fetchSupportedCities();
    searchHotels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSupportedCities = async () => {
    try {
      const response = await axios.get('/api/hotels/supported-cities');
      if (response.data.success) {
        setCities(response.data.cities);
      }
    } catch (error) {
      console.error('获取城市列表失败:', error);
    }
  };

  const searchHotels = async () => {
    setLoading(true);
    try {
      const params = {
        latitude: searchParams.latitude,
        longitude: searchParams.longitude,
        city: searchParams.city,
        use_mock: searchParams.useMock,
        radius: searchParams.radius,
        limit: 60
      };

      if (searchParams.checkIn) {
        params.check_in = searchParams.checkIn.format('YYYY-MM-DD');
      }
      if (searchParams.checkOut) {
        params.check_out = searchParams.checkOut.format('YYYY-MM-DD');
      }
      if (searchParams.keyword) {
        params.keyword = searchParams.keyword;
      }

      const response = await axios.get('/api/hotels/search', { params });
      
      if (response.data.success) {
        let hotelList = response.data.hotels;
        
        if (searchParams.priceMin > 0) {
          hotelList = hotelList.filter(h => !h.price_min || h.price_min >= searchParams.priceMin);
        }
        if (searchParams.priceMax < 2000) {
          hotelList = hotelList.filter(h => !h.price_min || h.price_min <= searchParams.priceMax);
        }
        
        setHotels(hotelList);
        
        if (response.data.data_source === 'mock') {
          message.info('使用模拟数据展示，配置高德地图API Key后可获取真实数据');
        }
      }
    } catch (error) {
      console.error('搜索酒店失败:', error);
      message.error('搜索酒店失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = (cityName) => {
    const city = cities.find(c => c.name === cityName);
    if (city) {
      setSearchParams({
        ...searchParams,
        city: cityName,
        latitude: city.center_latitude,
        longitude: city.center_longitude
      });
    }
  };

  const handleDateChange = (dates) => {
    if (dates) {
      setSearchParams({
        ...searchParams,
        checkIn: dates[0],
        checkOut: dates[1]
      });
    } else {
      setSearchParams({
        ...searchParams,
        checkIn: null,
        checkOut: null
      });
    }
  };

  const handlePriceChange = (value) => {
    setSearchParams({
      ...searchParams,
      priceMin: value[0],
      priceMax: value[1]
    });
  };

  const handleSearch = () => {
    searchHotels();
  };

  const handleFavorite = (hotel, isFavorite) => {
    console.log('收藏酒店:', hotel.name, isFavorite);
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <Affix offsetTop={0} style={{ marginBottom: 24 }}>
        <Card 
          style={{ 
            borderRadius: 16, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            background: 'linear-gradient(135deg, #1A936F 0%, #114B5F 100%)'
          }}
          styles={{ body: { padding: '16px 24px' } }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={6}>
              <Select
                value={searchParams.city}
                onChange={handleCityChange}
                style={{ width: '100%' }}
                placeholder="选择城市"
                size="large"
              >
                {cities.map(city => (
                  <Select.Option key={city.name} value={city.name}>
                    <EnvironmentOutlined style={{ marginRight: 8 }} />
                    {city.name}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={8}>
              <RangePicker 
                style={{ width: '100%' }}
                size="large"
                onChange={handleDateChange}
                placeholder={['入住日期', '离店日期']}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Input
                placeholder="搜索酒店名称"
                prefix={<SearchOutlined />}
                size="large"
                value={searchParams.keyword}
                onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
                onPressEnter={handleSearch}
              />
            </Col>
            <Col xs={24} sm={4}>
              <Button 
                type="primary" 
                size="large"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={loading}
                style={{ 
                  width: '100%',
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
              >
                搜索
              </Button>
            </Col>
          </Row>
        </Card>
      </Affix>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Card size="small" style={{ borderRadius: 12 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>价格区间 (元/晚)</Text>
              <Slider
                range
                min={0}
                max={2000}
                value={[searchParams.priceMin, searchParams.priceMax]}
                onChange={handlePriceChange}
                marks={{
                  0: '¥0',
                  500: '¥500',
                  1000: '¥1000',
                  1500: '¥1500',
                  2000: '¥2000+'
                }}
              />
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card size="small" style={{ borderRadius: 12 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>显示方式</Text>
              <Segmented
                options={[
                  { label: '网格视图', value: 'grid' },
                  { label: '列表视图', value: 'list' }
                ]}
                value={viewMode}
                onChange={setViewMode}
                style={{ width: '100%' }}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 16 
      }}>
        <Title level={4} style={{ margin: 0 }}>
          <HomeOutlined style={{ marginRight: 8, color: '#1A936F' }} />
          {searchParams.city}酒店推荐
          <Text type="secondary" style={{ fontSize: 14, marginLeft: 8 }}>
            共 {hotels.length} 家酒店
          </Text>
        </Title>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Row gutter={[16, 16]}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Col xs={24} sm={12} lg={8} xl={6} key={i}>
                <Card style={{ borderRadius: 16 }}>
                  <Skeleton.Image active style={{ width: '100%', height: 180 }} />
                  <Skeleton active paragraph={{ rows: 3 }} style={{ marginTop: 16 }} />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ) : hotels.length === 0 ? (
        <Empty 
          description="暂无酒店数据"
          style={{ padding: '60px 0' }}
        />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {displayedHotels.map((hotel, index) => (
              <Col 
                xs={24} 
                sm={viewMode === 'grid' ? 12 : 24} 
                lg={viewMode === 'grid' ? 8 : 24} 
                xl={viewMode === 'grid' ? 6 : 24}
                key={hotel.id || index}
              >
                <HotelCard 
                  hotel={hotel}
                  onFavorite={handleFavorite}
                  checkIn={searchParams.checkIn}
                  checkOut={searchParams.checkOut}
                />
              </Col>
            ))}
          </Row>
          {hasMore && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Button 
                type="default" 
                size="large"
                onClick={loadMore}
                style={{ borderRadius: 8 }}
              >
                加载更多 ({hotels.length - displayCount} 家酒店)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HotelSearchPage;
