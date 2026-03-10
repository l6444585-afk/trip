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
  DashboardOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';

const { Header, Content, Footer } = AntLayout;
const { Title, Text } = Typography;

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
              className="nav-menu"
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
    </AntLayout>
  );
};

export default Layout;
