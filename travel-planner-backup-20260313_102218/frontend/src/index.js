/**
 * 应用入口文件
 * 初始化React应用并渲染根组件
 * @module index
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

// Ant Design 样式
import 'antd/dist/reset.css';

// 全局样式
import './index.css';

// 根组件
import App from './App';

/**
 * 创建React根节点
 */
const root = ReactDOM.createRoot(document.getElementById('root'));

/**
 * 渲染应用
 */
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
