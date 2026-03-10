# 江浙沪旅游行程规划系统 - 设计系统文档

## 概述

本设计系统基于GLM-4.7的前端视觉审美优势,融合江浙沪地域文化特色与当代UI设计趋势,提供一致、美观、易用的用户界面组件。

## 设计原则

### 1. 视觉平衡
- 采用16:9黄金比例作为基础布局参考
- 确保元素间距遵循8px网格系统
- 保持视觉重心的合理分布

### 2. 配色和谐
- 主色调: 翡翠绿(#2E8B57) - 象征江南山水
- 辅助色: 水蓝(#4A90A4) - 代表江河湖海
- 强调色: 竹黄(#E8B86D) - 体现江南文化
- 中性色: 墨黑(#1a1a1a) - 传承书法艺术

### 3. 字体层级
- 标题层级: 48px/40px/32px/28px/24px/20px/18px
- 正文字体: 14px/15px/16px
- 辅助文字: 12px/13px
- 字重: 400/500/600/700

### 4. 留白设计
- 紧凑间距: 4px/8px/12px
- 标准间距: 16px/20px/24px
- 宽松间距: 32px/40px/48px/64px

## 颜色系统

### 主色调
```css
--jade-green: #2E8B57;        /* 翡翠绿 */
--jade-light: #4CAF50;        /* 浅翡翠 */
--jade-dark: #1B5E20;         /* 深翡翠 */
```

### 辅助色
```css
--water-blue: #4A90A4;       /* 水蓝 */
--water-light: #64B5F6;       /* 浅水蓝 */
--water-deep: #1565C0;        /* 深水蓝 */
```

### 强调色
```css
--bamboo-yellow: #E8B86D;     /* 竹黄 */
--bamboo-light: #FFD54F;      /* 浅竹黄 */
```

### 中性色
```css
--ink-black: #1a1a1a;         /* 墨黑 */
--ink-dark: #2d2d2d;          /* 深墨 */
--ink-gray: #5a5a5a;          /* 墨灰 */
--ink-light: #8a8a8a;          /* 浅墨灰 */
--paper-white: #FAFAFA;       /* 宣纸白 */
--paper-cream: #FFF8E1;       /* 米黄纸 */
```

### 渐变色
```css
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
--success-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
--warning-gradient: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
```

## 排版系统

### 字体家族
```css
--font-family: 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### 字体大小
```css
--font-size-xs: 12px;         /* 辅助文字 */
--font-size-sm: 13px;         /* 小号文字 */
--font-size-base: 14px;       /* 基准文字 */
--font-size-md: 15px;         /* 中号文字 */
--font-size-lg: 16px;         /* 大号文字 */
--font-size-xl: 18px;         /* 超大号 */
--font-size-2xl: 20px;        /* 标题6 */
--font-size-3xl: 24px;        /* 标题5 */
--font-size-4xl: 28px;        /* 标题4 */
--font-size-5xl: 32px;        /* 标题3 */
--font-size-6xl: 40px;        /* 标题2 */
--font-size-7xl: 48px;        /* 标题1 */
```

### 字重
```css
--font-weight-normal: 400;     /* 常规 */
--font-weight-medium: 500;     /* 中等 */
--font-weight-semibold: 600;  /* 半粗 */
--font-weight-bold: 700;       /* 粗体 */
```

### 行高
```css
--line-height-tight: 1.25;    /* 紧凑 */
--line-height-normal: 1.5;    /* 常规 */
--line-height-relaxed: 1.75;  /* 宽松 */
```

## 间距系统

### 基础间距
```css
--spacing-xs: 4px;             /* 极小间距 */
--spacing-sm: 8px;            /* 小间距 */
--spacing-md: 12px;           /* 中间距 */
--spacing-lg: 16px;           /* 标准间距 */
--spacing-xl: 20px;           /* 大间距 */
--spacing-2xl: 24px;          /* 超大间距 */
--spacing-3xl: 32px;          /* 特大间距 */
--spacing-4xl: 40px;          /* 巨大间距 */
--spacing-5xl: 48px;          /* 超巨大间距 */
--spacing-6xl: 64px;          /* 最大间距 */
```

## 圆角系统

```css
--radius-xs: 4px;              /* 极小圆角 */
--radius-sm: 8px;              /* 小圆角 */
--radius-md: 12px;            /* 中圆角 */
--radius-lg: 16px;            /* 大圆角 */
--radius-xl: 20px;            /* 超大圆角 */
--radius-2xl: 24px;           /* 巨大圆角 */
--radius-full: 9999px;        /* 完全圆角 */
```

## 阴影系统

```css
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.16);
--shadow-2xl: 0 24px 64px rgba(0, 0, 0, 0.2);
```

## 动画系统

### 过渡时长
```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slower: 500ms cubic-bezier(0.4, 0, 0.2, 1);
```

### 动画效果
- `fade-in`: 淡入效果
- `fade-in-up`: 向上淡入
- `fade-in-down`: 向下淡入
- `slide-in-left`: 从左侧滑入
- `slide-in-right`: 从右侧滑入
- `scale-in`: 缩放进入
- `bounce-in`: 弹跳进入

## 组件库

### 按钮

#### 主按钮
```jsx
<button className="btn btn-primary">主要按钮</button>
```

#### 次要按钮
```jsx
<button className="btn btn-secondary">次要按钮</button>
```

#### 幽灵按钮
```jsx
<button className="btn btn-ghost">幽灵按钮</button>
```

#### 按钮尺寸
```jsx
<button className="btn btn-primary btn-sm">小按钮</button>
<button className="btn btn-primary">默认按钮</button>
<button className="btn btn-primary btn-lg">大按钮</button>
```

### 卡片

#### 基础卡片
```jsx
<div className="card">
  <h3>卡片标题</h3>
  <p>卡片内容</p>
</div>
```

#### 悬浮卡片
```jsx
<div className="card card-elevated">
  <h3>悬浮卡片</h3>
  <p>悬停时会有更明显的阴影效果</p>
</div>
```

### 输入框

```jsx
<input 
  type="text" 
  className="input" 
  placeholder="请输入内容"
/>
```

### 标签

```jsx
<span className="tag">默认标签</span>
<span className="tag tag-primary">主要标签</span>
<span className="tag tag-success">成功标签</span>
<span className="tag tag-warning">警告标签</span>
```

### 徽章

```jsx
<span className="badge">5</span>
```

### 头像

```jsx
<div className="avatar">A</div>
<div className="avatar avatar-sm">小</div>
<div className="avatar avatar-lg">大</div>
<div className="avatar avatar-xl">超大</div>
```

### 进度条

```jsx
<div className="progress">
  <div className="progress-bar" style={{ width: '60%' }}></div>
</div>
```

### 骨架屏

```jsx
<div className="skeleton" style={{ width: '100%', height: 20 }}></div>
```

## 实用工具类

### 文本处理
- `truncate`: 文本截断
- `line-clamp-2`: 限制2行
- `line-clamp-3`: 限制3行
- `text-gradient`: 渐变文字
- `visually-hidden`: 视觉隐藏
- `sr-only`: 屏幕阅读器专用

### 布局
- `container`: 容器
- `container-sm`: 小容器(768px)
- `container-md`: 中容器(1024px)
- `container-lg`: 大容器(1280px)
- `container-xl`: 超大容器(1536px)

### 交互效果
- `hover-lift`: 悬浮上浮
- `hover-scale`: 悬浮缩放
- `hover-glow`: 悬浮发光

### 视觉效果
- `glass`: 玻璃态效果
- `glass-dark`: 深色玻璃态
- `bg-gradient`: 渐变背景
- `border-gradient`: 渐变边框

### 滚动条
- `scrollbar-hide`: 隐藏滚动条
- `scrollbar-thin`: 细滚动条

### 宽高比
- `aspect-ratio-16-9`: 16:9比例
- `aspect-ratio-4-3`: 4:3比例
- `aspect-ratio-1-1`: 1:1比例
- `aspect-ratio-3-4`: 3:4比例

## 响应式设计

### 断点
- `xs`: 0px - 640px
- `sm`: 640px - 768px
- `md`: 768px - 1024px
- `lg`: 1024px - 1280px
- `xl`: 1280px - 1536px
- `2xl`: 1536px+

### 媒体查询
```css
@media (max-width: 1536px) { /* xl */ }
@media (max-width: 1280px) { /* lg */ }
@media (max-width: 1024px) { /* md */ }
@media (max-width: 768px) { /* sm */ }
@media (max-width: 640px) { /* xs */ }
```

## 无障碍访问

### ARIA支持
- 所有交互元素提供适当的ARIA标签
- 焦点状态清晰可见
- 键盘导航完全支持
- 屏幕阅读器友好

### 对比度
- 文字与背景对比度至少4.5:1
- 大号文字(18px+)对比度至少3:1
- 交互元素对比度至少3:1

### 焦点管理
- 焦点指示器清晰可见
- Tab键导航逻辑合理
- 模态框焦点陷阱

## 性能优化

### 加载性能
- 首屏渲染时间 < 1秒
- 关键资源优先加载
- 图片懒加载
- 代码分割

### 渲染性能
- 使用CSS transform和opacity进行动画
- 避免强制同步布局
- 使用will-change优化动画
- 虚拟滚动长列表

### 资源优化
- 图片压缩和格式优化
- 字体子集化
- CSS和JS压缩
- 启用浏览器缓存

## 浏览器兼容性

### 支持的浏览器
- Chrome/Edge: 最新2个版本
- Firefox: 最新2个版本
- Safari: 最新2个版本
- iOS Safari: iOS 14+
- Android Chrome: Android 10+

### 降级策略
- 渐进增强
- 优雅降级
- Polyfill支持
- 功能检测

## 使用指南

### 引入设计系统
```jsx
import './styles/design-system.css';
```

### 自定义主题
```css
:root {
  --jade-green: #your-color;
  --font-size-base: 16px;
}
```

### 组件示例
```jsx
<div className="container">
  <div className="card card-elevated fade-in">
    <h2 className="text-gradient">标题</h2>
    <p>内容</p>
    <button className="btn btn-primary">按钮</button>
  </div>
</div>
```

## 最佳实践

1. **一致性**: 始终使用设计系统提供的变量和组件
2. **可访问性**: 确保所有用户都能使用你的产品
3. **性能**: 优先考虑加载和渲染性能
4. **响应式**: 设计要适配各种设备尺寸
5. **可维护性**: 保持代码清晰和模块化

## 更新日志

### v1.0.0 (2024)
- 初始版本发布
- 完整的设计系统
- 基础组件库
- 响应式支持
- 无障碍访问支持
