/**
 * 行程导出模态框组件
 * @module modules/itinerary/components/ExportModal
 */

import React, { useState, useRef } from 'react';
import {
  Modal,
  Button,
  Radio,
  Slider,
  message,
  Spin
} from 'antd';
import {
  DownloadOutlined,
  FileTextOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  CalendarOutlined,
  PictureOutlined,
  BgColorsOutlined,
  ExpandOutlined,
  SlidersOutlined,
  LoadingOutlined,
  CloseOutlined
} from '@ant-design/icons';
import type { Itinerary } from '../types';
import {
  exportAsHTML,
  exportAsExcel,
  exportAsCalendar,
  exportAsTXT,
  generateImageDataUrl,
  downloadImage
} from '../utils/exportUtils';
import './ExportModal.css';

interface ExportModalProps {
  visible: boolean;
  itinerary: Itinerary | null;
  onClose: () => void;
}

type ExportFormat = 'html' | 'excel' | 'image' | 'calendar' | 'txt';
type ImageTemplate = 'classic' | 'poster' | 'minimal' | 'journey';
type ImageSize = 'square' | 'portrait' | 'landscape' | 'story';
type ImageTheme = 'purple' | 'blue' | 'green' | 'orange' | 'dark' | 'red';
type ImageFormat = 'png' | 'jpg';

