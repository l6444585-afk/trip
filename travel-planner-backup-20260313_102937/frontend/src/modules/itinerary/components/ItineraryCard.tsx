/**
 * 行程卡片组件
 * @module modules/itinerary/components/ItineraryCard
 */

import React from 'react';
import { Card, Tag, Badge, Rate, Progress, Dropdown, Space, Typography } from 'antd';
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

interface ItineraryCardProps {
  itinerary: Itinerary;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  onExport: () => void;
  actionMenu: { items: any[] };
}

/**
 * 行程卡片组件
 * 以卡片形式展示行程概要信息
 */
export const ItineraryCard: React.FC<ItineraryCardProps> = ({
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
      className="itinerary-card"
      cover={
        <div
          className="itinerary-card-cover"
          style={{
            height: 180,
            backgroundImage: `url(${getDestinationImage(itinerary.destinations)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
          }}
        >
          {/* 状态标签 */}
          <div className="itinerary-status-badge">
            <Badge
              status={getStatusColor(itinerary.status) as any}
              text={getStatusText(itinerary.status)}
            />
          </div>

          {/* 标题遮罩 */}
          <div className="itinerary-card-title-mask">
            <Text className="itinerary-card-title" style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
              {itinerary.title}
            </Text>
          </div>
        </div>
      }
      actions={[
        <span key="view" onClick={onView} title="查看" style={{ cursor: 'pointer' }}><EyeOutlined /></span>,
        <span key="edit" onClick={onEdit} title="编辑" style={{ cursor: 'pointer' }}><EditOutlined /></span>,
        <span key="share" onClick={onShare} title="分享" style={{ cursor: 'pointer' }}><ShareAltOutlined /></span>,
        <span key="export" onClick={onExport} title="导出" style={{ cursor: 'pointer' }}><DownloadOutlined /></span>,
        <span key="delete" onClick={onDelete} title="删除" style={{ cursor: 'pointer', color: '#ff4d4f' }}><DeleteOutlined /></span>
      ]}
    >
      <div className="itinerary-card-content">
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          {/* 基本信息 */}
          <div className="itinerary-card-meta">
            <Space>
              <Tag color={getCompanionColor(itinerary.companion_type)}>
                {getCompanionIcon(itinerary.companion_type)} {itinerary.companion_type}
              </Tag>
              <Tag color="blue">{itinerary.days} 天</Tag>
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {getRelativeTime(itinerary.created_at)}
            </Text>
          </div>

          {/* 目的地 */}
          {itinerary.destinations && itinerary.destinations.length > 0 && (
            <div className="itinerary-card-destinations">
              {itinerary.destinations.slice(0, 3).map((dest, idx) => (
                <Tag key={idx} style={{ fontSize: 12, margin: '0 4px 4px 0' }}>
                  {dest}
                </Tag>
              ))}
              {itinerary.destinations.length > 3 && (
                <Tag style={{ fontSize: 12 }}>+{itinerary.destinations.length - 3}</Tag>
              )}
            </div>
          )}

          {/* 预算和评分 */}
          <div className="itinerary-card-footer">
            <Text strong style={{ fontSize: 16, color: '#f5222d' }}>
              {formatCurrency(itinerary.budget)}
            </Text>
            <Rate disabled defaultValue={4.5} style={{ fontSize: 14 }} />
          </div>

          {/* 兴趣标签 */}
          {interests.length > 0 && (
            <div className="itinerary-card-interests">
              {interests.slice(0, 3).map((interest, idx) => (
                <Tag
                  key={idx}
                  style={{
                    fontSize: 11,
                    margin: '0 4px 4px 0',
                    color: getInterestColor(interest as any),
                    borderColor: getInterestColor(interest as any)
                  }}
                >
                  {interest}
                </Tag>
              ))}
            </div>
          )}

          {/* 行程进度 */}
          {itinerary.status === 'ongoing' && progress > 0 && (
            <div className="itinerary-card-progress">
              <div className="progress-header">
                <Text style={{ fontSize: 12 }}>行程进度</Text>
                <Text style={{ fontSize: 12, color: '#1890ff' }}>{progress}%</Text>
              </div>
              <Progress percent={progress} size="small" showInfo={false} strokeColor="#1890ff" />
            </div>
          )}
        </Space>
      </div>
    </Card>
  );
};

export default ItineraryCard;
