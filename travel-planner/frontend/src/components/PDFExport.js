import React, { useState } from 'react';
import { Button, message, Modal, Select, Card, Row, Col, Input, Space, Checkbox } from 'antd';
import { DownloadOutlined, FilePdfOutlined, PrinterOutlined } from '@ant-design/icons';

const PDFExport = ({ itinerary }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [loading, setLoading] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeMap, setIncludeMap] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      let content = '';
      
      const title = customTitle || itinerary.title;
      content += `${title}\n`;
      content += `出行天数：${itinerary.days} 天\n`;
      content += `预算：¥${itinerary.budget}\n`;
      content += `出发地：${itinerary.departure}\n`;
      content += `同行人员：${itinerary.companion_type}\n`;
      content += `兴趣偏好：${itinerary.interests}\n`;
      content += `创建时间：${new Date(itinerary.created_at).toLocaleString('zh-CN')}\n\n`;

      const groupedSchedules = {};
      itinerary.schedules?.forEach(schedule => {
        if (!groupedSchedules[schedule.day]) {
          groupedSchedules[schedule.day] = [];
        }
        groupedSchedules[schedule.day].push(schedule);
      });

      Object.keys(groupedSchedules).sort((a, b) => a - b).forEach(day => {
        content += `=== 第 ${day} 天 ===\n`;
        
        const periodMap = {
          morning: '上午',
          afternoon: '下午',
          evening: '晚上'
        };

        groupedSchedules[day].forEach(schedule => {
          const period = periodMap[schedule.period];
          content += `${period}（${schedule.time || '待定'}）\n`;
          content += `  活动：${schedule.activity}\n`;
          content += `  地点：${schedule.location}\n`;
          
          if (schedule.latitude && schedule.longitude && includeMap) {
            content += `  坐标：${schedule.latitude}, ${schedule.longitude}\n`;
          }
          
          if (includeNotes && schedule.notes) {
            content += `  备注：${schedule.notes}\n`;
          }
          
          content += '\n';
        });

        content += '\n';
      });

      if (exportFormat === 'pdf') {
        message.success('PDF 导出功能开发中，请使用浏览器打印功能保存为 PDF');
      } else {
        message.success('文本导出成功！');
      }

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title}.${exportFormat}`;
      link.click();
      URL.revokeObjectURL(url);
      
      setModalVisible(false);
      setLoading(false);
    } catch (error) {
      message.error('导出失败：' + error.message);
      setLoading(false);
    }
  };

  return (
    <Card
      title="行程导出"
      extra={
        <Button 
          type="primary" 
          icon={<DownloadOutlined />}
          onClick={() => setModalVisible(true)}
        >
          导出行程
        </Button>
      }
    >
      <Modal
        title="导出行程"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            取消
          </Button>,
          <Button key="export" type="primary" onClick={handleExport} loading={loading}>
            确认导出
          </Button>
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label style={{ marginBottom: 8, fontWeight: 'bold' }}>
              自定义标题：
            </label>
            <Input 
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="使用默认标题"
            />
          </div>

          <div>
            <label style={{ marginBottom: 8, fontWeight: 'bold' }}>
              导出格式：
            </label>
            <Select 
              value={exportFormat}
              onChange={setExportFormat}
              style={{ width: '100%' }}
            >
              <Select.Option value="pdf">PDF 文件</Select.Option>
              <Select.Option value="txt">文本文件</Select.Option>
            </Select>
          </div>

          <div>
            <label style={{ marginBottom: 8, fontWeight: 'bold' }}>
              包含内容：
            </label>
            <Space direction="vertical">
              <Checkbox 
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
              >
                包含备注
              </Checkbox>
              <Checkbox 
                checked={includeMap}
                onChange={(e) => setIncludeMap(e.target.checked)}
              >
                包含地图坐标
              </Checkbox>
            </Space>
          </div>

          <div style={{ marginTop: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
            <h4>导出说明</h4>
            <p style={{ marginBottom: 8 }}>
              <strong>PDF 导出</strong>：选择 PDF 格式后，点击确认导出，系统会生成文本内容，您可以使用浏览器的打印功能保存为 PDF 文件。
            </p>
            <p style={{ marginBottom: 8 }}>
              <strong>文本导出</strong>：选择文本格式后，系统会生成 .txt 文件，可以直接打开查看。
            </p>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Button 
                  icon={<FilePdfOutlined />}
                  onClick={() => setExportFormat('pdf')}
                  block
                >
                  PDF 文件
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => setExportFormat('txt')}
                  block
                >
                  文本文件
                </Button>
              </Col>
            </Row>
          </div>

          <div style={{ marginTop: 16, padding: 16, backgroundColor: '#e6f7ff', borderRadius: 8 }}>
            <h4>高级选项</h4>
            <Space direction="vertical">
              <Checkbox 
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
              >
                包含详细备注信息
              </Checkbox>
              <Checkbox 
                checked={includeMap}
                onChange={(e) => setIncludeMap(e.target.checked)}
              >
                包含景点坐标（用于地图标记）
              </Checkbox>
            </Space>
          </div>
        </Space>
      </Modal>
    </Card>
  );
};

export default PDFExport;
