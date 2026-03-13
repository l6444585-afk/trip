/**
 * 行程列表项组件
 * @module modules/itinerary/components/ItineraryListItem
 */

import React from 'react';
import { Card, Tag, Badge, Rate, Progress, Dropdown, Space, Typography, Row, Col } from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  MoreOutlined
} from '@ant-design/icons';
import type { Itinerary } from '../types';
import {
  getStatusColor,
  getStatusText,
  getCompanionColor,
  getCompanionIcon,
  getInterestColor,
  getDestinationImage,
  formatCurrency,
  getRelativeTime,
  calculateProgress
} from '../utils/itineraryUtils';

const { Text } = Typography;

interface ItineraryListItemProps {
  itinerary: Itinerary;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  onExport: () => void;
  actionMenu: { items: any[] };
}

/**
 * 行程列表项组件
 * 以列表形式展示行程概要信息
 */
export const ItineraryListItem: React.FC<ItineraryListItemProps> = ({
  itinerary,
  onView,
  onEdit,
  onDelete,
  onShare,
  onExport,
  actionMenu
}) => {
  const progress = calculateProgress(itinerary);
  const interests = itinerary.interests?.split(',') || [];

  return (
    <Card
      hoverable
      className="itinerary-list-item"
      style={{ marginBottom: 16 }}
    >
      <Row gutter={[16, 16]} align="middle">
        {/* 封面图 */}
        <Col xs={24} sm={6} md={5} lg={4}>
          <div
            style={{
              height: 120,
              backgroundImage: `url(${getDestinationImage(itinerary.destinations)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 8,
              position: 'relative'
            }}
          >
            <div style={{
              position: 'absolute',
              top: 8,
              left: 8
            }}>
              <Badge
                status={getStatusColor(itinerary.status) as any}
                text={getStatusText(itinerary.status)}
              />
            </div>
          </div>
        </Col>

        {/* 信息区域 */}
        <Col xs={24} sm={12} md={13} lg={16}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Text strong style={{ fontSize: 16 }}>
              {itinerary.title}
            </Text>

            <Space wrap>
              <Tag color={getCompanionColor(itinerary.companion_type)}>
                {getCompanionIcon(itinerary.companion_type)} {itinerary.companion_type}
              </Tag>
              <Tag color="blue">{itinerary.days} 天</Tag>
              {itinerary.destinations?.slice(0, 3).map((dest, idx) => (
                <Tag key={idx} style={{ fontSize: 12 }}>{dest}</Tag>
              ))}
            </Space>

            {interests.length > 0 && (
              <Space wrap>
                {interests.slice(0, 4).map((interest, idx) => (
                  <Tag
                    key={idx}
                    style={{
                      fontSize: 11,
                      color: getInterestColor(interest as any),
                      borderColor: getInterestColor(interest as any)
                    }}
                  >
                    {interest}
                  </Tag>
                ))}
              </Space>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Text strong style={{ fontSize: 18, color: '#f5222d' }}>
                {formatCurrency(itinerary.budget)}
              </Text>
              <Rate disabled defaultValue={4.5} style={{ fontSize: 14 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {getRelativeTime(itinerary.created_at)}
              </Text>
            </div>

            {itinerary.status === 'ongoing' && progress > 0 && (
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12 }}>行程进度</Text>
                  <Text style={{ fontSize: 12, color: '#1890ff' }}>{progress}%</Text>
                </div>
                <Progress percent={progress} size="small" showInfo={false} strokeColor="#1890ff" />
              </div>
            )}
          </Space>
        </Col>

        {/* 操作按钮 */}
        <Col xs={24} sm={6} md={6} lg={4}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space wrap>
              <EyeOutlined onClick={onView} style={{ fontSize: 18, cursor: 'pointer', color: '#1890ff' }} title="查看" />
              <EditOutlined onClick={onEdit} style={{ fontSize: 18, cursor: 'pointer', color: '#52c41a' }} title="编辑" />
              <ShareAltOutlined onClick={onShare} style={{ fontSize: 18, cursor: 'pointer', color: '#722ed1' }} title="分享" />
              <DownloadOutlined onClick={onExport} style={{ fontSize: 18, cursor: 'pointer', color: '#fa8c16' }} title="导出" />
              <DeleteOutlined onClick={onDelete} style={{ fontSize: 18, cursor: 'pointer', color: '#ff4d4f' }} title="删除" />
            </Space>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ItineraryListItem;
