import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Tag,
  Rate,
  Pagination,
  Spin,
  Empty,
  Button,
  Space,
  Badge,
  Typography,
  Image,
  Tooltip,
  Carousel
} from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  StarOutlined,
  FilterOutlined,
  ReloadOutlined,
  CompassOutlined,
  FireOutlined,
  RightOutlined,
  LeftOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './ScenicList.css';

const { Search } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

const cityQuickFilters = [
  { city: '杭州', keywords: '西湖', description: '人间天堂' },
  { city: '苏州', keywords: '园林', description: '园林水乡' },
  { city: '上海', keywords: '外滩', description: '国际大都市' },
  { city: '南京', keywords: '中山陵', description: '六朝古都' },
  { city: '宁波', keywords: '溪口', description: '海港城市' },
  { city: '舟山', keywords: '普陀山', description: '海岛佛国' },
  { city: '无锡', keywords: '太湖', description: '太湖明珠' },
  { city: '嘉兴', keywords: '乌镇', description: '水乡古镇' }
];

const popularSpots = [
  { id: 1, name: '西湖', city: '杭州', rating: 4.8, image: '/images/cities/hangzhou.jpg', tags: ['5A景区', '世界遗产'] },
  { id: 2, name: '拙政园', city: '苏州', rating: 4.7, image: '/images/cities/suzhou.jpg', tags: ['世界遗产', '古典园林'] },
  { id: 3, name: '外滩', city: '上海', rating: 4.6, image: '/images/cities/shanghai.jpg', tags: ['城市地标', '夜景'] },
  { id: 4, name: '乌镇', city: '嘉兴', rating: 4.5, image: '/images/cities/jiaxing.jpg', tags: ['水乡古镇', '江南风情'] },
  { id: 5, name: '上海迪士尼', city: '上海', rating: 4.7, image: '/images/cities/shanghai.jpg', tags: ['主题乐园', '家庭出游'] },
  { id: 6, name: '普陀山', city: '舟山', rating: 4.8, image: '/images/cities/zhoushan.jpg', tags: ['佛教圣地', '海岛风光'] }
];

