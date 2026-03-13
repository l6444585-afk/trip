/**
 * 创建行程页面 - 原型嵌入版（纯净版）
 * 嵌入 itinerary-system-prototype.html 的创建行程功能
 * 无工具栏，全屏显示原型页面
 * @module pages/PrototypeCreatePage
 */

import React, { useState } from 'react';
import './PrototypeEmbed.css';

/**
 * 创建行程页面组件 - 纯净嵌入
 * @returns {JSX.Element} 创建行程页面
 */
const PrototypeCreatePage = () => {
  const [loading, setLoading] = useState(true);

  // iframe 加载完成处理
  const handleIframeLoad = () => {
    setLoading(false);
  };

  return (
    <div className="prototype-clean-page prototype-fullscreen">
      {/* 加载状态 */}
      {loading && (
        <div className="prototype-clean-loading">
          <div className="loading-spinner"></div>
          <span className="loading-text">加载中...</span>
        </div>
      )}

      {/* iframe */}
      <iframe
        src="/itinerary-system-prototype.html"
        title="创建行程"
        className="prototype-clean-iframe"
        onLoad={handleIframeLoad}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals"
      />
    </div>
  );
};

export default PrototypeCreatePage;
