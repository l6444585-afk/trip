/**
 * 行程详情弹窗组件
 * @module modules/itinerary/components/ItineraryDetailModal
 */

import React from 'react';
import {
  Modal,
  Card,
  Tag,
  Badge,
  Rate,
  Timeline,
  Space,
  Typography,
  Row,
  Col,
  Button,
  Divider,
  Empty
} from 'antd';
import {
  EditOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  TagOutlined,
  ClockCircleOutlined
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
  formatDate,
  calculateProgress
} from '../utils/itineraryUtils';

const { Title, Text, Paragraph } = Typography;

interface ItineraryDetailModalProps {
  visible: boolean;
  itinerary: Itinerary | null;
  onClose: () => void;
  onEdit: (id: number) => void;
  onShare: (itinerary: Itinerary) => void;
  onExport: (itinerary: Itinerary) => void;
}

/**
 * 行程详情弹窗组件
 */
export const ItineraryDetailModal: React.FC<ItineraryDetailModalProps> = ({
  visible,
  itinerary,
  onClose,
  onEdit,
  onShare,
  onExport
}) => {
  if (!itinerary) return null;

  const progress = calculateProgress(itinerary);
  const interests = itinerary.interests?.split(',') || [];
  const schedules = itinerary.schedules || [];

  // 按天分组日程
  const schedulesByDay = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.day]) {
      acc[schedule.day] = [];
    }
    acc[schedule.day].push(schedule);
    return acc;
  }, {} as Record<number, typeof schedules>);

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
        <Button
          key="share"
          icon={<ShareAltOutlined />}
          onClick={() => onShare(itinerary)}
        >
          分享
        </Button>,
        <Button
          key="export"
          icon={<DownloadOutlined />}
          onClick={() => onExport(itinerary)}
        >
          导出
        </Button>,
        <Button
          key="edit"
          type="primary"
          icon={<EditOutlined />}
          onClick={() => onEdit(itinerary.id)}
        >
          编辑
        </Button>
      ]}
    >
      <div style={{ marginBottom: 24 }}>
        {/* 头部信息 */}
        <div
          style={{
            height: 200,
            backgroundImage: `url(${getDestinationImage(itinerary.destinations)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: 8,
            position: 'relative',
            marginBottom: 16
          }}
        >
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
            padding: '40px 20px 20px',
            borderRadius: '0 0 8px 8px'
          }}>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>
              {itinerary.title}
            </Title>
            <Space style={{ marginTop: 8 }}>
              <Badge
                status={getStatusColor(itinerary.status) as any}
                text={<span style={{ color: '#fff' }}>{getStatusText(itinerary.status)}</span>}
              />
              <Rate disabled defaultValue={4.5} style={{ fontSize: 14 }} />
            </Space>
          </div>
        </div>

        {/* 基本信息 */}
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card size="small">
              <Space direction="vertical" size={4}>
                <Text type="secondary"><EnvironmentOutlined /> 出发地</Text>
                <Text strong>{itinerary.departure}</Text>
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small">
              <Space direction="vertical" size={4}>
                <Text type="secondary"><CalendarOutlined /> 行程天数</Text>
                <Text strong>{itinerary.days} 天</Text>
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small">
              <Space direction="vertical" size={4}>
                <Text type="secondary"><TeamOutlined /> 同行人员</Text>
                <Tag color={getCompanionColor(itinerary.companion_type)}>
                  {getCompanionIcon(itinerary.companion_type)} {itinerary.companion_type}
                </Tag>
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small">
              <Space direction="vertical" size={4}>
                <Text type="secondary"><DollarOutlined /> 预算</Text>
                <Text strong style={{ color: '#f5222d', fontSize: 18 }}>
                  {formatCurrency(itinerary.budget)}
                </Text>
              </Space>
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* 目的地 */}
        {itinerary.destinations && itinerary.destinations.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Title level={5}><EnvironmentOutlined /> 目的地</Title>
            <Space wrap>
              {itinerary.destinations.map((dest, idx) => (
                <Tag key={idx} color="blue">{dest}</Tag>
              ))}
            </Space>
          </div>
        )}

        {/* 兴趣标签 */}
        {interests.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Title level={5}><TagOutlined /> 兴趣标签</Title>
            <Space wrap>
              {interests.map((interest, idx) => (
                <Tag
                  key={idx}
                  style={{
                    color: getInterestColor(interest as any),
                    borderColor: getInterestColor(interest as any)
                  }}
                >
                  {interest}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* 行程进度 */}
        {itinerary.status === 'ongoing' && (
          <div style={{ marginBottom: 16 }}>
            <Title level={5}>行程进度</Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>已完成 {progress}%</Text>
                  <Text>{formatDate(itinerary.start_date)} - {formatDate(itinerary.end_date)}</Text>
                </div>
                {/* Progress bar would go here */}
              </div>
            </div>
          </div>
        )}

        <Divider />

        {/* 日程安排 */}
        <div>
          <Title level={5}><ClockCircleOutlined /> 日程安排</Title>
          {Object.keys(schedulesByDay).length > 0 ? (
            Object.entries(schedulesByDay).map(([day, daySchedules]) => (
              <Card key={day} size="small" style={{ marginBottom: 16 }} title={`第 ${day} 天`}>
                <Timeline
                  items={daySchedules.map(schedule => ({
                    children: (
                      <div>
                        <Text strong>{schedule.activity}</Text>
                        <div>
                          <Text type="secondary">{schedule.location}</Text>
                        </div>
                        {schedule.notes && (
                          <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                            {schedule.notes}
                          </Paragraph>
                        )}
                      </div>
                    )
                  }))}
                />
              </Card>
            ))
          ) : (
            <Empty description="暂无日程安排" />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ItineraryDetailModal;