const ScenicList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [scenicList, setScenicList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const [provinces, setProvinces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredSpots, setFeaturedSpots] = useState([]);

  const [filters, setFilters] = useState({
    province: undefined,
    city: undefined,
    category: undefined,
    keyword: '',
    minPrice: undefined,
    maxPrice: undefined,
    minRating: undefined,
    sortBy: 'rating',
    sortOrder: 'desc'
  });

  const [citiesInProvince, setCitiesInProvince] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);

  useEffect(() => {
    fetchProvinces();
    fetchCategories();
  }, []);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const cityParam = searchParams.get('city');
    if (categoryParam) {
      setFilters(prev => ({ ...prev, category: categoryParam }));
    }
    if (cityParam) {
      setSelectedCity(cityParam);
      setFilters(prev => ({ ...prev, city: cityParam }));
    }
  }, [searchParams]);

  useEffect(() => {
    fetchScenicList();
  }, [page, pageSize, filters]);

  const handleCityQuickFilter = (city) => {
    if (selectedCity === city) {
      setSelectedCity(null);
      setFilters(prev => ({ ...prev, city: undefined }));
    } else {
      setSelectedCity(city);
      setFilters(prev => ({ ...prev, city: city }));
    }
    setPage(1);
  };

  const fetchFeaturedSpots = async () => {
    try {
      const response = await axios.get('/api/scenic-spots/', {
        params: { page: 1, page_size: 6, sort_by: 'rating', sort_order: 'desc' }
      });
      if (response.data.success) {
        setFeaturedSpots(response.data.data.slice(0, 6));
      }
    } catch (error) {
      console.error('获取热门景点失败:', error);
    }
  };

  const fetchProvinces = async () => {
    try {
      const response = await axios.get('/api/scenic-spots/provinces');
      if (response.data.success) {
        setProvinces(response.data.provinces);
      }
    } catch (error) {
      console.error('获取省份列表失败:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/scenic-spots/categories');
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('获取分类列表失败:', error);
    }
  };

  const fetchScenicList = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      };

      if (filters.province) params.province = filters.province;
      if (filters.city) params.city = filters.city;
      if (filters.category) params.category = filters.category;
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.minPrice) params.min_price = filters.minPrice;
      if (filters.maxPrice) params.max_price = filters.maxPrice;
      if (filters.minRating) params.min_rating = filters.minRating;

      const response = await axios.get('/api/scenic-spots/', { params });
      
      if (response.data.success) {
        setScenicList(response.data.data);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error('获取景区列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  const handleProvinceChange = (value) => {
    const province = provinces.find(p => p.name === value);
    setCitiesInProvince(province ? province.cities : []);
    setFilters(prev => ({
      ...prev,
      province: value,
      city: undefined
    }));
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPage(1);
  };

  const handleSearch = (value) => {
    setFilters(prev => ({
      ...prev,
      keyword: value
    }));
    setPage(1);
  };

  const handleReset = () => {
    setFilters({
      province: undefined,
      city: undefined,
      category: undefined,
      keyword: '',
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      sortBy: 'rating',
      sortOrder: 'desc'
    });
    setCitiesInProvince([]);
    setSelectedCity(null);
    setPage(1);
  };

  const handleCardClick = (id) => {
    navigate(`/scenic/${id}`);
  };

  const handlePopularSpotClick = (id) => {
    navigate(`/scenic/${id}`);
  };

  const renderPriceTag = (price) => {
    if (price === 0) {
      return <Tag color="green">免费</Tag>;
    }
    return <Tag color="blue">¥{price}起</Tag>;
  };

  const renderPopularSpotCard = (spot) => (
    <Card
      className="popular-spot-card"
      cover={
        <div className="popular-spot-cover">
          <Image
            src={spot.image_url || `https://via.placeholder.com/300x180?text=${spot.name}`}
            alt={spot.name}
            preview={false}
            fallback="https://via.placeholder.com/300x180?text=暂无图片"
          />
          <div className="popular-spot-overlay">
            <div className="popular-spot-rating">
              <StarOutlined /> {spot.rating?.toFixed(1) || '4.5'}
            </div>
          </div>
          {spot.is_featured && (
            <div className="popular-spot-badge">
              <CrownOutlined /> 精选
            </div>
          )}
        </div>
      }
      onClick={() => handlePopularSpotClick(spot.id)}
      hoverable
    >
      <div className="popular-spot-content">
        <Title level={5} ellipsis={{ rows: 1 }} className="popular-spot-title">
          {spot.name}
        </Title>
        <Space size={4}>
          <EnvironmentOutlined style={{ color: '#8a8a8a', fontSize: 12 }} />
          <Text type="secondary" style={{ fontSize: 12 }}>{spot.city}</Text>
        </Space>
        <div className="popular-spot-tags">
          {spot.tags?.slice(0, 2).map((tag, index) => (
            <Tag key={index} className="popular-spot-tag">{tag}</Tag>
          ))}
        </div>
      </div>
    </Card>
  );

  const renderScenicCard = (scenic) => (
    <Col xs={24} sm={12} md={8} lg={6} key={scenic.id}>
      <Card
        hoverable
        className="scenic-card"
        cover={
          <div className="scenic-card-cover">
            <Image
              src={scenic.image_url || 'https://via.placeholder.com/400x250?text=暂无图片'}
              alt={scenic.name}
              preview={false}
              fallback="https://via.placeholder.com/400x250?text=暂无图片"
            />
            <div className="scenic-card-overlay">
              {renderPriceTag(scenic.ticket_price)}
            </div>
            {scenic.booking_required && (
              <Badge.Ribbon text="需预约" color="orange" />
            )}
          </div>
        }
        onClick={() => handleCardClick(scenic.id)}
      >
        <div className="scenic-card-content">
          <Title level={5} ellipsis={{ rows: 1 }} className="scenic-title">
            {scenic.name}
          </Title>
          <div className="scenic-meta">
            <Space size={4}>
              <EnvironmentOutlined />
              <Text type="secondary">{scenic.city}</Text>
            </Space>
            <Space size={4}>
              <StarOutlined style={{ color: '#faad14' }} />
              <Text>{scenic.rating?.toFixed(1) || '暂无评分'}</Text>
            </Space>
          </div>
          <div className="scenic-info">
            <Space size={8}>
              <Text type="secondary" ellipsis>
                <ClockCircleOutlined /> {scenic.open_time}-{scenic.close_time}
              </Text>
            </Space>
          </div>
          <div className="scenic-tags">
            {scenic.tags?.slice(0, 3).map((tag, index) => (
              <Tag key={index} className="scenic-tag">
                {tag}
              </Tag>
            ))}
          </div>
        </div>
      </Card>
    </Col>
  );

  return (
    <div className="scenic-list-page">
      <div className="scenic-header">
        <div className="scenic-header-content">
          <Title level={2}>
            <CompassOutlined style={{ marginRight: 8 }} />
            江浙沪景区
          </Title>
          <Text type="secondary">
            探索江苏、浙江、上海三地的精彩景区，开启您的美好旅程
          </Text>
        </div>
      </div>

      <div className="city-quick-filter">
        <div className="city-filter-header">
          <FireOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
          <Text strong>热门目的地</Text>
        </div>
        <div className="city-filter-items">
          {cityQuickFilters.map(city => (
            <div
              key={city.city}
              className={`city-filter-item ${selectedCity === city.city ? 'active' : ''}`}
              onClick={() => handleCityQuickFilter(city.city)}
            >
              <span className="city-filter-name">{city.city}</span>
              <span className="city-filter-desc">{city.description}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="popular-spots-section">
        <div className="section-header">
          <div className="section-title">
            <CrownOutlined style={{ color: '#faad14', marginRight: 8 }} />
            <Text strong>精选热门景点</Text>
          </div>
          <Button type="link" onClick={() => { setFilters(prev => ({ ...prev, sortBy: 'rating', sortOrder: 'desc' })); }}>
            查看更多 <RightOutlined />
          </Button>
        </div>
        <Row gutter={[16, 16]} className="popular-spots-carousel">
          {featuredSpots.length > 0 ? (
            featuredSpots.map(renderPopularSpotCard)
          ) : (
            popularSpots.map(renderPopularSpotCard)
          )}
        </Row>
      </div>

      <div className="scenic-filters">
        <Card className="filter-card">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Search
                placeholder="搜索景区名称、地址..."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={handleSearch}
                defaultValue={filters.keyword}
              />
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Select
                placeholder="选择省份"
                allowClear
                style={{ width: '100%' }}
                value={filters.province}
                onChange={handleProvinceChange}
              >
                {provinces.map(p => (
                  <Option key={p.name} value={p.name}>{p.name}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Select
                placeholder="选择城市"
                allowClear
                style={{ width: '100%' }}
                value={filters.city}
                onChange={(value) => handleFilterChange('city', value)}
                disabled={!citiesInProvince.length}
              >
                {citiesInProvince.map(city => (
                  <Option key={city} value={city}>{city}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Select
                placeholder="景区类型"
                allowClear
                style={{ width: '100%' }}
                value={filters.category}
                onChange={(value) => handleFilterChange('category', value)}
              >
                {categories.map(c => (
                  <Option key={c.name} value={c.name}>{c.name}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Select
                placeholder="最低评分"
                allowClear
                style={{ width: '100%' }}
                value={filters.minRating}
                onChange={(value) => handleFilterChange('minRating', value)}
              >
                <Option value={4.5}>4.5分以上</Option>
                <Option value={4.0}>4.0分以上</Option>
                <Option value={3.5}>3.5分以上</Option>
              </Select>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Select
                placeholder="排序方式"
                style={{ width: '100%' }}
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(value) => {
                  const [sortBy, sortOrder] = value.split('-');
                  setFilters(prev => ({ ...prev, sortBy, sortOrder }));
                }}
              >
                <Option value="rating-desc">评分从高到低</Option>
                <Option value="rating-asc">评分从低到高</Option>
                <Option value="popularity-desc">热度从高到低</Option>
                <Option value="ticket_price-asc">价格从低到高</Option>
                <Option value="ticket_price-desc">价格从高到低</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={3}>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleReset}
                block
              >
                重置筛选
              </Button>
            </Col>
          </Row>
        </Card>
      </div>

      <div className="scenic-content">
        <Spin spinning={loading}>
          {scenicList.length > 0 ? (
            <>
              <Row gutter={[16, 16]}>
                {scenicList.map(renderScenicCard)}
              </Row>
              <div className="scenic-pagination">
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total) => `共 ${total} 个景区`}
                  onChange={(page, pageSize) => {
                    setPage(page);
                    setPageSize(pageSize);
                  }}
                  pageSizeOptions={['12', '24', '36', '48']}
                />
              </div>
            </>
          ) : (
            <Empty
              description="暂无符合条件的景区"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" onClick={handleReset}>
                重置筛选条件
              </Button>
            </Empty>
          )}
        </Spin>
      </div>
    </div>
  );
};

export default ScenicList;
