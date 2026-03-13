import React from 'react';
import { Tag, Space } from 'antd';
import { 
  EnvironmentOutlined, 
  CameraOutlined, 
  CoffeeOutlined, 
  CompassOutlined,
  CameraFilled,
  SafetyOutlined,
  TeamOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

const iconMap = {
  EnvironmentOutlined,
  CameraOutlined,
  CoffeeOutlined,
  CompassOutlined,
  CameraFilled,
  SafetyOutlined,
  TeamOutlined,
  ThunderboltOutlined
};

const InterestTags = ({ selectedTags, onTagChange, tags }) => {
  const getIcon = (iconName) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent /> : null;
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
        选择您的兴趣标签
      </h3>
      <Space size={[8, 16]} wrap>
        {tags.map((tag) => (
          <Tag
            key={tag.label}
            color={selectedTags.includes(tag.label) ? tag.color : 'default'}
            icon={getIcon(tag.icon)}
            style={{
              padding: '6px 12px',
              fontSize: 14,
              cursor: 'pointer',
              borderRadius: 16,
              transition: 'all 0.3s',
              border: selectedTags.includes(tag.label) ? `1px solid ${tag.color}` : '1px solid #d9d9d9'
            }}
            onClick={() => onTagChange(tag.label)}
          >
            {tag.label}
          </Tag>
        ))}
      </Space>
    </div>
  );
};

export default InterestTags;
