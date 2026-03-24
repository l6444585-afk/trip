import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminAuthService } from '../../services/adminApi';
import './AdminLogin.css';

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await adminAuthService.login(values.username, values.password);
      message.success('登录成功');
      navigate('/admin');
    } catch (error) {
      const errorMsg = error.response?.data?.detail || '登录失败，请检查用户名和密码';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="login-brand">
        <div className="brand-content">
          <div className="brand-icon">旅</div>
          <h1 className="brand-title">江浙沪旅游管理系统</h1>
          <p className="brand-desc">
            一站式旅游行程管理平台，提供景点管理、行程规划、订单跟踪、数据分析等功能
          </p>
          <div className="brand-features">
            <div className="brand-feature">
              <span className="brand-feature-dot" />
              智能行程规划与 AI 推荐
            </div>
            <div className="brand-feature">
              <span className="brand-feature-dot" />
              实时数据分析与运营看板
            </div>
            <div className="brand-feature">
              <span className="brand-feature-dot" />
              多角色权限管理体系
            </div>
          </div>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-header">
          <h2>管理后台登录</h2>
          <p>请输入您的管理员账号和密码</p>
        </div>

        <Form
          name="admin_login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          initialValues={{ remember: true }}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>7 天内自动登录</Checkbox>
            </Form.Item>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="login-submit-btn"
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className="login-footer">
          <span className="login-footer-hint">
            默认管理员账户: admin / admin123
          </span>
        </div>

        <p className="login-copyright">
          江浙沪旅游行程规划系统
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
