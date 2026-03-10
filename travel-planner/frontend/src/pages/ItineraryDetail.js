/**
 * 行程详情页面组件
 * 展示单个行程的详细信息，支持编辑、删除、导出和AI对话功能
 * @module pages/ItineraryDetail
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Modal, Form, Input, message, Tabs, List, Tag, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, DownloadOutlined, MessageOutlined } from '@ant-design/icons';
import axios from 'axios';

import MapVisualization from '../components/MapVisualization';
import { API_ENDPOINTS, PERIOD_MAP } from '../constants';
import { generateItineraryText, groupSchedulesByDay, downloadFile } from '../utils';

const { TabPane } = Tabs;

/**
 * 行程详情页面组件
 * @returns {JSX.Element} 行程详情页面
 */
const ItineraryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [form] = Form.useForm();

  /**
   * 获取行程详情
   */
  const fetchItinerary = useCallback(async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.ITINERARIES}/${id}`);
      setItinerary(response.data);
      form.setFieldsValue({
        title: response.data.title,
        days: response.data.days,
        budget: response.data.budget,
        departure: response.data.departure
      });
    } catch (error) {
      message.error('获取行程失败');
    } finally {
      setLoading(false);
    }
  }, [id, form]);

  useEffect(() => {
    fetchItinerary();
  }, [fetchItinerary]);

  /**
   * 处理行程更新
   * @param {Object} values - 表单值
   */
  const handleUpdate = async (values) => {
    try {
      await axios.put(`${API_ENDPOINTS.ITINERARIES}/${id}`, {
        title: values.title,
        days: values.days,
        budget: values.budget,
        departure: values.departure,
        companion_type: itinerary.companion_type,
        interests: itinerary.interests.split(',')
      });
      message.success('更新成功');
      setEditModalVisible(false);
      fetchItinerary();
    } catch (error) {
      message.error('更新失败');
    }
  };

  /**
   * 处理行程删除
   */
  const handleDelete = async () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个行程吗？',
      onOk: async () => {
        try {
          await axios.delete(`${API_ENDPOINTS.ITINERARIES}/${id}`);
          message.success('删除成功');
          navigate('/itineraries');
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  /**
   * 处理行程导出
   */
  const handleExport = () => {
    const content = generateItineraryText(itinerary);
    downloadFile(content, `${itinerary.title}.txt`);
    message.success('行程导出成功！');
  };

  /**
   * 处理发送聊天消息
   */
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await axios.post(API_ENDPOINTS.CHAT, {
        question: chatInput,
        itinerary_id: parseInt(id),
        chat_history: chatMessages
      });
      setChatMessages([...newMessages, { role: 'assistant', content: response.data.answer }]);
    } catch (error) {
      message.error('发送消息失败');
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return <Spin size="large" className="page-loading" />;
  }

  if (!itinerary) {
    return <div className="empty-state">行程不存在</div>;
  }

  const groupedSchedules = groupSchedulesByDay(itinerary.schedules);

  return (
    <div className="itinerary-detail-page">
      <Space className="page-actions">
        <h2>{itinerary.title}</h2>
        <Button icon={<EditOutlined />} onClick={() => setEditModalVisible(true)}>
          编辑
        </Button>
        <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>
          删除
        </Button>
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          导出
        </Button>
        <Button icon={<MessageOutlined />} onClick={() => setChatModalVisible(true)}>
          AI 助手
        </Button>
      </Space>

      <Card className="info-card">
        <Descriptions column={2}>
          <Descriptions.Item label="出行天数">{itinerary.days} 天</Descriptions.Item>
          <Descriptions.Item label="预算">{itinerary.budget} 元</Descriptions.Item>
          <Descriptions.Item label="出发地">{itinerary.departure}</Descriptions.Item>
          <Descriptions.Item label="同行人员">
            <Tag color="blue">{itinerary.companion_type}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="兴趣偏好" span={2}>
            {itinerary.interests.split(',').map((interest, index) => (
              <Tag key={index} color="green">{interest}</Tag>
            ))}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs defaultActiveKey="1" className="detail-tabs">
        <TabPane tab="行程详情" key="1">
          {Object.keys(groupedSchedules)
            .sort((a, b) => a - b)
            .map((day) => (
              <Card key={day} title={`第 ${day} 天`} className="day-card">
                <List
                  dataSource={groupedSchedules[day]}
                  renderItem={(schedule) => {
                    const period = PERIOD_MAP[schedule.period];
                    return (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Tag color={period.color}>{period.label}</Tag>}
                          title={schedule.activity}
                          description={
                            <div>
                              <div>📍 {schedule.location}</div>
                              {schedule.notes && <div>💡 {schedule.notes}</div>}
                            </div>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              </Card>
            ))}
        </TabPane>

        <TabPane tab="地图视图" key="2">
          <MapVisualization itinerary={itinerary} />
        </TabPane>
      </Tabs>

      <Modal
        title="编辑行程"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item label="行程标题" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="出行天数" name="days" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item label="预算" name="budget" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item label="出发地" name="departure" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setEditModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="AI 智能助手"
        open={chatModalVisible}
        onCancel={() => setChatModalVisible(false)}
        footer={null}
        width={700}
      >
        <div className="chat-container">
          {chatMessages.length === 0 && (
            <p className="chat-placeholder">开始提问吧！</p>
          )}
          {chatMessages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.role}`}>
              <div className="message-content">{msg.content}</div>
            </div>
          ))}
          {chatLoading && <p className="chat-loading">AI 正在思考...</p>}
        </div>
        <Input.TextArea
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="输入您的问题...（Shift+Enter 换行）"
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
        <Button
          type="primary"
          className="send-button"
          onClick={handleSendMessage}
          loading={chatLoading}
        >
          发送
        </Button>
      </Modal>
    </div>
  );
};

export default ItineraryDetail;
