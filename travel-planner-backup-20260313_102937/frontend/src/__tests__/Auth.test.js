import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Auth from '../pages/Auth';
import '@testing-library/jest-dom';

describe('Auth Component', () => {
  test('renders login form by default', () => {
    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );
    
    expect(screen.getByText('登录')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入用户名')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument();
  });

  test('renders register form when register tab is clicked', async () => {
    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );
    
    const registerTab = screen.getByText('注册');
    fireEvent.click(registerTab);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('请输入邮箱')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请再次输入密码')).toBeInTheDocument();
    });
  });

  test('shows demo account information', () => {
    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );
    
    expect(screen.getByText('演示账户')).toBeInTheDocument();
    expect(screen.getByText('测试用户名：admin')).toBeInTheDocument();
    expect(screen.getByText('测试密码：123456')).toBeInTheDocument();
  });
});
