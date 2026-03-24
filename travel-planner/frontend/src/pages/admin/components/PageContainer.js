import React from 'react';
import { Breadcrumb } from 'antd';
import { useLocation, Link } from 'react-router-dom';

const breadcrumbNameMap = {
  '/admin': '仪表盘',
  '/admin/users': '用户管理',
  '/admin/itineraries': '行程管理',
  '/admin/attractions': '景点管理',
  '/admin/orders': '订单管理',
  '/admin/analytics': '数据分析',
  '/admin/system/admin-users': '管理员管理',
  '/admin/system/roles': '角色权限',
  '/admin/system/logs': '操作日志',
  '/admin/system/backups': '数据备份',
};

const PageContainer = ({ title, subtitle, extra, children }) => {
  const location = useLocation();
  const pathSnippets = location.pathname.split('/').filter(Boolean);

  const breadcrumbItems = [
    { title: <Link to="/admin">首页</Link> },
  ];

  let currentPath = '';
  pathSnippets.forEach((snippet, index) => {
    currentPath += `/${snippet}`;
    const name = breadcrumbNameMap[currentPath];
    if (name && index > 0) {
      const isLast = index === pathSnippets.length - 1;
      breadcrumbItems.push({
        title: isLast ? name : <Link to={currentPath}>{name}</Link>,
      });
    }
  });

  return (
    <div className="page-container">
      <Breadcrumb items={breadcrumbItems} className="page-breadcrumb" />
      <div className="page-header-row">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {extra && <div className="page-header-extra">{extra}</div>}
      </div>
      {children}
    </div>
  );
};

export default PageContainer;
