import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Modal, Form, Input, message, Spin, Button, Space } from 'antd';
import {
  EditOutlined, DeleteOutlined, DownloadOutlined, MessageOutlined,
  ArrowLeftOutlined, CalendarOutlined, WalletOutlined, TeamOutlined,
  CompassOutlined, HeartOutlined, FileTextOutlined, Html5Outlined,
  TableOutlined, CloseOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { API_ENDPOINTS, PERIOD_MAP } from '../constants';
import { generateItineraryText, groupSchedulesByDay, downloadFile, formatCurrency } from '../utils';
import './ItineraryDetail.css';

const PERIOD_TIMES = { morning: '09:30', afternoon: '14:30', evening: '20:00' };
const PERIOD_CSS = { morning: 'period-morning', afternoon: 'period-afternoon', evening: 'period-evening' };

// 时间段自动分类
const getTimePeriodCss = (period) => {
  if (PERIOD_CSS[period]) return PERIOD_CSS[period];
  const t = period.replace(':', '');
  const num = parseInt(t, 10);
  if (isNaN(num)) return 'period-morning';
  if (num < 1200) return 'period-morning';
  if (num < 1700) return 'period-afternoon';
  return 'period-evening';
};
const getTimePeriodLabel = (period) => {
  if (period === 'morning') return '上午';
  if (period === 'afternoon') return '下午';
  if (period === 'evening') return '晚上';
  return '';  // 时间格式的 period 不需要额外标签
};
const isTimeFormat = (period) => /^\d{2}:\d{2}$/.test(period);

const KEY_PREFIXES = ['门票','交通','地址','游览时长','游玩时间','开放时间','预算参考','最佳旅游季节','穿衣建议','招牌','人均'];

const NotesBlock = ({ notes }) => {
  const [expanded, setExpanded] = React.useState(false);
  if (!notes) return null;

  const sentences = notes.split(/[。；]/).map(s => s.trim()).filter(Boolean);
  const keyItems = [];
  const descParts = [];

  sentences.forEach(s => {
    const matchedKey = KEY_PREFIXES.find(k => s.startsWith(k));
    const hasColon = /[：:]/.test(s);
    if (matchedKey && hasColon) {
      const parts = s.split(/[：:]/);
      const value = parts.slice(1).join('：');
      if (value.length <= 80) {
        keyItems.push({ label: parts[0], value });
      } else {
        descParts.push(s + '。');
      }
    } else if (s.length > 0) {
      descParts.push(s + '。');
    }
  });

  const descText = descParts.join('');
  const needCollapse = descText.length > 150;

  return (
    <>
      {descText && (
        <>
          <div className={`notes-summary${needCollapse && !expanded ? ' collapsed' : ''}`}>
            {descText}
          </div>
          {needCollapse && (
            <span className="notes-toggle" onClick={() => setExpanded(!expanded)}>
              {expanded ? '收起' : '查看详情'}
            </span>
          )}
        </>
      )}
      {keyItems.length > 0 && (
        <div className="notes-key-list">
          {keyItems.map((item, i) => (
            <div className="notes-key-row" key={i}>
              <span className="notes-key-label">{item.label}</span>
              <span className="notes-key-value">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

const ItineraryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchItinerary = useCallback(async () => {
    try {
      const res = await axios.get(`${API_ENDPOINTS.ITINERARIES}/${id}`);
      setItinerary(res.data);
      form.setFieldsValue({ title: res.data.title, days: res.data.days, budget: res.data.budget, departure: res.data.departure });
    } catch { message.error('获取行程失败'); }
    finally { setLoading(false); }
  }, [id, form]);

  useEffect(() => { fetchItinerary(); }, [fetchItinerary]);

  const handleUpdate = async (values) => {
    try {
      await axios.put(`${API_ENDPOINTS.ITINERARIES}/${id}`, {
        ...values, companion_type: itinerary.companion_type, interests: Array.isArray(itinerary.interests) ? itinerary.interests : (itinerary.interests ? itinerary.interests.split(',') : []),
      });
      message.success('更新成功');
      setEditModalVisible(false);
      fetchItinerary();
    } catch { message.error('更新失败'); }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除', content: '确定要删除这个行程吗？',
      okText: '删除', okType: 'danger', cancelText: '取消',
      onOk: async () => {
        try { await axios.delete(`${API_ENDPOINTS.ITINERARIES}/${id}`); message.success('删除成功'); navigate('/itineraries'); }
        catch { message.error('删除失败'); }
      },
    });
  };

  const handleExportTxt = () => {
    downloadFile(generateItineraryText(itinerary), `${itinerary.title}.txt`);
    message.success('TXT 导出成功');
    setExportModalVisible(false);
  };

  const handleExportHtml = () => {
    const grouped = groupSchedulesByDay(itinerary.schedules);
    const periodLabel = (p) => {
      if (p === 'morning') return '上午';
      if (p === 'afternoon') return '下午';
      if (p === 'evening') return '晚上';
      return '';
    };
    const periodTime = (p) => {
      const map = { morning: '09:30', afternoon: '14:30', evening: '20:00' };
      return map[p] || (/^\d{2}:\d{2}$/.test(p) ? p : '');
    };
    const periodColor = (p) => {
      const t = /^\d{2}:\d{2}$/.test(p) ? parseInt(p.replace(':', ''), 10) : null;
      if (p === 'morning' || (t !== null && t < 1200)) return { bg: '#fef3c7', color: '#d97706' };
      if (p === 'afternoon' || (t !== null && t < 1700)) return { bg: '#dbeafe', color: '#2563eb' };
      return { bg: '#ede9fe', color: '#7c3aed' };
    };
    const totalActivities = itinerary.schedules ? itinerary.schedules.length : 0;
    const interests = Array.isArray(itinerary.interests) ? itinerary.interests : (itinerary.interests ? itinerary.interests.split(',') : []);

    let daysHtml = '';
    Object.keys(grouped).sort((a, b) => a - b).forEach(day => {
      let itemsHtml = '';
      grouped[day].forEach(s => {
        const time = periodTime(s.period);
        const label = /^\d{2}:\d{2}$/.test(s.period) ? '' : periodLabel(s.period);
        const pc = periodColor(s.period);
        const labelTag = label
          ? `<span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:500;background:${pc.bg};color:${pc.color};margin-right:6px;">${label}</span>`
          : '';
        const notesHtml = s.notes
          ? s.notes.split(/[。；]/).filter(Boolean).map(line => {
              const trimmed = line.trim();
              const isKey = ['推荐','招牌','特色','门票','交通','天气','地址','游览时长','预算参考','最佳旅游季节','穿衣建议'].some(k => trimmed.startsWith(k));
              if (isKey) {
                const parts = trimmed.split(/[：:]/);
                return `<div><strong>${parts[0]}：</strong>${parts.slice(1).join('：')}</div>`;
              }
              return `<div>${trimmed}</div>`;
            }).join('')
          : '';
        itemsHtml += `
          <div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #f9fafb;">
            <div style="flex-shrink:0;width:50px;font-size:14px;font-weight:600;color:#6366f1;padding-top:2px;">${time}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:600;color:#1f2937;margin-bottom:4px;font-size:15px;">${labelTag}${s.activity}</div>
              <div style="font-size:14px;color:#6b7280;line-height:1.7;">
                ${s.location ? `<div><strong style="color:#374151;">地点：</strong>${s.location}</div>` : ''}
                ${notesHtml}
              </div>
            </div>
          </div>`;
      });
      daysHtml += `
        <div style="background:white;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);margin-bottom:24px;overflow:hidden;">
          <div style="padding:14px 20px;background:linear-gradient(135deg,#f9fafb,white);border-bottom:1px solid #f3f4f6;">
            <div style="font-size:18px;font-weight:700;color:#1f2937;">第 ${day} 天</div>
          </div>
          <div style="padding:12px 20px;">${itemsHtml}</div>
        </div>`;
    });

    const interestsHtml = interests.length > 0
      ? `<div style="margin-bottom:20px;">${interests.map(t =>
          `<span style="display:inline-block;padding:4px 12px;border-radius:9999px;font-size:13px;font-weight:500;background:rgba(99,102,241,0.1);color:#6366f1;margin:0 6px 6px 0;">${t.trim()}</span>`
        ).join('')}</div>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${itinerary.title} - 行程单</title>
<style>
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif; background:#f3f4f6; color:#1f2937; }
  * { box-sizing:border-box; }
</style>
</head>
<body>
<div style="max-width:800px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:20px;padding:40px 32px;color:white;margin-bottom:24px;position:relative;overflow:hidden;">
    <div style="position:absolute;top:0;right:0;width:200px;height:200px;background:rgba(255,255,255,0.05);border-radius:50%;transform:translate(30%,-30%);"></div>
    <div style="position:absolute;bottom:0;left:0;width:150px;height:150px;background:rgba(255,255,255,0.05);border-radius:50%;transform:translate(-30%,30%);"></div>
    <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;">${itinerary.title}</h1>
    <div style="display:flex;gap:20px;flex-wrap:wrap;font-size:14px;opacity:0.9;">
      <span>${itinerary.days} 天行程</span>
      <span>预算 ${formatCurrency(itinerary.budget)}</span>
      <span>出发地 ${itinerary.departure}</span>
      <span>${itinerary.companion_type}出行</span>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;">
    <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);text-align:center;">
      <div style="font-size:24px;font-weight:700;color:#6366f1;">${itinerary.days}</div>
      <div style="font-size:13px;color:#6b7280;">天</div>
    </div>
    <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);text-align:center;">
      <div style="font-size:24px;font-weight:700;color:#6366f1;">${formatCurrency(itinerary.budget)}</div>
      <div style="font-size:13px;color:#6b7280;">预算</div>
    </div>
    <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);text-align:center;">
      <div style="font-size:24px;font-weight:700;color:#6366f1;">${totalActivities}</div>
      <div style="font-size:13px;color:#6b7280;">活动</div>
    </div>
    <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);text-align:center;">
      <div style="font-size:24px;font-weight:700;color:#6366f1;">${itinerary.companion_type}</div>
      <div style="font-size:13px;color:#6b7280;">同行</div>
    </div>
  </div>

  ${interestsHtml}
  ${daysHtml}

  <div style="text-align:center;padding:20px 0;font-size:12px;color:#9ca3af;" class="no-print">
    由江浙沪旅游行程规划系统生成 &middot; ${new Date().toLocaleDateString('zh-CN')}
  </div>
</div>
</body>
</html>`;
    downloadFile(html, `${itinerary.title}.html`, 'text/html;charset=utf-8');
    message.success('HTML 行程单导出成功');
    setExportModalVisible(false);
  };

  const handleExportCsv = () => {
    const grouped = groupSchedulesByDay(itinerary.schedules);
    const periodLabel = (p) => {
      if (p === 'morning') return '上午';
      if (p === 'afternoon') return '下午';
      if (p === 'evening') return '晚上';
      return p;
    };
    const escCsv = (val) => {
      const s = String(val || '').replace(/"/g, '""');
      return `"${s}"`;
    };
    const BOM = '\uFEFF';
    let csv = BOM + '天数,时段,活动,地点,备注\n';
    Object.keys(grouped).sort((a, b) => a - b).forEach(day => {
      grouped[day].forEach(s => {
        csv += `${escCsv(`第${day}天`)},${escCsv(periodLabel(s.period))},${escCsv(s.activity)},${escCsv(s.location)},${escCsv(s.notes)}\n`;
      });
    });
    downloadFile(csv, `${itinerary.title}.csv`, 'text/csv;charset=utf-8');
    message.success('CSV 导出成功');
    setExportModalVisible(false);
  };

  const handleExportIcs = () => {
    const grouped = groupSchedulesByDay(itinerary.schedules);
    const periodHour = (p) => {
      if (p === 'morning') return 9;
      if (p === 'afternoon') return 14;
      if (p === 'evening') return 19;
      if (/^\d{2}:\d{2}$/.test(p)) return parseInt(p.split(':')[0], 10);
      return 9;
    };
    const periodMinute = (p) => {
      if (/^\d{2}:\d{2}$/.test(p)) return parseInt(p.split(':')[1], 10);
      if (p === 'morning') return 30;
      if (p === 'afternoon') return 30;
      return 0;
    };
    const pad = (n) => String(n).padStart(2, '0');
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 1);

    let events = '';
    Object.keys(grouped).sort((a, b) => a - b).forEach(day => {
      const eventDate = new Date(baseDate);
      eventDate.setDate(baseDate.getDate() + (parseInt(day, 10) - 1));
      const y = eventDate.getFullYear();
      const m = pad(eventDate.getMonth() + 1);
      const d = pad(eventDate.getDate());

      grouped[day].forEach(s => {
        const h = pad(periodHour(s.period));
        const min = pad(periodMinute(s.period));
        const endH = pad(Math.min(periodHour(s.period) + 2, 23));
        const dtStart = `${y}${m}${d}T${h}${min}00`;
        const dtEnd = `${y}${m}${d}T${endH}${min}00`;
        const desc = [s.location, s.notes].filter(Boolean).join('\\n').replace(/\n/g, '\\n');
        events += `BEGIN:VEVENT\r\nDTSTART:${dtStart}\r\nDTEND:${dtEnd}\r\nSUMMARY:${s.activity}\r\nDESCRIPTION:${desc}\r\n${s.location ? `LOCATION:${s.location}\r\n` : ''}END:VEVENT\r\n`;
      });
    });

    const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//TravelPlanner//CN\r\nCALSCALE:GREGORIAN\r\nX-WR-CALNAME:${itinerary.title}\r\n${events}END:VCALENDAR`;
    downloadFile(ics, `${itinerary.title}.ics`, 'text/calendar;charset=utf-8');
    message.success('ICS 日历文件导出成功');
    setExportModalVisible(false);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', content: chatInput };
    const msgs = [...chatMessages, userMsg];
    setChatMessages(msgs);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await axios.post(API_ENDPOINTS.CHAT, { question: chatInput, itinerary_id: parseInt(id), chat_history: chatMessages });
      setChatMessages([...msgs, { role: 'assistant', content: res.data.answer }]);
    } catch { message.error('发送失败'); }
    finally { setChatLoading(false); }
  };

  if (loading) {
    return <div className="proto-detail"><div className="loading-center"><Spin size="large" /></div></div>;
  }
  if (!itinerary) {
    return <div className="proto-detail"><div className="loading-center">行程不存在</div></div>;
  }

  const interests = Array.isArray(itinerary.interests) ? itinerary.interests : (itinerary.interests ? itinerary.interests.split(',') : []);
  const groupedSchedules = groupSchedulesByDay(itinerary.schedules);

  return (
    <div className="proto-detail">
      <div className="back-link" onClick={() => navigate('/itineraries')}>
        <ArrowLeftOutlined /> 返回我的行程
      </div>

      <div className="detail-header">
        <div className="detail-title">{itinerary.title}</div>
        <div className="detail-actions">
          <button className="p-btn" onClick={() => setEditModalVisible(true)}><EditOutlined /> 编辑</button>
          <button className="p-btn danger" onClick={handleDelete}><DeleteOutlined /> 删除</button>
          <button className="p-btn" onClick={() => setExportModalVisible(true)}><DownloadOutlined /> 导出</button>
          <button className="p-btn" onClick={() => setChatModalVisible(true)}><MessageOutlined /> AI助手</button>
        </div>
      </div>

      <div className="detail-stats">
        <div className="stat-card">
          <div className="stat-value">{itinerary.days}</div>
          <div className="stat-label"><CalendarOutlined /> 天</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(itinerary.budget)}</div>
          <div className="stat-label"><WalletOutlined /> 预算</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{itinerary.companion_type}</div>
          <div className="stat-label"><TeamOutlined /> 同行</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{itinerary.departure}</div>
          <div className="stat-label"><CompassOutlined /> 出发地</div>
        </div>
      </div>

      {interests.length > 0 && (
        <div className="detail-tags">
          <span className="detail-tags-title"><HeartOutlined /> 兴趣偏好</span>
          {interests.map((t, i) => <span className="p-tag" key={i}>{t.trim()}</span>)}
        </div>
      )}

      {Object.keys(groupedSchedules).sort((a, b) => a - b).map(day => (
        <div className="day-card" key={day}>
          <div className="day-header">
            <div className="day-title">第 {day} 天</div>
          </div>
          <div className="activity-list">
            {groupedSchedules[day].map((schedule, idx) => {
              const isTime = isTimeFormat(schedule.period);
              const displayTime = isTime ? schedule.period : (PERIOD_TIMES[schedule.period] || '');
              const periodCss = getTimePeriodCss(schedule.period);
              const periodLabel = isTime ? '' : getTimePeriodLabel(schedule.period);
              return (
                <div className="activity-item" key={idx}>
                  <div className="activity-time">{displayTime}</div>
                  <div className="activity-content">
                    <div className="activity-title">
                      {periodLabel && <span className={`period-tag ${periodCss}`}>{periodLabel}</span>}
                      {schedule.activity}
                    </div>
                    <div className="activity-desc">
                      {schedule.location && <div><strong>地点：</strong>{schedule.location}</div>}
                      <NotesBlock notes={schedule.notes} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <Modal title="编辑行程" open={editModalVisible} onCancel={() => setEditModalVisible(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item label="行程标题" name="title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="出行天数" name="days" rules={[{ required: true }]}><Input type="number" /></Form.Item>
          <Form.Item label="预算" name="budget" rules={[{ required: true }]}><Input type="number" /></Form.Item>
          <Form.Item label="出发地" name="departure" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item>
            <Space><Button type="primary" htmlType="submit">保存</Button><Button onClick={() => setEditModalVisible(false)}>取消</Button></Space>
          </Form.Item>
        </Form>
      </Modal>

      {exportModalVisible && (
        <div className="export-overlay" onClick={() => setExportModalVisible(false)}>
          <div className="export-modal" onClick={e => e.stopPropagation()}>
            <div className="export-modal-header">
              <h3>导出行程</h3>
              <button className="export-close-btn" onClick={() => setExportModalVisible(false)}><CloseOutlined /></button>
            </div>
            <p className="export-modal-desc">选择导出格式，将「{itinerary.title}」保存到本地</p>
            <div className="export-options">
              <div className="export-option" onClick={handleExportHtml}>
                <div className="export-option-icon html-icon"><Html5Outlined /></div>
                <div className="export-option-info">
                  <div className="export-option-title">HTML 精美行程单</div>
                  <div className="export-option-desc">生成可打印的精美行程单，包含渐变头部、每日时间线、完整活动详情</div>
                </div>
              </div>
              <div className="export-option" onClick={handleExportTxt}>
                <div className="export-option-icon txt-icon"><FileTextOutlined /></div>
                <div className="export-option-info">
                  <div className="export-option-title">TXT 纯文本</div>
                  <div className="export-option-desc">简洁的纯文本格式，方便复制粘贴和快速查看</div>
                </div>
              </div>
              <div className="export-option" onClick={handleExportCsv}>
                <div className="export-option-icon csv-icon"><TableOutlined /></div>
                <div className="export-option-info">
                  <div className="export-option-title">CSV 表格</div>
                  <div className="export-option-desc">可用 Excel / WPS 打开的表格文件，方便编辑和统计</div>
                </div>
              </div>
              <div className="export-option" onClick={handleExportIcs}>
                <div className="export-option-icon ics-icon"><CalendarOutlined /></div>
                <div className="export-option-info">
                  <div className="export-option-title">ICS 日历文件</div>
                  <div className="export-option-desc">导入手机 / 电脑日历，自动生成日程提醒</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal title="AI 智能助手" open={chatModalVisible} onCancel={() => setChatModalVisible(false)} footer={null} width={700}>
        <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 16, padding: '0 4px' }}>
          {chatMessages.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center', padding: 40 }}>开始提问吧！</p>}
          {chatMessages.map((msg, i) => (
            <div key={i} style={{
              marginBottom: 12, padding: '10px 14px', borderRadius: 12,
              background: msg.role === 'user' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#f3f4f6',
              color: msg.role === 'user' ? 'white' : '#374151',
              maxWidth: '80%', marginLeft: msg.role === 'user' ? 'auto' : 0,
            }}>{msg.content}</div>
          ))}
          {chatLoading && <p style={{ color: '#6366f1' }}>AI 正在思考...</p>}
        </div>
        <Input.TextArea value={chatInput} onChange={e => setChatInput(e.target.value)}
          onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
          placeholder="输入您的问题...（Shift+Enter 换行）" autoSize={{ minRows: 2, maxRows: 4 }} />
        <Button type="primary" onClick={handleSendMessage} loading={chatLoading}
          style={{ marginTop: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}>发送</Button>
      </Modal>
    </div>
  );
};

export default ItineraryDetail;
