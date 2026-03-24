import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

import AdminLayout from './AdminLayout';
import AdminLogin from './AdminLogin';
import Dashboard from './Dashboard';
import UserManagement from './UserManagement';
import ItineraryManagement from './ItineraryManagement';
import AttractionManagement from './AttractionManagement';
import OrderManagement from './OrderManagement';
import Analytics from './Analytics';
import RoleManagement from './RoleManagement';
import AdminUserManagement from './AdminUserManagement';
import OperationLogs from './OperationLogs';
import BackupManagement from './BackupManagement';
import { adminAuthService } from '../../services/adminApi';

const ProtectedRoute = ({ children }) => {
  if (!adminAuthService.isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

const AdminApp = () => (
  <ConfigProvider locale={zhCN}>
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="itineraries" element={<ItineraryManagement />} />
        <Route path="attractions" element={<AttractionManagement />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="system">
          <Route path="admin-users" element={<AdminUserManagement />} />
          <Route path="roles" element={<RoleManagement />} />
          <Route path="logs" element={<OperationLogs />} />
          <Route path="backups" element={<BackupManagement />} />
        </Route>
      </Route>
    </Routes>
  </ConfigProvider>
);

export default AdminApp;
