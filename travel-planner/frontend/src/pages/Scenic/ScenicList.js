import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Input, Select, Tag, Pagination, Spin, Empty,
  Button, Space, Typography, Skeleton, Tooltip, Badge
} from 'antd';
import {
  SearchOutlined, EnvironmentOutlined, ClockCircleOutlined,
  StarOutlined, ReloadOutlined, CompassOutlined, FireOutlined,
  RightOutlined, CrownOutlined, DollarOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Logo from '../../components/Logo';
import './ScenicList.css';

const { Search } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

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
  const [featuredLoading, setFeaturedLoading] = useState(true);

  const [filters, setFilters] = useState({
    province: undefined,
    city: undefined,
    category: undefined,
    keyword: '',
    minRating: undefined,
    sortBy: 'rating',
    sortOrder: 'desc'
  });

  const [citiesInProvince, setCitiesInProvince] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);

  // 从省份数据动态生成热门城市
  const hotCities = [
    { city: '杭州', desc: '人间天堂' },
    { city: '苏州', desc: '园林水乡' },
    { city: '上海', desc: '国际都市' },
    { city: '南京', desc: '六朝古都' },
    { city: '宁波', desc: '海港城市' },
    { city: '舟山', desc: '海岛佛国' },
    { city: '无锡', desc: '太湖明珠' },
    { city: '嘉兴', desc: '水乡古镇' },
    { city: '扬州', desc: '烟花三月' },
    { city: '温州', desc: '山水诗源' },
    { city: '常州', desc: '龙城胜景' },
    { city: '镇江', desc: '三山胜境' },
  ];

  useEffect(() => {
    fetchProvinces();
    fetchCategories();
    fetchFeaturedSpots();
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

  const fetchFeaturedSpots = async () => {
    setFeaturedLoading(true);
    try {
      const response = await axios.get('/api/scenic-spots/', {
        params: { page: 1, page_size: 6, sort_by: 'popularity', sort_order: 'desc' }
      });
      if (response.data.success) {
        setFeaturedSpots(response.data.data.slice(0, 6));
      }
    } catch (error) {
      console.error('获取热门景点失败:', error);
    } finally {
      setFeaturedLoading(false);
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

  const handleCityQuickFilter = (city) => {
    if (selectedCity === city) {
      setSelectedCity(null);
      setFilters(prev => ({ ...prev, city: undefined }));
    } else {
      setSelectedCity(city);
      setFilters(prev => ({ ...prev, city }));
    }
    setPage(1);
  };

  const handleProvinceChange = (value) => {
    const province = provinces.find(p => p.name === value);
    setCitiesInProvince(province ? province.cities : []);
    setFilters(prev => ({ ...prev, province: value, city: undefined }));
    setSelectedCity(null);
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, keyword: value }));
    setPage(1);
  };

  const handleReset = () => {
    setFilters({
      province: undefined, city: undefined, category: undefined,
      keyword: '', minRating: undefined, sortBy: 'rating', sortOrder: 'desc'
    });
    setCitiesInProvince([]);
    setSelectedCity(null);
    setPage(1);
  };

  const handleCardClick = (id) => navigate(`/scenic/${id}`);

  const renderPriceTag = (price) => {
    if (price === 0) return <span className="price-badge free">免费</span>;
    return <span className="price-badge paid">¥{price}</span>;
  };

  const renderFeaturedCard = (spot) => (
    <Col xs={12} sm={8} md={8} lg={4} key={spot.id}>
      <div className="featured-card" onClick={() => handleCardClick(spot.id)}>
        <div className="featured-img-wrap">
          <img
            src={spot.image_url}
            alt={spot.name}
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://placehold.co/400x250/1a936f/ffffff?text=${encodeURIComponent(spot.name)}`;
            }}
          />
          <div className="featured-overlay">
            <div className="featured-rating">
              <StarOutlined /> {spot.rating?.toFixed(1) || '4.5'}
            </div>
          </div>
        </div>
        <div className="featured-info">
          <div className="featured-name">{spot.name}</div>
          <div className="featured-city">
            <EnvironmentOutlined /> {spot.city}
          </div>
        </div>
      </div>
    </Col>
  );

  const renderFeaturedSkeleton = () => (
    Array.from({ length: 6 }).map((_, i) => (
      <Col xs={12} sm={8} md={8} lg={4} key={i}>
        <div className="featured-card">
          <Skeleton.Image active style={{ width: '100%', height: 140 }} />
          <div className="featured-info">
            <Skeleton.Input active size="small" style={{ width: 100 }} />
          </div>
        </div>
      </Col>
    ))
  );

  const renderScenicCard = (scenic) => (
    <Col xs={24} sm={12} md={8} lg={6} key={scenic.id}>
      <div className="scenic-card" onClick={() => handleCardClick(scenic.id)}>
        <div className="scenic-card-cover">
          <img
            src={scenic.image_url}
            alt={scenic.name}
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://placehold.co/400x250/114b5f/ffffff?text=${encodeURIComponent(scenic.name)}`;
            }}
          />
          <div className="scenic-card-top">
            {renderPriceTag(scenic.ticket_price)}
          </div>
          {scenic.booking_required && (
            <div className="scenic-card-badge">需预约</div>
          )}
          <div className="scenic-card-gradient" />
        </div>
        <div className="scenic-card-body">
          <h3 className="scenic-card-title">{scenic.name}</h3>
          <div className="scenic-card-meta">
            <span className="scenic-card-location">
              <EnvironmentOutlined /> {scenic.city}
            </span>
            <span className="scenic-card-rating">
              <StarOutlined /> {scenic.rating?.toFixed(1) || '-'}
            </span>
          </div>
          <div className="scenic-card-detail">
            <ClockCircleOutlined />
            <span>{scenic.open_time} - {scenic.close_time}</span>
          </div>
          <div className="scenic-card-tags">
            {scenic.tags?.slice(0, 3).map((tag, index) => (
              <span key={index} className="scenic-tag">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </Col>
  );

  const renderCardSkeleton = () => (
    Array.from({ length: 8 }).map((_, i) => (
      <Col xs={24} sm={12} md={8} lg={6} key={i}>
        <Card className="scenic-card" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <Skeleton.Image active style={{ width: '100%', height: 180 }} />
          <div style={{ padding: 16 }}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </div>
        </Card>
      </Col>
    ))
  );

  return (
    <div className="scenic-list-page">
      {/* Header */}
      <div className="scenic-header">
        <div className="scenic-header-content">
          <Title level={2}>
            <span className="scenic-title-logo"><Logo size="large" showText={false} /></span>
            江浙沪景区
          </Title>
          <Text>
            探索江苏、浙江、上海三地 {total > 0 ? total : 50}+ 精彩景区，开启您的美好旅程
          </Text>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="scenic-filters">
        <Card className="filter-card">
          <Row gutter={[12, 12]} align="middle">
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
                placeholder="省份"
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
                placeholder="城市"
                allowClear
                style={{ width: '100%' }}
                value={filters.city}
                onChange={(v) => { handleFilterChange('city', v); setSelectedCity(v || null); }}
                disabled={!citiesInProvince.length && !filters.province}
              >
                {citiesInProvince.map(c => (
                  <Option key={c} value={c}>{c}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Select
                placeholder="景区类型"
                allowClear
                style={{ width: '100%' }}
                value={filters.category}
                onChange={(v) => handleFilterChange('category', v)}
              >
                {categories.map(c => (
                  <Option key={c.name} value={c.name}>{c.name}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Select
                placeholder="评分"
                allowClear
                style={{ width: '100%' }}
                value={filters.minRating}
                onChange={(v) => handleFilterChange('minRating', v)}
              >
                <Option value={4.5}>4.5+</Option>
                <Option value={4.0}>4.0+</Option>
                <Option value={3.5}>3.5+</Option>
              </Select>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Select
                placeholder="排序"
                style={{ width: '100%' }}
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(v) => {
                  const [sortBy, sortOrder] = v.split('-');
                  setFilters(prev => ({ ...prev, sortBy, sortOrder }));
                }}
              >
                <Option value="rating-desc">评分最高</Option>
                <Option value="popularity-desc">最热门</Option>
                <Option value="ticket_price-asc">价格最低</Option>
                <Option value="ticket_price-desc">价格最高</Option>
              </Select>
            </Col>
            <Col xs={24} sm={6} md={3}>
              <Button icon={<ReloadOutlined />} onClick={handleReset} block>
                重置
              </Button>
            </Col>
          </Row>
        </Card>
      </div>

      {/* 热门城市快筛 */}
      <div className="city-quick-filter">
        <div className="city-filter-header">
          <FireOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
          <Text strong>热门目的地</Text>
        </div>
        <div className="city-filter-items">
          {hotCities.map(({ city, desc }) => (
            <div
              key={city}
              className={`city-filter-item ${selectedCity === city ? 'active' : ''}`}
              onClick={() => handleCityQuickFilter(city)}
            >
              <span className="city-filter-name">{city}</span>
              <span className="city-filter-desc">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 精选推荐 */}
      <div className="featured-section">
        <div className="section-header">
          <div className="section-title">
            <CrownOutlined style={{ color: '#faad14', marginRight: 8 }} />
            <Text strong>精选热门</Text>
          </div>
        </div>
        <Row gutter={[12, 12]}>
          {featuredLoading
            ? renderFeaturedSkeleton()
            : featuredSpots.map(renderFeaturedCard)
          }
        </Row>
      </div>

      {/* 景区列表 */}
      <div className="scenic-content">
        <div className="content-header">
          <Text strong style={{ fontSize: 16 }}>
            全部景区
            {total > 0 && <span className="total-count">（{total}）</span>}
          </Text>
        </div>

        {loading ? (
          <Row gutter={[16, 16]}>{renderCardSkeleton()}</Row>
        ) : scenicList.length > 0 ? (
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
                showTotal={(t) => `共 ${t} 个景区`}
                onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
                pageSizeOptions={['12', '24', '36']}
              />
            </div>
          </>
        ) : (
          <Empty description="暂无符合条件的景区" image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button type="primary" onClick={handleReset}>重置筛选</Button>
          </Empty>
        )}
      </div>
    </div>
  );
};

export default ScenicList;
