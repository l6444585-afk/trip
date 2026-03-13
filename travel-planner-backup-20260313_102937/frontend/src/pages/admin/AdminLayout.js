import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Badge, Button, theme } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ScheduleOutlined,
  EnvironmentOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  BellOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { adminAuthService } from '../../services/adminApi';
import Logo from '../../components/Logo';
import './AdminLayout.css';

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  useEffect(() => {
    const user = adminAuthService.getCurrentUser();
    if (!user) {
      navigate('/admin/login');
      return;
    }
    setCurrentUser(user);
  }, [navigate]);

  const handleLogout = () => {
    adminAuthService.logout();
    navigate('/admin/login');
  };

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: '用户管理',
      permission: 'user:list',
    },
    {
      key: '/admin/itineraries',
      icon: <ScheduleOutlined />,
      label: '行程管理',
      permission: 'itinerary:list',
    },
    {
      key: '/admin/attractions',
      icon: <EnvironmentOutlined />,
      label: '景点管理',
      permission: 'attraction:list',
    },
    {
      key: '/admin/orders',
      icon: <ShoppingCartOutlined />,
      label: '订单管理',
      permission: 'order:list',
    },
    {
      key: '/admin/analytics',
      icon: <BarChartOutlined />,
      label: '数据分析',
      permission: 'analytics',
    },
    {
      key: '/admin/system',
      icon: <SettingOutlined />,
      label: '系统设置',
      children: [
        {
          key: '/admin/system/admin-users',
          icon: <SafetyOutlined />,
          label: '管理员管理',
          permission: 'user:list',
        },
        {
          key: '/admin/system/roles',
          icon: <SafetyOutlined />,
          label: '角色权限',
          permission: 'system:role',
        },
        {
          key: '/admin/system/logs',
          icon: <BarChartOutlined />,
          label: '操作日志',
          permission: 'system:log',
        },
        {
          key: '/admin/system/backups',
          icon: <SettingOutlined />,
          label: '数据备份',
          permission: 'system:backup',
        },
        {
          key: '/admin/system/announcements',
          icon: <BellOutlined />,
          label: '公告管理',
        },
        {
          key: '/admin/system/feedbacks',
          icon: <UserOutlined />,
          label: '用户反馈',
        },
      ],
    },
  ];

  const filterMenuByPermissions = (items) => {
    if (!currentUser) return [];
    if (currentUser.is_superuser) return items;

    return items.filter(item => {
      if (item.permission && !currentUser.permissions?.includes(item.permission)) {
        return false;
      }
      if (item.children) {
        item.children = filterMenuByPermissions(item.children);
        return item.children.length > 0;
      }
      return true;
    });
  };

  const filteredMenuItems = filterMenuByPermissions([...menuItems]);

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const getSelectedKeys = () => {
    const path = location.pathname;
    return [path];
  };

  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/admin/system')) {
      return ['/admin/system'];
    }
    return [];
  };

  return (
    <Layout className="admin-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="admin-sider"
        width={220}
      >
        <div className="admin-logo">
          {collapsed ? (
            <div className="logo-icon">江</div>
          ) : (
            <Logo size="small" showText={true} darkMode={true} />
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={filteredMenuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header className="admin-header" style={{ background: colorBgContainer }}>
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="collapse-btn"
            />
          </div>
          <div className="header-right">
            <Badge count={0} size="small">
              <Button type="text" icon={<BellOutlined />} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="user-info">
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  src={currentUser?.avatar}
                />
                <span className="username">{currentUser?.real_name || currentUser?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          className="admin-content"
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
