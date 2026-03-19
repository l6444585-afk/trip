/**
 * 布局组件
 * 提供应用的整体布局结构，包括Header、Content和Footer
 * @module components/Layout
 */

import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Typography, Avatar, Dropdown, Input, Drawer, Tooltip, Button } from 'antd';
import {
  HomeOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  SearchOutlined,
  CalculatorOutlined,
  RobotOutlined,
  EnvironmentOutlined,
  HomeFilled,
  MenuOutlined,
  CloseOutlined,
  SettingFilled,
  DashboardOutlined,
  CompassOutlined,
  FireOutlined,
  ShopOutlined,
  BankOutlined,
  CarOutlined,
  GlobalOutlined,
  RadarChartOutlined,
  ExperimentOutlined,
  CloudOutlined,
  ApartmentOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';

const { Header, Content, Footer } = AntLayout;
const { Title, Text } = Typography;

const isMobile = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768;
  }
  return false;
};

/**
 * 布局组件
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 * @returns {JSX.Element} 布局组件
 */
const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollRef = React.useRef(null);

  const scenicCategories = [
    { key: '/scenic?category=自然风光', label: '自然风光', icon: <ExperimentOutlined /> },
    { key: '/scenic?category=历史文化', label: '历史文化', icon: <BankOutlined /> },
    { key: '/scenic?category=主题乐园', label: '主题乐园', icon: <RadarChartOutlined /> },
    { key: '/scenic?category=博物馆', label: '博物馆', icon: <GlobalOutlined /> },
    { key: '/scenic?category=古镇村落', label: '古镇村落', icon: <ShopOutlined /> },
    { key: '/scenic?category=海滨岛屿', label: '海滨岛屿', icon: <CarOutlined /> },
    { key: '/scenic?category=宗教场所', label: '宗教场所', icon: <FireOutlined /> },
    { key: '/scenic?category=城市景观', label: '城市景观', icon: <ApartmentOutlined /> }
  ];

  const cityQuickAccess = [
    { key: '/scenic?city=杭州', label: '杭州', subLabel: '西湖、千岛湖' },
    { key: '/scenic?city=苏州', label: '苏州', subLabel: '园林、水乡' },
    { key: '/scenic?city=上海', label: '上海', subLabel: '都市、迪士尼' },
    { key: '/scenic?city=南京', label: '南京', subLabel: '古城、陵墓' },
    { key: '/scenic?city=宁波', label: '宁波', subLabel: '海港、溪口' },
    { key: '/scenic?city=舟山', label: '舟山', subLabel: '普陀山、海岛' },
    { key: '/scenic?city=无锡', label: '无锡', subLabel: '太湖、灵山' },
    { key: '/scenic?city=嘉兴', label: '嘉兴', subLabel: '乌镇、西塘' }
  ];

  const popularScenicSpots = [
    { key: '/scenic/1', label: '西湖', subLabel: '杭州·5A景区', rating: 4.8 },
    { key: '/scenic/2', label: '拙政园', subLabel: '苏州·世界遗产', rating: 4.7 },
    { key: '/scenic/3', label: '外滩', subLabel: '上海·标志性景观', rating: 4.6 },
    { key: '/scenic/4', label: '乌镇', subLabel: '嘉兴·水乡古镇', rating: 4.5 },
    { key: '/scenic/5', label: '上海迪士尼乐园', subLabel: '上海·主题乐园', rating: 4.7 },
    { key: '/scenic/6', label: '东方明珠', subLabel: '上海·城市地标', rating: 4.5 },
    { key: '/scenic/7', label: '普陀山', subLabel: '舟山·佛教圣地', rating: 4.8 },
    { key: '/scenic/8', label: '中山陵', subLabel: '南京·革命景区', rating: 4.6 }
  ];

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY > 20;
          if (scrollRef.current !== scrolled) {
            scrollRef.current = scrolled;
            setIsScrolled(scrolled);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /** 导航菜单项配置 */
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => { navigate('/'); setMobileMenuOpen(false); }
    },
    {
      key: '/scenic',
      icon: <CompassOutlined />,
      label: '景区',
      children: [
        {
          key: 'scenic-all',
          label: '全部景区',
          onClick: () => { navigate('/scenic'); setMobileMenuOpen(false); }
        },
        {
          type: 'divider'
        },
        {
          key: 'scenic-city-title',
          label: '城市快捷',
          disabled: true,
          style: { pointerEvents: 'none' }
        },
        ...cityQuickAccess.map(city => ({
          key: city.key,
          label: (
            <span className="city-menu-item">
              <span className="city-name">{city.label}</span>
              <span className="city-sub">{city.subLabel}</span>
            </span>
          ),
          onClick: () => { navigate(city.key); setMobileMenuOpen(false); }
        })),
        {
          type: 'divider'
        },
        {
          key: 'scenic-category-title',
          label: '分类筛选',
          disabled: true,
          style: { pointerEvents: 'none' }
        },
        ...scenicCategories.map(cat => ({
          key: cat.key,
          label: cat.label,
          icon: cat.icon,
          onClick: () => { navigate(cat.key); setMobileMenuOpen(false); }
        })),
        {
          type: 'divider'
        },
        {
          key: 'scenic-popular-title',
          label: '热门推荐',
          disabled: true,
          style: { pointerEvents: 'none' }
        },
        ...popularScenicSpots.map(spot => ({
          key: spot.key,
          label: (
            <span className="popular-spot-item">
              <span className="spot-name">{spot.label}</span>
              <span className="spot-meta">
                <span className="spot-sub">{spot.subLabel}</span>
                <span className="spot-rating">⭐ {spot.rating}</span>
              </span>
            </span>
          ),
          onClick: () => { navigate(spot.key); setMobileMenuOpen(false); }
        }))
      ]
    },
    {
      key: '/hotels',
      icon: <HomeFilled />,
      label: '酒店预订',
      onClick: () => { navigate('/hotels'); setMobileMenuOpen(false); }
    },
    {
      key: '/create',
      icon: <PlusOutlined />,
      label: '创建行程',
      onClick: () => { navigate('/create'); setMobileMenuOpen(false); }
    },
    {
      key: '/itineraries',
      icon: <UnorderedListOutlined />,
      label: '我的行程',
      onClick: () => { navigate('/itineraries'); setMobileMenuOpen(false); }
    },
    {
      key: '/jiangnan-map',
      icon: <EnvironmentOutlined />,
      label: '地图规划',
      onClick: () => { navigate('/jiangnan-map'); setMobileMenuOpen(false); }
    },
    {
      key: '/ai-accounting',
      icon: <CalculatorOutlined />,
      label: 'AI记账',
      onClick: () => { navigate('/ai-accounting'); setMobileMenuOpen(false); }
    },
    {
      key: '/ai-planning',
      icon: <RobotOutlined />,
      label: 'AI规划',
      onClick: () => { navigate('/ai-planning'); setMobileMenuOpen(false); }
    }
  ];

  /** 用户下拉菜单项配置 */
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/auth')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => {}
    },
    {
      type: 'divider'
    },
    {
      key: 'admin',
      icon: <DashboardOutlined />,
      label: '管理后台',
      onClick: () => window.open('/admin', '_blank')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => navigate('/auth')
    }
  ];

  return (
    <AntLayout className="app-layout">
      <Header className={`app-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="header-container">
          <div className="header-left">
            <div className="app-logo-wrapper" onClick={() => navigate('/')}>
              <Logo size={isScrolled ? 'small' : 'medium'} showText={true} />
            </div>
            <Menu
              theme="light"
              mode="horizontal"
              selectedKeys={[location.pathname]}
              items={menuItems}
              className="nav-menu nav-bar-optimized"
              overflowedIndicator={null}
              style={{ flex: 1 }}
            />
          </div>
          <div className="header-actions">
            <div className="search-wrapper desktop-only">
              <SearchOutlined className="search-icon" />
              <Input
                placeholder="搜索..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="search-input"
              />
            </div>
            <Tooltip title="管理后台" placement="bottom">
              <Button
                type="primary"
                icon={<DashboardOutlined />}
                className="admin-btn desktop-only"
                onClick={() => window.open('/admin', '_blank')}
                aria-label="打开管理后台"
              >
                管理后台
              </Button>
            </Tooltip>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="user-menu desktop-only">
                <Avatar className="user-avatar" icon={<UserOutlined />} />
                <Text className="user-name">游客</Text>
              </div>
            </Dropdown>
            <button 
              className="mobile-menu-btn" 
              onClick={() => setMobileMenuOpen(true)}
              aria-label="打开菜单"
            >
              <MenuOutlined />
            </button>
          </div>
        </div>
      </Header>
      <Drawer
        title={null}
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        className="mobile-menu-drawer"
        width={280}
        closeIcon={<CloseOutlined />}
        headerStyle={{ display: 'none' }}
      >
        <div className="mobile-menu-header">
          <div className="mobile-menu-logo" onClick={() => { navigate('/'); setMobileMenuOpen(false); }}>
            <Logo size="medium" showText={true} />
          </div>
        </div>
        <div className="mobile-search-wrapper">
          <SearchOutlined className="search-icon" />
          <Input
            placeholder="搜索..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="search-input"
          />
        </div>
        <Menu
          mode="vertical"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="mobile-nav-menu"
        />
        <div className="mobile-admin-section">
          <Button
            type="primary"
            icon={<DashboardOutlined />}
            className="mobile-admin-btn"
            onClick={() => window.open('/admin', '_blank')}
            block
          >
            管理后台
          </Button>
        </div>
        <div className="mobile-user-section">
          <div className="mobile-user-info" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>
            <Avatar className="user-avatar" icon={<UserOutlined />} />
            <Text className="user-name">游客</Text>
          </div>
        </div>
      </Drawer>
      <Content className="app-content">
        <div className="content-wrapper">{children}</div>
      </Content>
      <Footer className="app-footer">
        <Text className="footer-text">
          江浙沪旅游行程规划系统
        </Text>
      </Footer>
      
      {/* 移动端底部导航栏 */}
      <nav className="mobile-bottom-nav" aria-label="移动端导航">
        {menuItems.map(item => (
          <div
            key={item.key}
            className={`nav-item ${location.pathname === item.key ? 'active' : ''}`}
            onClick={item.onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && item.onClick()}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
      </nav>
    </AntLayout>
  );
};

export default Layout;
