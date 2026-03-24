import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Breadcrumb } from 'antd';
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
  FileTextOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { adminAuthService } from '../../services/adminApi';
import './AdminLayout.css';

const { Sider, Content } = Layout;

const breadcrumbNameMap = {
  '/admin': '仪表盘',
  '/admin/users': '用户管理',
  '/admin/itineraries': '行程管理',
  '/admin/attractions': '景点管理',
  '/admin/orders': '订单管理',
  '/admin/analytics': '数据分析',
  '/admin/system': '系统设置',
  '/admin/system/admin-users': '管理员管理',
  '/admin/system/roles': '角色权限',
  '/admin/system/logs': '操作日志',
  '/admin/system/backups': '数据备份',
};

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

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
    { key: '/admin', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/admin/users', icon: <UserOutlined />, label: '用户管理', permission: 'user:list' },
    { key: '/admin/itineraries', icon: <ScheduleOutlined />, label: '行程管理', permission: 'itinerary:list' },
    { key: '/admin/attractions', icon: <EnvironmentOutlined />, label: '景点管理', permission: 'attraction:list' },
    { key: '/admin/orders', icon: <ShoppingCartOutlined />, label: '订单管理', permission: 'order:list' },
    { key: '/admin/analytics', icon: <BarChartOutlined />, label: '数据分析', permission: 'analytics' },
    {
      key: '/admin/system',
      icon: <SettingOutlined />,
      label: '系统设置',
      children: [
        { key: '/admin/system/admin-users', icon: <SafetyOutlined />, label: '管理员管理', permission: 'user:list' },
        { key: '/admin/system/roles', icon: <SafetyOutlined />, label: '角色权限', permission: 'system:role' },
        { key: '/admin/system/logs', icon: <FileTextOutlined />, label: '操作日志', permission: 'system:log' },
        { key: '/admin/system/backups', icon: <DatabaseOutlined />, label: '数据备份', permission: 'system:backup' },
      ],
    },
  ];

  const filterMenuByPermissions = (items) => {
    if (!currentUser) return [];
    if (currentUser.is_superuser) return items;
    return items.filter(item => {
      if (item.permission && !currentUser.permissions?.includes(item.permission)) return false;
      if (item.children) {
        item.children = filterMenuByPermissions(item.children);
        return item.children.length > 0;
      }
      return true;
    });
  };

  const filteredMenuItems = filterMenuByPermissions(menuItems.map(i => ({ ...i, children: i.children ? [...i.children] : undefined })));

  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/') return ['/admin'];
    return [path];
  };

  const getOpenKeys = () => {
    if (location.pathname.startsWith('/admin/system')) return ['/admin/system'];
    return [];
  };

  const buildBreadcrumb = () => {
    const pathSnippets = location.pathname.split('/').filter(Boolean);
    const items = [{ title: <Link to="/admin">首页</Link> }];
    let currentPath = '';
    pathSnippets.forEach((snippet, index) => {
      currentPath += `/${snippet}`;
      const name = breadcrumbNameMap[currentPath];
      if (name && index > 0) {
        const isLast = index === pathSnippets.length - 1;
        items.push({ title: isLast ? name : <Link to={currentPath}>{name}</Link> });
      }
    });
    return items;
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true, onClick: handleLogout },
  ];

  return (
    <Layout className="admin-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="admin-sider"
        width={256}
        collapsedWidth={72}
        theme="light"
      >
        <div className="admin-logo" onClick={() => navigate('/admin')}>
          <div className="logo-icon">旅</div>
          {!collapsed && (
            <div className="logo-text-group">
              <div className="logo-title">旅游管理系统</div>
              <div className="logo-subtitle">Admin Console</div>
            </div>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={filteredMenuItems}
          onClick={({ key }) => navigate(key)}
        />
        {!collapsed && currentUser && (
          <Dropdown menu={{ items: userMenuItems }} placement="topRight" trigger={['click']}>
            <div className="sidebar-user">
              <Avatar size={32} icon={<UserOutlined />} src={currentUser.avatar}
                style={{ background: 'linear-gradient(135deg, #1A936F, #114B5F)' }}
              />
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{currentUser.real_name || currentUser.username}</span>
                <span className="sidebar-user-role">{currentUser.is_superuser ? '超级管理员' : '管理员'}</span>
              </div>
            </div>
          </Dropdown>
        )}
      </Sider>
      <Layout>
        <header className="admin-header">
          <div className="header-left">
            <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
            <Breadcrumb items={buildBreadcrumb()} className="header-breadcrumb" />
          </div>
          <div className="header-right">
            <Badge count={0} size="small" offset={[-4, 4]}>
              <button className="header-action-btn"><BellOutlined /></button>
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="header-user">
                <Avatar size={30} icon={<UserOutlined />} src={currentUser?.avatar}
                  style={{ background: 'linear-gradient(135deg, #1A936F, #114B5F)' }}
                />
                <span className="header-user-name">{currentUser?.real_name || currentUser?.username}</span>
              </div>
            </Dropdown>
          </div>
        </header>
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
