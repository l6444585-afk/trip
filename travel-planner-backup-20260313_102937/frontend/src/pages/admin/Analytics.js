import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Select, DatePicker, Button, Table, Spin, Statistic, Tabs, message
} from 'antd';
import {
  DownloadOutlined, LineChartOutlined, BarChartOutlined,
  PieChartOutlined, UserOutlined, ShoppingCartOutlined
} from '@ant-design/icons';
import { Line, Column, Pie, Area } from '@ant-design/charts';
import dayjs from 'dayjs';
import { adminDashboardService, adminOrderService, adminUserService, adminItineraryService } from '../../services/adminApi';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const Analytics = () => {
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [popularItineraries, setPopularItineraries] = useState([]);
  const [orderStats, setOrderStats] = useState({ byStatus: [], byCity: [] });
  const [userStats, setUserStats] = useState({ bySource: [], byAge: [] });

  useEffect(() => {
    fetchAnalyticsData();
  }, [days]);

  const fetchAnalyticsData = async () => {
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

      const orderStatusData = [
        { type: '待确认', value: Math.floor(Math.random() * 50) + 10 },
        { type: '已确认', value: Math.floor(Math.random() * 100) + 20 },
        { type: '已支付', value: Math.floor(Math.random() * 200) + 50 },
        { type: '已完成', value: Math.floor(Math.random() * 300) + 100 },
        { type: '已取消', value: Math.floor(Math.random() * 30) + 5 },
      ];
      setOrderStats({ byStatus: orderStatusData, byCity: [] });

      const userSourceData = [
        { type: '直接访问', value: 35 },
        { type: '搜索引擎', value: 30 },
        { type: '社交媒体', value: 20 },
        { type: '推荐链接', value: 15 },
      ];
      setUserStats({ bySource: userSourceData, byAge: [] });

    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    message.info('数据导出功能开发中...');
  };

  const revenueConfig = {
    data: revenueTrend,
    xField: 'date',
    yField: 'revenue',
    smooth: true,
    point: { size: 3 },
    tooltip: {
      formatter: (datum) => ({
        name: '收入',
        value: `¥${datum.revenue?.toFixed(2) || 0}`,
      }),
    },
    color: '#1890ff',
    areaStyle: { fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff' },
  };

  const ordersConfig = {
    data: revenueTrend,
    xField: 'date',
    yField: 'orders',
    color: '#52c41a',
    columnStyle: { borderRadius: [4, 4, 0, 0] },
  };

  const userActivityConfig = {
    data: userActivity,
    xField: 'date',
    yField: 'new_users',
    smooth: true,
    color: '#722ed1',
    point: { size: 3 },
  };

  const loginActivityConfig = {
    data: userActivity,
    xField: 'date',
    yField: 'logins',
    smooth: true,
    color: '#faad14',
    point: { size: 3 },
  };

  const orderStatusConfig = {
    data: orderStats.byStatus,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    label: { type: 'inner', offset: '-50%' },
  };

  const userSourceConfig = {
    data: userStats.bySource,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: { type: 'spider' },
  };

  const popularColumns = [
    { title: '排名', key: 'rank', width: 60, render: (_, __, i) => i + 1 },
    { title: '行程名称', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '浏览量', dataIndex: 'view_count', key: 'view_count', sorter: (a, b) => a.view_count - b.view_count },
    { title: '订单数', dataIndex: 'order_count', key: 'order_count', sorter: (a, b) => a.order_count - b.order_count },
    { title: '收入', dataIndex: 'revenue', key: 'revenue', render: (v) => `¥${v?.toFixed(2)}`, sorter: (a, b) => a.revenue - b.revenue },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1 className="page-title">数据分析</h1>
        <p className="page-subtitle">系统运营数据统计与分析</p>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出报表
          </Button>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总收入"
              value={stats?.total_revenue || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="本月收入"
              value={stats?.month_revenue || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总用户"
              value={stats?.total_users || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总订单"
              value={stats?.total_orders || 0}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="revenue" style={{ marginTop: 16 }}>
        <TabPane tab="收入分析" key="revenue">
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Card title="收入趋势">
                <Line {...revenueConfig} height={300} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="订单数量">
                <Column {...ordersConfig} height={300} />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="用户分析" key="user">
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Card title="新用户趋势">
                <Line {...userActivityConfig} height={300} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="登录活跃度">
                <Area {...loginActivityConfig} height={300} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="用户来源分布">
                <Pie {...userSourceConfig} height={300} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="用户增长统计">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic title="今日新增" value={stats?.new_users_today || 0} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="本周新增" value={stats?.new_users_week || 0} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="本月新增" value={stats?.new_users_month || 0} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="今日活跃" value={stats?.active_users_today || 0} />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="订单分析" key="order">
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Card title="订单状态分布">
                <Pie {...orderStatusConfig} height={300} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="订单统计">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic title="今日订单" value={stats?.today_orders || 0} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="总订单" value={stats?.total_orders || 0} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="今日收入" value={stats?.today_revenue || 0} prefix="¥" precision={2} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="平均客单价" value={(stats?.total_revenue / stats?.total_orders) || 0} prefix="¥" precision={2} />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="热门排行" key="popular">
          <Card title="热门行程排行">
            <Table
              columns={popularColumns}
              dataSource={popularItineraries}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Analytics;
