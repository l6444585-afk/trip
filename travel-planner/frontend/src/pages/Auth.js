/**
 * 认证页面组件
 * 提供用户登录和注册功能
 * @module pages/Auth
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Form, Input, Button, message, Tabs, Divider, Checkbox, Tooltip } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import { API_ENDPOINTS, STORAGE_KEYS } from '../constants';
import Logo from '../components/Logo';
import './Auth.css';

function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);
  
  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
  
  return debouncedCallback;
}

const UsernameStatus = ({ username, checking, available, message }) => {
  if (!username) return null;

  if (checking) {
    return <span className="username-checking">正在检查用户名...</span>;
  }

  if (available === true) {
    return (
      <span className="username-available">
        <CheckCircleOutlined /> 用户名可用
      </span>
    );
  }

  if (available === false) {
    return (
      <span className="username-taken">
        <CloseCircleOutlined /> {message || '用户名已被使用'}
      </span>
    );
  }

  return null;
};

const Auth = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [registerPasswordVisible, setRegisterPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameMessage, setUsernameMessage] = useState('');

  useEffect(() => {
    const savedRememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
    if (savedRememberMe) {
      setRememberMe(true);
    }
  }, []);

  const checkUsernameAvailability = useCallback(async (username) => {
    if (!username) {
      setUsernameAvailable(null);
      return;
    }

    setUsernameChecking(true);
    try {
      const response = await axios.post(`${API_ENDPOINTS.CHECK_USERNAME}?username=${encodeURIComponent(username)}`);
      setUsernameAvailable(response.data.available);
      setUsernameMessage(response.data.message);
    } catch (error) {
      setUsernameAvailable(null);
    } finally {
      setUsernameChecking(false);
    }
  }, []);

  const debouncedCheckUsername = useDebounce(checkUsernameAvailability, 500);

  const handleUsernameChange = (e) => {
    const username = e.target.value;
    setUsernameAvailable(null);
    debouncedCheckUsername(username);
  };

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post(API_ENDPOINTS.LOGIN, {
        username: values.username,
        password: values.password,
        remember_me: rememberMe
      });

      localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.access_token);
      if (response.data.refresh_token) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.data.refresh_token);
      }
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user));
      localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, rememberMe.toString());

      message.success({
        content: '登录成功！欢迎回来',
        duration: 2,
        style: { marginTop: '20vh' }
      });

      setTimeout(() => navigate('/'), 500);
    } catch (error) {
      let errorMessage = '登录失败，请检查用户名和密码';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          const firstError = errorData.detail[0];
          if (firstError && firstError.msg) {
            errorMessage = firstError.msg;
          }
        }
      }
      
      message.error({
        content: errorMessage,
        duration: 3,
        style: { marginTop: '20vh' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values) => {
    if (usernameAvailable === false) {
      message.error({
        content: '用户名已被使用，请更换',
        duration: 3,
        style: { marginTop: '20vh' }
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(API_ENDPOINTS.REGISTER, {
        username: values.username,
        password: values.password,
        confirm_password: values.confirmPassword
      });

      localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.access_token);
      if (response.data.refresh_token) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.data.refresh_token);
      }
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user));

      message.success({
        content: '注册成功！欢迎加入江浙沪旅游规划',
        duration: 2,
        style: { marginTop: '20vh' }
      });

      setTimeout(() => navigate('/'), 500);
    } catch (error) {
      let errorMessage = '注册失败，请稍后重试';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          const firstError = errorData.detail[0];
          if (firstError && firstError.msg) {
            errorMessage = firstError.msg;
          }
        }
      }
      
      message.error({
        content: errorMessage,
        duration: 3,
        style: { marginTop: '20vh' }
      });
    } finally {
      setLoading(false);
    }
  };

  const loginRules = {
    username: [{ required: true, message: '请输入用户名' }],
    password: [{ required: true, message: '请输入密码' }]
  };

  const registerRules = {
    username: [
      { required: true, message: '请输入用户名' },
      { max: 50, message: '用户名不能超过50个字符' },
      { 
        pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, 
        message: '用户名只能包含字母、数字、下划线和中文' 
      }
    ],
    password: [
      { required: true, message: '请输入密码' }
    ],
    confirmPassword: [
      { required: true, message: '请确认密码' },
      ({ getFieldValue }) => ({
        validator(_, value) {
          if (!value || getFieldValue('password') === value) {
            return Promise.resolve();
          }
          return Promise.reject(new Error('两次输入的密码不一致'));
        }
      })
    ]
  };

  const LoginForm = (
    <Form
      form={loginForm}
      layout="vertical"
      onFinish={handleLogin}
      autoComplete="off"
      className="auth-form"
    >
      <Form.Item label="用户名" name="username" rules={loginRules.username}>
        <Input
          prefix={<UserOutlined />}
          placeholder="请输入用户名"
          className="auth-input"
          size="large"
        />
      </Form.Item>

      <Form.Item label="密码" name="password" rules={loginRules.password}>
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="请输入密码"
          className="auth-input"
          size="large"
          visibilityToggle={{
            visible: passwordVisible,
            onVisibleChange: setPasswordVisible
          }}
          iconRender={(visible) =>
            visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
          }
        />
      </Form.Item>

      <Form.Item>
        <div className="login-options">
          <Checkbox
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          >
            <Tooltip title="7天内免登录">
              <span>记住我</span>
            </Tooltip>
          </Checkbox>
        </div>
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          size="large"
          className="auth-button"
        >
          {loading ? '登录中...' : '登录'}
        </Button>
      </Form.Item>
    </Form>
  );

  const RegisterForm = (
    <Form
      form={registerForm}
      layout="vertical"
      onFinish={handleRegister}
      autoComplete="off"
      className="auth-form"
    >
      <Form.Item 
        label="用户名" 
        name="username" 
        rules={registerRules.username}
        validateTrigger="onBlur"
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="请输入用户名"
          className="auth-input"
          size="large"
          onChange={handleUsernameChange}
          suffix={
            <UsernameStatus 
              username={registerForm.getFieldValue('username')}
              checking={usernameChecking}
              available={usernameAvailable}
              message={usernameMessage}
            />
          }
        />
      </Form.Item>

      <Form.Item 
        label="密码" 
        name="password" 
        rules={registerRules.password}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="请输入密码"
          className="auth-input"
          size="large"
          visibilityToggle={{
            visible: registerPasswordVisible,
            onVisibleChange: setRegisterPasswordVisible
          }}
          iconRender={(visible) =>
            visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
          }
        />
      </Form.Item>

      <Form.Item
        label="确认密码"
        name="confirmPassword"
        dependencies={['password']}
        rules={registerRules.confirmPassword}
      >
        <Input.Password
          prefix={<SafetyOutlined />}
          placeholder="请再次输入密码"
          className="auth-input"
          size="large"
          visibilityToggle={{
            visible: confirmPasswordVisible,
            onVisibleChange: setConfirmPasswordVisible
          }}
          iconRender={(visible) =>
            visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
          }
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          size="large"
          className="auth-button"
          disabled={usernameAvailable === false}
        >
          {loading ? '注册中...' : '注册'}
        </Button>
      </Form.Item>
    </Form>
  );

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: LoginForm
    },
    {
      key: 'register',
      label: '注册',
      children: RegisterForm
    }
  ];

  return (
    <div className="auth-container">
      <div className="auth-background" />
      <div className="auth-content">
        <div className="auth-header">
          <div className="auth-logo">
            <Logo size="large" showText={true} />
            <p className="auth-subtitle">探索江南水乡，品味诗意生活</p>
          </div>
        </div>

        <div className="auth-card">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="auth-tabs"
            centered
            items={tabItems}
          />
        </div>

        <div className="auth-footer">
          <Divider className="auth-divider">演示账户</Divider>
          <div className="demo-account">
            <div className="demo-info">
              <span className="demo-label">测试用户名：</span>
              <span className="demo-value">admin</span>
            </div>
            <div className="demo-info">
              <span className="demo-label">测试密码：</span>
              <span className="demo-value">123456</span>
            </div>
            <p className="demo-note">提示：这是演示账户，仅用于测试目的</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
