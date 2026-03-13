/**
 * 分享弹窗组件
 * @module modules/itinerary/components/ShareModal
 */

import React, { useState } from 'react';
import {
  Modal,
  Button,
  Radio,
  Space,
  Typography,
  Input,
  message,
  Card,
  Row,
  Col
} from 'antd';
import {
  ShareAltOutlined,
  LinkOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  GlobalOutlined,
  LockOutlined,
  KeyOutlined,
  CopyOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import type { Itinerary } from '../types';
import { copyToClipboard } from '../utils/itineraryUtils';

const { Title, Text, Paragraph } = Typography;

interface ShareModalProps {
  visible: boolean;
  itinerary: Itinerary | null;
  onClose: () => void;
}

type ShareType = 'link' | 'pdf' | 'image';
type PermissionType = 'public' | 'private' | 'password';

/**
 * 分享弹窗组件
 */
export const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  itinerary,
  onClose
}) => {
  const [shareType, setShareType] = useState<ShareType>('link');
  const [permission, setPermission] = useState<PermissionType>('public');
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  if (!itinerary) return null;

  // 生成分享链接
  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    const shareId = btoa(`${itinerary.id}-${Date.now()}`).replace(/=/g, '');
    return `${baseUrl}/share/${shareId}`;
  };

  const shareLink = generateShareLink();

  // 处理复制链接
  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareLink);
    if (success) {
      setCopied(true);
      message.success('链接已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } else {
      message.error('复制失败，请手动复制');
    }
  };

  // 处理生成分享
  const handleGenerateShare = async () => {
    setGenerating(true);
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    setGenerating(false);
    message.success('分享链接已生成');
  };

  // 渲染分享类型选项
  const renderShareTypeOptions = () => (
    <Radio.Group
      value={shareType}
      onChange={(e) => setShareType(e.target.value)}
      style={{ width: '100%' }}
    >
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Radio.Button value="link" style={{ width: '100%', height: 80, textAlign: 'center' }}>
            <Space direction="vertical" size={4}>
              <LinkOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <Text>链接分享</Text>
            </Space>
          </Radio.Button>
        </Col>
        <Col span={8}>
          <Radio.Button value="pdf" style={{ width: '100%', height: 80, textAlign: 'center' }}>
            <Space direction="vertical" size={4}>
              <FilePdfOutlined style={{ fontSize: 24, color: '#f5222d' }} />
              <Text>PDF导出</Text>
            </Space>
          </Radio.Button>
        </Col>
        <Col span={8}>
          <Radio.Button value="image" style={{ width: '100%', height: 80, textAlign: 'center' }}>
            <Space direction="vertical" size={4}>
              <FileImageOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              <Text>图片分享</Text>
            </Space>
          </Radio.Button>
        </Col>
      </Row>
    </Radio.Group>
  );

  // 渲染权限选项
  const renderPermissionOptions = () => (
    <Radio.Group
      value={permission}
      onChange={(e) => setPermission(e.target.value)}
      style={{ width: '100%' }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Radio value="public">
          <Space>
            <GlobalOutlined style={{ color: '#52c41a' }} />
            <div>
              <Text strong>公开访问</Text>
              <Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
                任何人都可以通过链接访问
              </Paragraph>
            </div>
          </Space>
        </Radio>
        <Radio value="private">
          <Space>
            <LockOutlined style={{ color: '#f5222d' }} />
            <div>
              <Text strong>私密访问</Text>
              <Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
                只有您可以访问
              </Paragraph>
            </div>
          </Space>
        </Radio>
        <Radio value="password">
          <Space align="start">
            <KeyOutlined style={{ color: '#faad14' }} />
            <div>
              <Text strong>密码保护</Text>
              <Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
                需要输入密码才能访问
              </Paragraph>
              {permission === 'password' && (
                <Input.Password
                  placeholder="设置访问密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ marginTop: 8, width: 200 }}
                />
              )}
            </div>
          </Space>
        </Radio>
      </Space>
    </Radio.Group>
  );

  // 渲染链接分享内容
  const renderLinkShare = () => (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Card size="small" title="分享设置">
        {renderPermissionOptions()}
      </Card>

      <Card size="small" title="分享链接">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input.Group compact>
            <Input
              value={shareLink}
              readOnly
              style={{ width: 'calc(100% - 100px)' }}
            />
            <Button
              type="primary"
              icon={copied ? <CheckCircleOutlined /> : <CopyOutlined />}
              onClick={handleCopyLink}
            >
              {copied ? '已复制' : '复制'}
            </Button>
          </Input.Group>
          <Text type="secondary" style={{ fontSize: 12 }}>
            链接有效期为 30 天
          </Text>
        </Space>
      </Card>
    </Space>
  );

  // 渲染PDF导出内容
  const renderPdfShare = () => (
    <Card size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={5}>{itinerary.title}</Title>
        <Paragraph type="secondary">
          将行程导出为PDF文件，包含完整的日程安排和预算信息。
        </Paragraph>
        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          loading={generating}
          onClick={handleGenerateShare}
          block
        >
          生成PDF文件
        </Button>
      </Space>
    </Card>
  );

  // 渲染图片分享内容
  const renderImageShare = () => (
    <Card size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={5}>{itinerary.title}</Title>
        <Paragraph type="secondary">
          生成精美的行程分享卡片，适合分享到社交媒体。
        </Paragraph>
        <Button
          type="primary"
          icon={<FileImageOutlined />}
          loading={generating}
          onClick={handleGenerateShare}
          block
        >
          生成分享卡片
        </Button>
      </Space>
    </Card>
  );

  return (
    <Modal
      title={
        <Space>
          <ShareAltOutlined style={{ color: '#667eea' }} />
          <span>分享行程</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="share"
          type="primary"
          icon={<ShareAltOutlined />}
          onClick={handleGenerateShare}
          loading={generating}
        >
          生成分享
        </Button>
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={24}>
        <div>
          <Title level={5} style={{ marginBottom: 16 }}>选择分享方式</Title>
          {renderShareTypeOptions()}
        </div>

        <div>
          {shareType === 'link' && renderLinkShare()}
          {shareType === 'pdf' && renderPdfShare()}
          {shareType === 'image' && renderImageShare()}
        </div>
      </Space>
    </Modal>
  );
};

export default ShareModal;
