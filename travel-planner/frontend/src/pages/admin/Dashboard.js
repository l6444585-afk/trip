import React, { useState, useEffect } from 'react';
import { Select, Table, Spin } from 'antd';
import {
  UserOutlined,
  ScheduleOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { Line, Column } from '@ant-design/charts';
import { adminDashboardService } from '../../services/adminApi';
import PageContainer from './components/PageContainer';
import StatCard from './components/StatCard';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [popularItineraries, setPopularItineraries] = useState([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, r, a, p] = await Promise.all([
        adminDashboardService.getStats(),
        adminDashboardService.getRevenueTrend(days),
        adminDashboardService.getUserActivity(days),
        adminDashboardService.getPopularItineraries(10),
      ]);
      setStats(s);
      setRevenueTrend(r);
      setUserActivity(a);
      setPopularItineraries(p);
    } catch (error) {
      console.error('Dashboard fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const primaryStats = [
    { title: '总用户数', value: stats?.total_users || 0, icon: <UserOutlined />, color: '#1A936F', trend: stats?.new_users_today || 0, trendLabel: '今日新增' },
    { title: '总行程数', value: stats?.total_itineraries || 0, icon: <ScheduleOutlined />, color: '#3B82F6', trend: stats?.new_itineraries_today || 0, trendLabel: '今日新增' },
    { title: '总订单数', value: stats?.total_orders || 0, icon: <ShoppingCartOutlined />, color: '#8B5CF6', trend: stats?.today_orders || 0, trendLabel: '今日订单' },
    { title: '总收入', value: `${(stats?.total_revenue || 0).toFixed(2)}`, icon: <DollarOutlined />, color: '#F59E0B', prefix: '¥', trend: stats?.month_revenue ? `¥${stats.month_revenue.toFixed(0)}` : '0', trendLabel: '本月' },
  ];

  const secondaryStats = [
    { title: '今日活跃', value: stats?.active_users_today || 0, icon: <TeamOutlined />, color: '#06B6D4' },
    { title: '已发布行程', value: stats?.published_itineraries || 0, icon: <FileTextOutlined />, color: '#10B981' },
    { title: '待审核', value: stats?.pending_review || 0, icon: <ClockCircleOutlined />, color: '#EF4444' },
    { title: '景点总数', value: stats?.total_attractions || 0, icon: <EnvironmentOutlined />, color: '#EC4899' },
  ];

  const revenueConfig = {
    data: revenueTrend,
    xField: 'date',
    yField: 'revenue',
    smooth: true,
    point: { size: 2, shape: 'circle' },
    color: '#1A936F',
    areaStyle: { fill: 'l(270) 0:#ffffff 0.5:#88D5BF55 1:#1A936F33' },
    tooltip: { formatter: (d) => ({ name: '收入', value: `¥${d.revenue?.toFixed(2) || 0}` }) },
  };

  const orderConfig = {
    data: revenueTrend,
    xField: 'date',
    yField: 'orders',
    color: '#3B82F6',
    columnStyle: { borderRadius: [4, 4, 0, 0] },
  };

  const userConfig = {
    data: userActivity,
    xField: 'date',
    yField: 'new_users',
    smooth: true,
    color: '#8B5CF6',
    point: { size: 2 },
    areaStyle: { fill: 'l(270) 0:#ffffff 0.5:#8B5CF622 1:#8B5CF644' },
  };

  const popularColumns = [
    { title: '排名', key: 'rank', width: 60, render: (_, __, i) => <span style={{ fontWeight: 600, color: i < 3 ? '#1A936F' : '#6B7280' }}>{i + 1}</span> },
    { title: '行程名称', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '浏览量', dataIndex: 'view_count', key: 'view_count', width: 90, sorter: (a, b) => a.view_count - b.view_count },
    { title: '订单数', dataIndex: 'order_count', key: 'order_count', width: 90, sorter: (a, b) => a.order_count - b.order_count },
    { title: '收入', dataIndex: 'revenue', key: 'revenue', width: 100, render: (v) => `¥${v?.toFixed(2)}`, sorter: (a, b) => a.revenue - b.revenue },
  ];

  return (
    <PageContainer title="仪表盘" subtitle="系统运营数据概览">
      <div className="dashboard-stats">
        {primaryStats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div className="dashboard-stats" style={{ marginBottom: 20 }}>
        {secondaryStats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Select
          value={days}
          onChange={setDays}
          style={{ width: 120 }}
          options={[
            { value: 7, label: '近 7 天' },
            { value: 14, label: '近 14 天' },
            { value: 30, label: '近 30 天' },
            { value: 60, label: '近 60 天' },
            { value: 90, label: '近 90 天' },
          ]}
        />
      </div>

      <div className="dashboard-charts">
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">收入趋势</h3>
          </div>
          <Line {...revenueConfig} height={260} />
        </div>
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">订单数量</h3>
          </div>
          <Column {...orderConfig} height={260} />
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">新用户趋势</h3>
          </div>
          <Line {...userConfig} height={260} />
        </div>
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">热门行程排行</h3>
          </div>
          <Table
            columns={popularColumns}
            dataSource={popularItineraries}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