const colorThemes = [
  { key: 'purple' as ImageTheme, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', name: '紫韵' },
  { key: 'blue' as ImageTheme, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', name: '蓝天' },
  { key: 'green' as ImageTheme, gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', name: '绿意' },
  { key: 'orange' as ImageTheme, gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', name: '暖阳' },
  { key: 'dark' as ImageTheme, gradient: 'linear-gradient(135deg, #2c3e50 0%, #4a6741 100%)', name: '深邃' },
  { key: 'red' as ImageTheme, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', name: '热情' }
];

/**
 * 行程导出模态框组件
 */
export const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  itinerary,
  onClose
}) => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('html');
  const [imageTemplate, setImageTemplate] = useState<ImageTemplate>('classic');
  const [imageSize, setImageSize] = useState<ImageSize>('square');
  const [imageTheme, setImageTheme] = useState<ImageTheme>('purple');
  const [imageFormat, setImageFormat] = useState<ImageFormat>('png');
  const [imageQuality, setImageQuality] = useState<number>(2);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [showImageExport, setShowImageExport] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!itinerary) {
      message.warning('请先选择要导出的行程');
      return;
    }

    try {
      let success = false;
      
      switch (exportFormat) {
        case 'html':
          success = exportAsHTML(itinerary);
          if (success) {
            message.success('HTML行程单已导出');
            onClose();
          } else {
            message.error('HTML导出失败，请重试');
          }
          break;
        case 'excel':
          success = exportAsExcel(itinerary);
          if (success) {
            message.success('Excel表格已导出');
            onClose();
          } else {
            message.error('Excel导出失败，请重试');
          }
          break;
        case 'calendar':
          success = exportAsCalendar(itinerary);
          if (success) {
            message.success('日历文件已导出');
            onClose();
          } else {
            message.error('日历导出失败，请重试');
          }
          break;
        case 'txt':
          success = exportAsTXT(itinerary);
          if (success) {
            message.success('文本文件已导出');
            onClose();
          } else {
            message.error('文本导出失败，请重试');
          }
          break;
        case 'image':
          setShowImageExport(true);
          break;
        default:
          message.warning('请选择导出格式');
      }
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败，请重试');
    }
  };

  const handleDownloadImage = async () => {
    if (!itinerary) {
      message.warning('行程数据不存在');
      return;
    }
    
    if (!previewRef.current) {
      message.error('预览区域未加载，请稍后重试');
      return;
    }

    setGeneratingImage(true);
    try {
      const dataUrl = await generateImageDataUrl(
        previewRef.current,
        imageFormat,
        imageQuality
      );
      
      const timestamp = Date.now();
      const filename = `行程卡片-${itinerary.title}-${timestamp}.${imageFormat}`;
      const success = downloadImage(dataUrl, filename);
      
      if (success) {
        message.success('图片已导出');
        setShowImageExport(false);
        onClose();
      } else {
        message.error('图片下载失败，请重试');
      }
    } catch (error) {
      console.error('图片生成失败:', error);
      message.error('图片生成失败，请重试');
    } finally {
      setGeneratingImage(false);
    }
  };

  // 返回主导出界面
  const handleBackToExport = () => {
    setShowImageExport(false);
  };

  // 获取当前主题
  const currentTheme = colorThemes.find(t => t.key === imageTheme) || colorThemes[0];

  // 获取尺寸样式
  const getSizeStyle = () => {
    switch (imageSize) {
      case 'square':
        return { width: '400px', height: '400px' };
      case 'portrait':
        return { width: '400px', height: '533px' };
      case 'landscape':
        return { width: '533px', height: '300px' };
      case 'story':
        return { width: '300px', height: '533px' };
      default:
        return { width: '400px', height: '400px' };
    }
  };

  // 渲染导出预览卡片
  const renderExportPreview = () => {
    if (!itinerary) return null;

    return (
      <div className="export-preview-card">
        <div className="export-preview-header">
          <div className="export-preview-title">{itinerary.title}</div>
          <div className="export-preview-subtitle">
            {itinerary.departure} → {(itinerary.destinations || []).join('、')}
          </div>
        </div>
        <div className="export-preview-stats">
          <div className="export-preview-stat">
            <div className="export-preview-stat-value">{itinerary.days}</div>
            <div className="export-preview-stat-label">天</div>
          </div>
          <div className="export-preview-stat">
            <div className="export-preview-stat-value">
              ¥{(itinerary.budget / 1000).toFixed(1)}k
            </div>
            <div className="export-preview-stat-label">预算</div>
          </div>
          <div className="export-preview-stat">
            <div className="export-preview-stat-value">{itinerary.companion_type}</div>
            <div className="export-preview-stat-label">同行</div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染图片预览
  const renderImagePreview = () => {
    if (!itinerary) return null;

    const sizeStyle = getSizeStyle();

    return (
      <div
        ref={previewRef}
        className={`image-preview-card template-${imageTemplate}`}
        style={{
          background: currentTheme.gradient,
          width: sizeStyle.width,
          height: sizeStyle.height,
          borderRadius: '16px',
          padding: '32px',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
      >
        {imageTemplate === 'classic' && (
          <>
            <div className="preview-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>
              ✈️
            </div>
            <h2 style={{ color: 'white', marginBottom: '8px', fontSize: '24px' }}>
              {itinerary.title}
            </h2>
            <p style={{ opacity: 0.9, marginBottom: '24px', fontSize: '14px' }}>
              {itinerary.departure} → {(itinerary.destinations || []).join('、')}
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              width: '100%',
              marginTop: '24px'
            }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{itinerary.days}</div>
                <div style={{ opacity: 0.8, fontSize: '12px' }}>天</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.15)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                  ¥{(itinerary.budget / 1000).toFixed(1)}k
                </div>
                <div style={{ opacity: 0.8, fontSize: '12px' }}>预算</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.15)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{itinerary.companion_type}</div>
                <div style={{ opacity: 0.8, fontSize: '12px' }}>同行</div>
              </div>
            </div>
          </>
        )}

        {imageTemplate === 'poster' && (
          <>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🌏</div>
            <h1 style={{ color: 'white', marginBottom: '16px', fontSize: '32px', fontWeight: 'bold' }}>
              {itinerary.title}
            </h1>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '12px 24px',
              borderRadius: '24px',
              marginBottom: '24px'
            }}>
              {(itinerary.destinations || []).join(' · ')}
            </div>
            <div style={{ display: 'flex', gap: '32px', marginTop: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{itinerary.days}</div>
                <div style={{ opacity: 0.8, fontSize: '12px' }}>天行程</div>
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.3)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
                  ¥{itinerary.budget.toLocaleString()}
                </div>
                <div style={{ opacity: 0.8, fontSize: '12px' }}>总预算</div>
              </div>
            </div>
          </>
        )}

        {imageTemplate === 'minimal' && (
          <>
            <div style={{ marginBottom: '32px' }}>
              <span style={{ fontSize: '14px', opacity: 0.8 }}>TRAVEL PLAN</span>
            </div>
            <h1 style={{ color: 'white', marginBottom: '8px', fontSize: '36px', fontWeight: '300', letterSpacing: '2px' }}>
              {itinerary.title}
            </h1>
            <div style={{ width: '60px', height: '2px', background: 'white', margin: '24px auto' }} />
            <div style={{ fontSize: '16px', opacity: 0.9, marginBottom: '8px' }}>
              {itinerary.days} 天 · {itinerary.companion_type}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '16px' }}>
              ¥{itinerary.budget.toLocaleString()}
            </div>
          </>
        )}

        {imageTemplate === 'journey' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <div style={{ fontSize: '32px' }}>📍</div>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>出发地</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{itinerary.departure}</div>
              </div>
              <div style={{ fontSize: '24px' }}>→</div>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>目的地</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                  {(itinerary.destinations || [])[0] || '未知'}
                </div>
              </div>
            </div>
            <h2 style={{ color: 'white', marginBottom: '24px', fontSize: '28px' }}>
              {itinerary.title}
            </h2>
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              width: '100%',
              marginTop: '24px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>天数</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{itinerary.days}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>预算</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                  ¥{(itinerary.budget / 1000).toFixed(1)}k
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>同行</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{itinerary.companion_type}</div>
              </div>
            </div>
          </>
        )}

        <div style={{
          position: 'absolute',
          bottom: '16px',
          fontSize: '10px',
          opacity: 0.6
        }}>
          Travel Planner · 江浙沪旅游行程规划
        </div>
      </div>
    );
  };

  // 主导出界面
  const renderMainExport = () => (
    <>
      {renderExportPreview()}
      
      <p className="export-hint">选择导出格式，将行程保存为美观易读的文档</p>
      
      <Radio.Group
        value={exportFormat}
        onChange={(e) => setExportFormat(e.target.value)}
        className="export-options"
      >
        <Radio.Button value="html" className="export-option">
          <div className="export-option-content">
            <FileTextOutlined className="export-icon html" />
            <div className="export-info">
              <h4>精美行程单 (HTML)</h4>
              <p>可打印为PDF，适合保存和分享</p>
            </div>
          </div>
        </Radio.Button>
        
        <Radio.Button value="txt" className="export-option">
          <div className="export-option-content">
            <FileTextOutlined className="export-icon txt" />
            <div className="export-info">
              <h4>文本文件 (TXT)</h4>
              <p>简洁的文本格式，适合阅读和编辑</p>
            </div>
          </div>
        </Radio.Button>
        
        <Radio.Button value="excel" className="export-option">
          <div className="export-option-content">
            <FileExcelOutlined className="export-icon excel" />
            <div className="export-info">
              <h4>Excel表格</h4>
              <p>详细的预算和行程表格，适合编辑</p>
            </div>
          </div>
        </Radio.Button>
        
        <Radio.Button value="image" className="export-option">
          <div className="export-option-content">
            <FileImageOutlined className="export-icon image" />
            <div className="export-info">
              <h4>分享卡片 (图片)</h4>
              <p>精美的分享卡片，适合社交媒体</p>
            </div>
          </div>
        </Radio.Button>
        
        <Radio.Button value="calendar" className="export-option">
          <div className="export-option-content">
            <CalendarOutlined className="export-icon calendar" />
            <div className="export-info">
              <h4>日历文件</h4>
              <p>导入到日历应用，设置提醒</p>
            </div>
          </div>
        </Radio.Button>
      </Radio.Group>
    </>
  );

  // 图片导出界面
  const renderImageExport = () => (
    <div className="image-export-layout">
      <div className="image-preview-section">
        <div className="image-preview-wrapper">
          {renderImagePreview()}
        </div>
      </div>

      <div className="image-export-controls">
        <div className="control-section">
          <div className="control-section-title">
            <PictureOutlined /> 布局模板
          </div>
          <Radio.Group
            value={imageTemplate}
            onChange={(e) => setImageTemplate(e.target.value)}
            buttonStyle="solid"
            size="small"
          >
            <Radio.Button value="classic">经典卡片</Radio.Button>
            <Radio.Button value="poster">海报风格</Radio.Button>
            <Radio.Button value="minimal">极简风格</Radio.Button>
            <Radio.Button value="journey">旅程地图</Radio.Button>
          </Radio.Group>
        </div>

        <div className="control-section">
          <div className="control-section-title">
            <ExpandOutlined /> 图片尺寸
          </div>
          <Radio.Group
            value={imageSize}
            onChange={(e) => setImageSize(e.target.value)}
            buttonStyle="solid"
            size="small"
          >
            <Radio.Button value="square">1:1 方形</Radio.Button>
            <Radio.Button value="portrait">3:4 竖版</Radio.Button>
            <Radio.Button value="landscape">16:9 横版</Radio.Button>
            <Radio.Button value="story">9:16 故事</Radio.Button>
          </Radio.Group>
        </div>

        <div className="control-section">
          <div className="control-section-title">
            <BgColorsOutlined /> 色彩主题
          </div>
          <div className="color-theme-options">
            {colorThemes.map(theme => (
              <div
                key={theme.key}
                className={`color-theme ${imageTheme === theme.key ? 'selected' : ''}`}
                style={{ background: theme.gradient }}
                onClick={() => setImageTheme(theme.key)}
                title={theme.name}
              />
            ))}
          </div>
        </div>

        <div className="control-section">
          <div className="control-section-title">
            <FileImageOutlined /> 导出格式
          </div>
          <Radio.Group
            value={imageFormat}
            onChange={(e) => setImageFormat(e.target.value)}
            buttonStyle="solid"
            size="small"
          >
            <Radio.Button value="png">PNG 高清</Radio.Button>
            <Radio.Button value="jpg">JPG 压缩</Radio.Button>
          </Radio.Group>
        </div>

        <div className="control-section">
          <div className="control-section-title">
            <SlidersOutlined /> 图片质量
          </div>
          <Slider
            min={1}
            max={3}
            step={1}
            value={imageQuality}
            onChange={setImageQuality}
            marks={{
              1: { label: <span style={{ fontSize: '12px' }}>标准</span> },
              2: { label: <span style={{ fontSize: '12px' }}>高清</span> },
              3: { label: <span style={{ fontSize: '12px' }}>超清</span> }
            }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      title={
        <span className="modal-title">
          {showImageExport ? (
            <>
              <PictureOutlined style={{ color: '#667eea', marginRight: '8px' }} />
              导出为图片
            </>
          ) : (
            <>
              <DownloadOutlined style={{ color: '#667eea', marginRight: '8px' }} />
              导出行程
            </>
          )}
        </span>
      }
      open={visible}
      onCancel={onClose}
      width={showImageExport ? 900 : 600}
      footer={
        showImageExport ? (
          <>
            <Button onClick={handleBackToExport}>返回</Button>
            <Button
              type="primary"
              icon={generatingImage ? <LoadingOutlined /> : <DownloadOutlined />}
              onClick={handleDownloadImage}
              loading={generatingImage}
            >
              下载图片
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>取消</Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              确认导出
            </Button>
          </>
        )
      }
      className="export-modal"
    >
      {showImageExport ? renderImageExport() : renderMainExport()}
    </Modal>
  );
};

export default ExportModal;
