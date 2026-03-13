import React from 'react';
import { Radio, Space, Typography } from 'antd';
import { 
  ThunderboltOutlined, 
  SafetyOutlined, 
  CameraOutlined, 
  TeamOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

const iconMap = {
  ThunderboltOutlined,
  SafetyOutlined,
  CameraOutlined,
  TeamOutlined
};

const TravelStyleSelector = ({ selectedStyle, onStyleChange, styles }) => {
  const getIcon = (iconName) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent /> : null;
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <Text strong style={{ display: 'block', marginBottom: 12 }}>
        选择旅行风格
      </Text>
      <Radio.Group 
        value={selectedStyle} 
        onChange={(e) => onStyleChange(e.target.value)}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          {styles.map((style) => (
            <Radio 
              key={style.value} 
              value={style.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: 12,
                border: selectedStyle === style.value ? `2px solid ${style.color}` : '2px solid #e8e8e8',
                background: selectedStyle === style.value ? `${style.color}10` : '#fff',
                transition: 'all 0.3s',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: `${style.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  {React.cloneElement(getIcon(style.icon), { style: { color: style.color, fontSize: 18 } })}
                </div>
                <div>
                  <Text strong style={{ display: 'block' }}>{style.label}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {style.value === '冒险型' && '追求刺激，挑战自我'}
                    {style.value === '休闲型' && '轻松惬意，享受生活'}
                    {style.value === '文化深度型' && '深入了解，文化体验'}
                    {style.value === '亲子型' && '家庭出游，亲子互动'}
                  </Text>
                </div>
              </div>
            </Radio>
          ))}
        </Space>
      </Radio.Group>
    </div>
  );
};

export default TravelStyleSelector;
