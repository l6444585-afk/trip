import React, { useState } from 'react';
import { Card, Button, Modal, message, Select, Input, Space, QRCode, Tag, Row, Col } from 'antd';
import { ShareAltOutlined, LinkOutlined, QrcodeOutlined, CopyOutlined, TwitterOutlined, WechatOutlined } from '@ant-design/icons';
import axios from 'axios';

const ItineraryShare = ({ itinerary }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [shareType, setShareType] = useState('link');
  const [sharePermission, setSharePermission] = useState('public');
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [qrCodeVisible, setQrCodeVisible] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`/api/itineraries/${itinerary.id}/share`, {
        type: shareType,
        permission: sharePermission,
        custom_message: customMessage
      });

      setShareLink(response.data.share_link);
      message.success('分享成功！');
      setModalVisible(false);
    } catch (error) {
      message.error('分享失败：' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    message.success('链接已复制到剪贴板');
  };

  const handleSocialShare = (platform) => {
    const shareUrls = {
      wechat: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareLink)}`,
      weibo: `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareLink)}`,
      qq: `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(shareLink)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(customMessage || itinerary.title)}&url=${encodeURIComponent(shareLink)}`
    };

    window.open(shareUrls[platform], '_blank');
  };

  const sharePermissionOptions = [
    { label: '公开', value: 'public', description: '所有人都可以查看' },
    { label: '私密', value: 'private', description: '仅自己可见' },
    { label: '指定好友', value: 'friends', description: '仅指定好友可见' }
  ];

  const shareTypeOptions = [
    { label: '链接分享', value: 'link', icon: <LinkOutlined /> },
    { label: '二维码', value: 'qrcode', icon: <QrcodeOutlined /> },
    { label: '社交媒体', value: 'social', icon: <ShareAltOutlined /> }
  ];

  return (
    <>
      <Button
        type="primary"
        icon={<ShareAltOutlined />}
        onClick={() => setModalVisible(true)}
      >
        分享行程
      </Button>

      <Modal
        title="分享行程"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            取消
          </Button>,
          <Button key="share" type="primary" onClick={handleShare} loading={loading}>
            确认分享
          </Button>
        ]}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label style={{ marginBottom: 8, fontWeight: 'bold' }}>
              分享方式：
            </label>
            <Select
              value={shareType}
              onChange={setShareType}
              style={{ width: '100%' }}
            >
              {shareTypeOptions.map(option => (
                <Select.Option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <label style={{ marginBottom: 8, fontWeight: 'bold' }}>
              分享权限：
            </label>
            <Select
              value={sharePermission}
              onChange={setSharePermission}
              style={{ width: '100%' }}
            >
              {sharePermissionOptions.map(option => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {option.description}
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div>

          {shareType === 'link' && (
            <div>
              <label style={{ marginBottom: 8, fontWeight: 'bold' }}>
                自定义消息：
              </label>
              <Input.TextArea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="输入分享消息（可选）"
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </div>
          )}

          {shareLink && (
            <Card style={{ marginTop: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
              <h4>分享链接</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Input
                  value={shareLink}
                  readOnly
                  style={{ flex: 1 }}
                />
                <Button
                  icon={<CopyOutlined />}
                  onClick={handleCopyLink}
                >
                  复制
                </Button>
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ marginBottom: 8, fontWeight: 'bold' }}>
                  二维码：
                </label>
                <Button
                  icon={<QrcodeOutlined />}
                  onClick={() => setQrCodeVisible(true)}
                >
                  生成二维码
                </Button>
              </div>
            </Card>
          )}

          {shareType === 'social' && (
            <Card style={{ marginTop: 16, backgroundColor: '#e6f7ff', borderRadius: 8 }}>
              <h4>社交媒体分享</h4>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Button
                    icon={<WechatOutlined />}
                    onClick={() => handleSocialShare('wechat')}
                    block
                    style={{ height: 80, fontSize: 16 }}
                  >
                    微信
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    icon={<ShareAltOutlined />}
                    onClick={() => handleSocialShare('weibo')}
                    block
                    style={{ height: 80, fontSize: 16 }}
                  >
                    微博
                  </Button>
                </Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Button
                    icon={<TwitterOutlined />}
                    onClick={() => handleSocialShare('twitter')}
                    block
                    style={{ height: 80, fontSize: 16 }}
                  >
                    Twitter
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    icon={<LinkOutlined />}
                    onClick={() => handleSocialShare('qq')}
                    block
                    style={{ height: 80, fontSize: 16 }}
                  >
                    QQ
                  </Button>
                </Col>
              </Row>
            </Card>
          )}

          <Card style={{ marginTop: 16, backgroundColor: '#fff7e6', borderRadius: 8 }}>
            <h4>分享说明</h4>
            <p style={{ marginBottom: 8 }}>
              <strong>链接分享</strong>：生成唯一分享链接，可以通过任何方式发送给朋友
            </p>
            <p style={{ marginBottom: 8 }}>
              <strong>二维码</strong>：生成二维码图片，方便扫码查看
            </p>
            <p style={{ marginBottom: 8 }}>
              <strong>社交媒体</strong>：直接分享到微信、微博、Twitter 等平台
            </p>
            <p style={{ color: '#999', fontSize: 12 }}>
              注意：分享权限设置后，只有授权用户才能查看行程
            </p>
          </Card>
        </Space>
      </Modal>

      <Modal
        title="二维码"
        open={qrCodeVisible}
        onCancel={() => setQrCodeVisible(false)}
        footer={[
          <Button key="close" onClick={() => setQrCodeVisible(false)}>
            关闭
          </Button>,
          <Button key="download" type="primary" onClick={() => message.success('下载功能开发中')}>
            下载
          </Button>
        ]}
      >
        <div style={{ textAlign: 'center', padding: 20 }}>
          <QRCode
            value={shareLink}
            size={256}
            style={{ marginBottom: 16 }}
          />
          <p style={{ color: '#999', fontSize: 12 }}>
            扫描二维码查看行程详情
          </p>
        </div>
      </Modal>
    </>
  );
};

export default ItineraryShare;
