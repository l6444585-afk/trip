import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Spin, DatePicker, Select } from 'antd';
import {
  UserOutlined,
  ScheduleOutlined,
  ShoppingCartOutlined,
  EnvironmentOutlined,
  RiseOutlined,
  FallOutlined,
  TeamOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { Line, Column } from '@ant-design/charts';
import { adminDashboardService } from '../../services/adminApi';

const { RangePicker } = DatePicker;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [popularItineraries, setPopularItineraries] = useState([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchDashboardData();
  }, [days]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, revenueRes, activityRes, popularRes] = await Promise.all([
        adminDashboardService.getStats(),
        adminDashboardService.getRevenueTrend(days),
        adminDashboardService.getUserActivity(days),
        adminDashboardService.getPopularItineraries(10),
      ]);
      setStats(statsRes);
      setRevenueTrend(revenueRes);
      setUserActivity(activityRes);
      setPopularItineraries(popularRes);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const revenueChartConfig = {
    data: revenueTrend,
    xField: 'date',
    yField: 'revenue',
    smooth: true,
    point: {
      size: 3,
      shape: 'circle',
    },
    tooltip: {
      formatter: (datum) => ({
        name: '收入',
        value: `¥${datum.revenue.toFixed(2)}`,
      }),
    },
    color: '#1890ff',
    areaStyle: {
      fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff',
    },
  };

  const orderChartConfig = {
    data: revenueTrend,
    xField: 'date',
    yField: 'orders',
    color: '#52c41a',
    columnStyle: {
      borderRadius: [4, 4, 0, 0],
    },
  };

  const userActivityConfig = {
    data: userActivity,
    xField: 'date',
    yField: 'new_users',
    smooth: true,
    color: '#722ed1',
    point: {
      size: 3,
    },
  };

  const popularColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: '行程名称',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '浏览量',
      dataIndex: 'view_count',
      key: 'view_count',
      sorter: (a, b) => a.view_count - b.view_count,
    },
    {
      title: '订单数',
      dataIndex: 'order_count',
      key: 'order_count',
      sorter: (a, b) => a.order_count - b.order_count,
    },
    {
      title: '收入',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (val) => `¥${val.toFixed(2)}`,
      sorter: (a, b) => a.revenue - b.revenue,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">仪表盘</h1>
        <p className="page-subtitle">系统运营数据概览</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" hoverable>
            <Statistic
              title="总用户数"
              value={stats?.total_users || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="stat-trend up">
              <RiseOutlined /> 今日新增 {stats?.new_users_today || 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" hoverable>
            <Statistic
              title="总行程数"
              value={stats?.total_itineraries || 0}
              prefix={<ScheduleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="stat-trend up">
              <RiseOutlined /> 今日新增 {stats?.new_itineraries_today || 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" hoverable>
            <Statistic
              title="总订单数"
              value={stats?.total_orders || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div className="stat-trend up">
              <RiseOutlined /> 今日订单 {stats?.today_orders || 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" hoverable>
            <Statistic
              title="总收入"
              value={stats?.total_revenue || 0}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#faad14' }}
            />
            <div className="stat-trend up">
              <RiseOutlined /> 本月 ¥{(stats?.month_revenue || 0).toFixed(2)}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="今日活跃用户"
              value={stats?.active_users_today || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="已发布行程"
              value={stats?.published_itineraries || 0}
              prefix={<ScheduleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="待审核行程"
              value={stats?.pending_review || 0}
              prefix={<ScheduleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="景点数量"
              value={stats?.total_attractions || 0}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>趋势分析</h3>
          <Select
            value={days}
            onChange={setDays}
            style={{ width: 120 }}
            options={[
              { value: 7, label: '近7天' },
              { value: 14, label: '近14天' },
              { value: 30, label: '近30天' },
              { value: 60, label: '近60天' },
              { value: 90, label: '近90天' },
            ]}
          />
        </div>
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <div className="chart-container">
              <h4 className="chart-title">收入趋势</h4>
              <Line {...revenueChartConfig} height={250} />
            </div>
          </Col>
          <Col xs={24} lg={12}>
            <div className="chart-container">
              <h4 className="chart-title">订单数量</h4>
              <Column {...orderChartConfig} height={250} />
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <div className="chart-container">
              <h4 className="chart-title">新用户趋势</h4>
              <Line {...userActivityConfig} height={250} />
            </div>
          </Col>
          <Col xs={24} lg={12}>
            <div className="chart-container">
              <h4 className="chart-title">热门行程排行</h4>
              <Table
                columns={popularColumns}
                dataSource={popularItineraries}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;
