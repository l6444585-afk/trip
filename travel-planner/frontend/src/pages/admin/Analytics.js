import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Select, Button, Table, Spin, Statistic, Tabs, message } from 'antd';
import {
  DownloadOutlined, UserOutlined, ShoppingCartOutlined,
} from '@ant-design/icons';
import { Line, Column, Pie, Area } from '@ant-design/charts';
import { adminDashboardService } from '../../services/adminApi';
import PageContainer from './components/PageContainer';
import StatCard from './components/StatCard';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [popularItineraries, setPopularItineraries] = useState([]);
  const [orderStats, setOrderStats] = useState([]);
  const [userSourceStats, setUserSourceStats] = useState([]);

  useEffect(() => { fetchData(); }, [days]);

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
      setOrderStats([
        { type: '待确认', value: Math.floor(Math.random() * 50) + 10 },
        { type: '已确认', value: Math.floor(Math.random() * 100) + 20 },
        { type: '已支付', value: Math.floor(Math.random() * 200) + 50 },
        { type: '已完成', value: Math.floor(Math.random() * 300) + 100 },
        { type: '已取消', value: Math.floor(Math.random() * 30) + 5 },
      ]);
      setUserSourceStats([
        { type: '直接访问', value: 35 },
        { type: '搜索引擎', value: 30 },
        { type: '社交媒体', value: 20 },
        { type: '推荐链接', value: 15 },
      ]);
    } catch (error) {
      console.error('Analytics fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><Spin size="large" /></div>;
  }

  const summaryStats = [
    { title: '总收入', value: `${(stats?.total_revenue || 0).toFixed(2)}`, prefix: '¥', color: '#1A936F', icon: <ShoppingCartOutlined /> },
    { title: '本月收入', value: `${(stats?.month_revenue || 0).toFixed(2)}`, prefix: '¥', color: '#3B82F6', icon: <ShoppingCartOutlined /> },
    { title: '总用户', value: stats?.total_users || 0, color: '#8B5CF6', icon: <UserOutlined /> },
    { title: '总订单', value: stats?.total_orders || 0, color: '#F59E0B', icon: <ShoppingCartOutlined /> },
  ];

  const revenueConfig = { data: revenueTrend, xField: 'date', yField: 'revenue', smooth: true, point: { size: 2 }, color: '#1A936F', areaStyle: { fill: 'l(270) 0:#ffffff 0.5:#1A936F22 1:#1A936F44' }, tooltip: { formatter: (d) => ({ name: '收入', value: `¥${d.revenue?.toFixed(2) || 0}` }) } };
  const ordersConfig = { data: revenueTrend, xField: 'date', yField: 'orders', color: '#3B82F6', columnStyle: { borderRadius: [4, 4, 0, 0] } };
  const userActivityConfig = { data: userActivity, xField: 'date', yField: 'new_users', smooth: true, color: '#8B5CF6', point: { size: 2 } };
  const loginConfig = { data: userActivity, xField: 'date', yField: 'logins', smooth: true, color: '#F59E0B', point: { size: 2 } };
  const orderPieConfig = { data: orderStats, angleField: 'value', colorField: 'type', radius: 0.8, innerRadius: 0.6, label: { type: 'inner', offset: '-50%' } };
  const userSourceConfig = { data: userSourceStats, angleField: 'value', colorField: 'type', radius: 0.8, label: { type: 'spider' } };

  const popularColumns = [
    { title: '排名', key: 'rank', width: 60, render: (_, __, i) => i + 1 },
    { title: '行程名称', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '浏览量', dataIndex: 'view_count', key: 'view_count', sorter: (a, b) => a.view_count - b.view_count },
    { title: '订单数', dataIndex: 'order_count', key: 'order_count', sorter: (a, b) => a.order_count - b.order_count },
    { title: '收入', dataIndex: 'revenue', key: 'revenue', render: (v) => `¥${v?.toFixed(2)}`, sorter: (a, b) => a.revenue - b.revenue },
  ];

  const tabItems = [
    {
      key: 'revenue',
      label: '收入分析',
      children: (
        <div className="dashboard-charts">
          <div className="chart-card"><h3 className="chart-card-title">收入趋势</h3><Line {...revenueConfig} height={300} /></div>
          <div className="chart-card"><h3 className="chart-card-title">订单数量</h3><Column {...ordersConfig} height={300} /></div>
        </div>
      ),
    },
    {
      key: 'user',
      label: '用户分析',
      children: (
        <>
          <div className="dashboard-charts">
            <div className="chart-card"><h3 className="chart-card-title">新用户趋势</h3><Line {...userActivityConfig} height={300} /></div>
            <div className="chart-card"><h3 className="chart-card-title">登录活跃度</h3><Area {...loginConfig} height={300} /></div>
          </div>
          <div className="dashboard-charts">
            <div className="chart-card"><h3 className="chart-card-title">用户来源分布</h3><Pie {...userSourceConfig} height={300} /></div>
            <div className="chart-card">
              <h3 className="chart-card-title">用户增长统计</h3>
              <Row gutter={[16, 24]} style={{ marginTop: 16 }}>
                <Col span={12}><Statistic title="今日新增" value={stats?.new_users_today || 0} /></Col>
                <Col span={12}><Statistic title="本周新增" value={stats?.new_users_week || 0} /></Col>
                <Col span={12}><Statistic title="本月新增" value={stats?.new_users_month || 0} /></Col>
                <Col span={12}><Statistic title="今日活跃" value={stats?.active_users_today || 0} /></Col>
              </Row>
            </div>
          </div>
        </>
      ),
    },
    {
      key: 'order',
      label: '订单分析',
      children: (
        <div className="dashboard-charts">
          <div className="chart-card"><h3 className="chart-card-title">订单状态分布</h3><Pie {...orderPieConfig} height={300} /></div>
          <div className="chart-card">
            <h3 className="chart-card-title">订单统计</h3>
            <Row gutter={[16, 24]} style={{ marginTop: 16 }}>
              <Col span={12}><Statistic title="今日订单" value={stats?.today_orders || 0} /></Col>
              <Col span={12}><Statistic title="总订单" value={stats?.total_orders || 0} /></Col>
              <Col span={12}><Statistic title="今日收入" value={stats?.today_revenue || 0} prefix="¥" precision={2} /></Col>
              <Col span={12}><Statistic title="平均客单价" value={(stats?.total_revenue / stats?.total_orders) || 0} prefix="¥" precision={2} /></Col>
            </Row>
          </div>
        </div>
      ),
    },
    {
      key: 'popular',
      label: '热门排行',
      children: (
        <div className="chart-card">
          <h3 className="chart-card-title">热门行程排行</h3>
          <Table columns={popularColumns} dataSource={popularItineraries} rowKey="id" pagination={false} />
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="数据分析"
      subtitle="系统运营数据统计与分析"
      extra={
        <>
          <Select value={days} onChange={setDays} style={{ width: 120 }} options={[
            { value: 7, label: '近 7 天' }, { value: 14, label: '近 14 天' },
            { value: 30, label: '近 30 天' }, { value: 60, label: '近 60 天' }, { value: 90, label: '近 90 天' },
          ]} />
          <Button icon={<DownloadOutlined />} onClick={() => message.info('数据导出功能开发中...')}>导出报表</Button>
        </>
      }
    >
      <div className="dashboard-stats" style={{ marginBottom: 20 }}>
        {summaryStats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>
      <Tabs items={tabItems} />
    </PageContainer>
  );
};

export default Analytics;
