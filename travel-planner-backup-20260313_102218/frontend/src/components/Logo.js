import React from 'react';
import '../styles/logo.css';

/**
 * 江浙沪旅游Logo组件
 * 设计灵感：融合江南水乡、山水、竹叶元素
 * 体现江浙沪地域特色与旅游主题
 */
const Logo = ({ size = 'medium', showText = true, className = '', darkMode = false }) => {
  const sizeMap = {
    small: { width: 28, height: 28, fontSize: 14 },
    medium: { width: 36, height: 36, fontSize: 18 },
    large: { width: 48, height: 48, fontSize: 24 },
    xlarge: { width: 64, height: 64, fontSize: 32 }
  };

  const { width, height, fontSize } = sizeMap[size] || sizeMap.medium;

  return (
    <div className={`logo-container ${className}`}>
      <div className="logo-icon-wrapper" style={{ width, height }}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="logo-svg"
        >
          <defs>
            {/* 渐变定义 */}
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2E8B57" />
              <stop offset="50%" stopColor="#4CAF50" />
              <stop offset="100%" stopColor="#66BB6A" />
            </linearGradient>
            
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4A90A4" />
              <stop offset="100%" stopColor="#64B5F6" />
            </linearGradient>
            
            <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#607D8B" />
              <stop offset="100%" stopColor="#90A4AE" />
            </linearGradient>
            
            <linearGradient id="sunsetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF7043" />
              <stop offset="100%" stopColor="#FFCA28" />
            </linearGradient>
            
            {/* 阴影滤镜 */}
            <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(46, 139, 87, 0.3)" />
            </filter>
            
            {/* 内发光 */}
            <filter id="innerGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* 背景圆形 */}
          <circle 
            cx="50" 
            cy="50" 
            r="46" 
            fill="url(#logoGradient)" 
            filter="url(#logoShadow)"
            className="logo-bg"
          />
          
          {/* 远山轮廓 */}
          <path
            d="M10 65 Q25 45 40 55 T70 50 T90 60 L90 90 L10 90 Z"
            fill="url(#mountainGradient)"
            opacity="0.6"
            className="logo-mountains"
          />
          
          {/* 水面波纹 */}
          <path
            d="M5 75 Q20 70 35 75 T65 75 T95 75 L95 95 L5 95 Z"
            fill="url(#waterGradient)"
            opacity="0.7"
            className="logo-water"
          />
          
          {/* 竹叶装饰 - 左侧 */}
          <g className="logo-bamboo-left">
            <path
              d="M20 35 Q18 25 22 18 Q24 25 22 35"
              fill="#81C784"
              opacity="0.9"
            />
            <path
              d="M15 40 Q12 30 17 22 Q19 30 17 40"
              fill="#A5D6A7"
              opacity="0.8"
            />
          </g>
          
          {/* 竹叶装饰 - 右侧 */}
          <g className="logo-bamboo-right">
            <path
              d="M80 35 Q82 25 78 18 Q76 25 78 35"
              fill="#81C784"
              opacity="0.9"
            />
            <path
              d="M85 40 Q88 30 83 22 Q81 30 83 40"
              fill="#A5D6A7"
              opacity="0.8"
            />
          </g>
          
          {/* 太阳/月亮 */}
          <circle
            cx="75"
            cy="25"
            r="12"
            fill="url(#sunsetGradient)"
            opacity="0.9"
            className="logo-sun"
          />
          
          {/* 中心建筑/亭台剪影 */}
          <g className="logo-pavilion">
            {/* 屋顶 */}
            <path
              d="M35 50 L50 35 L65 50 L62 50 L50 38 L38 50 Z"
              fill="#FFF8E1"
              opacity="0.95"
            />
            {/* 柱子 */}
            <rect x="38" y="50" width="3" height="15" fill="#FFF8E1" opacity="0.9" />
            <rect x="59" y="50" width="3" height="15" fill="#FFF8E1" opacity="0.9" />
            {/* 横梁 */}
            <rect x="38" y="58" width="24" height="2" fill="#FFF8E1" opacity="0.9" />
          </g>
          
          {/* 装饰性小点 */}
          <circle cx="30" cy="70" r="2" fill="#FFF" opacity="0.6" />
          <circle cx="70" cy="72" r="1.5" fill="#FFF" opacity="0.5" />
          <circle cx="50" cy="78" r="1" fill="#FFF" opacity="0.4" />
        </svg>
      </div>
      
      {showText && (
        <div className="logo-text-wrapper">
          <span className={`logo-text ${darkMode ? 'logo-text-dark' : ''}`} style={{ fontSize }}>
            江浙沪旅游
          </span>
          <span className={`logo-subtitle ${darkMode ? 'logo-subtitle-dark' : ''}`}>Jiang-Zhe-Hu Travel</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
