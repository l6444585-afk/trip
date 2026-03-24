import React, { useState, useMemo } from 'react';
import { message, Spin } from 'antd';
import {
  EnvironmentOutlined, CalendarOutlined, StarFilled, CheckOutlined,
  HeartOutlined, TeamOutlined, UserOutlined, HomeOutlined, UsergroupAddOutlined,
  ThunderboltOutlined, CoffeeOutlined, CompassOutlined, CameraOutlined,
  SmileOutlined, BankOutlined, AimOutlined, StarOutlined,
  ArrowLeftOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DESTINATION_OPTIONS, API_ENDPOINTS } from '../constants';
import './ItineraryForm.css';

const INTERESTS = [
  { name: '自然风光', icon: <EnvironmentOutlined />, desc: '山川湖海，亲近大自然', color: '#10b981' },
  { name: '历史文化', icon: <BankOutlined />, desc: '古迹名胜，人文底蕴', color: '#6366f1' },
  { name: '美食购物', icon: <CoffeeOutlined />, desc: '美食打卡，购物天堂', color: '#f59e0b' },
  { name: '城市漫步', icon: <CompassOutlined />, desc: '都市风情，街头探索', color: '#3b82f6' },
  { name: '摄影打卡', icon: <CameraOutlined />, desc: '网红景点，摄影圣地', color: '#ec4899' },
  { name: '休闲度假', icon: <SmileOutlined />, desc: '放松身心，享受时光', color: '#14b8a6' },
  { name: '亲子游玩', icon: <TeamOutlined />, desc: '家庭欢乐，亲子互动', color: '#f97316' },
  { name: '户外探险', icon: <ThunderboltOutlined />, desc: '户外运动，挑战自我', color: '#ef4444' },
];

const COMPANIONS = [
  { name: '情侣', icon: <HeartOutlined />, desc: '浪漫之旅', color: '#ec4899' },
  { name: '亲子', icon: <TeamOutlined />, desc: '家庭欢乐', color: '#f97316' },
  { name: '独行', icon: <UserOutlined />, desc: '自由探索', color: '#3b82f6' },
  { name: '朋友', icon: <UsergroupAddOutlined />, desc: '结伴同行', color: '#10b981' },
  { name: '家庭', icon: <HomeOutlined />, desc: '全家出游', color: '#8b5cf6' },
];

const STYLES = [
  { name: '精品深度', icon: <AimOutlined />, desc: '深入体验，品质优先', color: '#6366f1' },
  { name: '高效紧凑', icon: <ThunderboltOutlined />, desc: '行程紧凑，高效游览', color: '#ef4444' },
  { name: '休闲放松', icon: <CoffeeOutlined />, desc: '慢节奏，享受当下', color: '#3b82f6' },
  { name: '丰富多样', icon: <StarOutlined />, desc: '体验多元，精彩纷呈', color: '#ec4899' },
];

const BUDGET_ITEMS = [
  { key: 'transport', label: '交通', pct: 0.25, color: '#3b82f6' },
  { key: 'accommodation', label: '住宿', pct: 0.35, color: '#8b5cf6' },
  { key: 'food', label: '餐饮', pct: 0.2, color: '#f59e0b' },
  { key: 'tickets', label: '门票', pct: 0.1, color: '#10b981' },
  { key: 'shopping', label: '购物', pct: 0.05, color: '#ec4899' },
  { key: 'other', label: '其他', pct: 0.05, color: '#6b7280' },
];

const TITLE_SUGGESTIONS = [
  '杭州西湖三日游', '上海都市风情游', '苏杭经典五日游', '南京历史文化游',
  '江浙沪精华七日游', '乌镇西塘古镇游', '舟山海岛度假游', '无锡太湖风光游',
  '扬州美食文化游', '绍兴水乡人文游', '莫干山休闲度假', '雁荡山自然探秘',
];

const DEPARTURE_SUGGESTIONS = [
  '上海', '杭州', '南京', '苏州', '无锡', '宁波', '合肥', '福州',
  '厦门', '武汉', '长沙', '南昌', '北京', '广州', '深圳', '成都',
];

const STEPS = [
  { num: 1, label: '基本信息' },
  { num: 2, label: '目的地选择' },
  { num: 3, label: '兴趣偏好' },
  { num: 4, label: '预算规划' },
];

const ItineraryForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', departure: '', startDate: '', endDate: '',
    destinations: [], interests: [], companion: '', style: '精品深度', budget: 3000,
  });

  const days = useMemo(() => {
    if (!form.startDate || !form.endDate) return 0;
    const diff = (new Date(form.endDate) - new Date(form.startDate)) / 86400000;
    return diff >= 0 ? diff + 1 : 0;
  }, [form.startDate, form.endDate]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleDest = (name) => {
    setForm(prev => {
      const has = prev.destinations.includes(name);
      if (has) return { ...prev, destinations: prev.destinations.filter(d => d !== name) };
      if (prev.destinations.length >= 3) { message.warning('最多选择3个目的地'); return prev; }
      return { ...prev, destinations: [...prev.destinations, name] };
    });
  };

  const toggleInterest = (name) => {
    setForm(prev => {
      const has = prev.interests.includes(name);
      return { ...prev, interests: has ? prev.interests.filter(i => i !== name) : [...prev.interests, name] };
    });
  };

  const validateStep = () => {
    if (step === 1 && (!form.title.trim() || !form.departure.trim())) {
      message.warning('请填写行程标题和出发地'); return false;
    }
    if (step === 2 && form.destinations.length === 0) {
      message.warning('请至少选择一个目的地'); return false;
    }
    if (step === 3 && form.interests.length === 0) {
      message.warning('请至少选择一个兴趣偏好'); return false;
    }
    if (step === 3 && !form.companion) {
      message.warning('请选择同行人员'); return false;
    }
    return true;
  };

  const nextStep = () => { if (validateStep()) setStep(s => Math.min(s + 1, 4)); };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await axios.post(API_ENDPOINTS.GENERATE_ITINERARY, {
        title: form.title || `${form.departure} → ${form.destinations.join('、')} ${days}日游`,
        days, budget: form.budget, departure: form.departure,
        companion_type: form.companion || '情侣', interests: form.interests,
        destinations: form.destinations, travel_style: form.style,
        date_range: form.startDate && form.endDate ? [form.startDate, form.endDate] : null,
      });
      if (res.data) { message.success('行程生成成功！'); navigate(`/itinerary/${res.data.itinerary_id}`); }
    } catch (err) {
      message.error(err.response?.data?.detail || '生成失败，请重试');
    } finally { setLoading(false); }
  };

  const renderStep1 = () => (
    <div className="step-content" key="s1">
      <div className="input-row">
        <div className="form-group">
          <label className="form-label"><EnvironmentOutlined /> 行程标题</label>
          <div className="input-with-clear">
            <input className="form-input" placeholder="选择或输入行程标题" list="title-suggestions"
              value={form.title} onChange={e => set('title', e.target.value)} />
            {form.title && <span className="input-clear-btn" onClick={() => set('title', '')}>&times;</span>}
          </div>
          <datalist id="title-suggestions">
            {TITLE_SUGGESTIONS.map(t => <option key={t} value={t} />)}
          </datalist>
        </div>
        <div className="form-group">
          <label className="form-label"><EnvironmentOutlined /> 出发地</label>
          <div className="input-with-clear">
            <input className="form-input" placeholder="选择或输入出发城市" list="departure-suggestions"
              value={form.departure} onChange={e => set('departure', e.target.value)} />
            {form.departure && <span className="input-clear-btn" onClick={() => set('departure', '')}>&times;</span>}
          </div>
          <datalist id="departure-suggestions">
            {DEPARTURE_SUGGESTIONS.map(d => <option key={d} value={d} />)}
          </datalist>
        </div>
      </div>
      <div className="date-section">
        <div className="date-grid">
          <div className="form-group">
            <label className="form-label"><CalendarOutlined /> 开始日期</label>
            <input type="date" className="form-input"
              value={form.startDate} onChange={e => set('startDate', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label"><CalendarOutlined /> 结束日期</label>
            <input type="date" className="form-input"
              value={form.endDate} onChange={e => set('endDate', e.target.value)} />
          </div>
        </div>
        <div className="days-card">
          <span className="days-icon"><CalendarOutlined /></span>
          <div className="days-label">行程总天数</div>
          <div className="days-value">{days > 0 ? days : '-'}</div>
          <div className="days-unit">{days > 0 ? '天' : '请选择日期'}</div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content" key="s2">
      <div className="form-group">
        <label className="form-label"><EnvironmentOutlined /> 选择目的地（可多选，最多3个） — 共{DESTINATION_OPTIONS.length}个城市</label>
        <div className="dest-grid">
          {DESTINATION_OPTIONS.map(dest => (
            <div key={dest.value}
              className={`dest-card${form.destinations.includes(dest.value) ? ' selected' : ''}`}
              onClick={() => toggleDest(dest.value)}>
              <div className="dest-image" style={{ backgroundImage: `url(${dest.image})` }}>
                <div className="dest-badge"><StarFilled /> {dest.rating}</div>
                {dest.province && <div className="dest-province">{dest.province}</div>}
                <div className="dest-overlay"><div className="dest-name">{dest.label}</div></div>
                {form.destinations.includes(dest.value) && (
                  <div className="selection-indicator"><CheckOutlined /></div>
                )}
              </div>
              <div className="dest-info">
                <div className="dest-tags">
                  {dest.tags.map(t => <span className="p-tag" key={t}>{t}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {form.destinations.length > 0 && (
        <div className="selected-preview">
          <strong>已选择：</strong>
          {form.destinations.map(d => <span className="p-tag p-tag-primary" key={d}>{d}</span>)}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content" key="s3">
      <div className="form-group">
        <label className="form-label"><HeartOutlined /> 兴趣偏好（可多选）</label>
        <div className="option-grid">
          {INTERESTS.map(item => (
            <div key={item.name}
              className={`option-card${form.interests.includes(item.name) ? ' selected' : ''}`}
              onClick={() => toggleInterest(item.name)}>
              <div className="option-icon"
                style={form.interests.includes(item.name)
                  ? { background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)`, color: 'white' }
                  : { color: item.color }}>
                {item.icon}
              </div>
              <div className="option-title">{item.name}</div>
              <div className="option-desc">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label"><TeamOutlined /> 同行人员</label>
        <div className="option-grid">
          {COMPANIONS.map(item => (
            <div key={item.name}
              className={`option-card${form.companion === item.name ? ' selected' : ''}`}
              onClick={() => set('companion', item.name)}>
              <div className="option-icon"
                style={form.companion === item.name
                  ? { background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)`, color: 'white' }
                  : { color: item.color }}>
                {item.icon}
              </div>
              <div className="option-title">{item.name}</div>
              <div className="option-desc">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label"><CompassOutlined /> 旅游风格</label>
        <div className="option-grid">
          {STYLES.map(item => (
            <div key={item.name}
              className={`option-card${form.style === item.name ? ' selected' : ''}`}
              onClick={() => set('style', item.name)}>
              <div className="option-icon"
                style={form.style === item.name
                  ? { background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)`, color: 'white' }
                  : { color: item.color }}>
                {item.icon}
              </div>
              <div className="option-title">{item.name}</div>
              <div className="option-desc">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="step-content" key="s4">
      <div className="budget-section">
        <div className="budget-header">
          <div>
            <div className="form-label" style={{ marginBottom: 0 }}>总预算</div>
            <div className="budget-amount">¥{form.budget.toLocaleString()}</div>
          </div>
        </div>
        <div className="budget-slider">
          <input type="range" min="500" max="50000" step="500"
            value={form.budget} onChange={e => set('budget', Number(e.target.value))} />
        </div>
      </div>
      <div className="budget-breakdown">
        {BUDGET_ITEMS.map(item => {
          const amount = Math.round(form.budget * item.pct);
          return (
            <div className="budget-item" key={item.key}>
              <div className="budget-item-header">
                <span className="budget-item-label">{item.label}</span>
                <span className="budget-item-value">¥{amount.toLocaleString()}</span>
              </div>
              <div className="budget-item-bar">
                <div className="budget-item-fill" style={{ width: `${item.pct * 100}%`, background: item.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const stepRenderers = { 1: renderStep1, 2: renderStep2, 3: renderStep3, 4: renderStep4 };

  return (
    <div className="proto-create">
      <div className="page-header">
        <h1 className="page-title">创建您的专属行程</h1>
        <p className="page-subtitle">告诉我们您的旅行偏好，AI将为您生成完美的江浙沪旅游攻略</p>
      </div>

      <div className="steps-nav">
        {STEPS.map(s => (
          <div key={s.num} className={`step-item${step === s.num ? ' active' : ''}${step > s.num ? ' completed' : ''}`}
            onClick={() => { if (s.num < step) setStep(s.num); }}>
            <div className="step-number">{step > s.num ? <CheckOutlined /> : s.num}</div>
            <div className="step-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="p-card">
        <div className="p-card-body">
          {stepRenderers[step]()}
        </div>
        <div className="p-card-footer">
          {step > 1 && (
            <button className="p-btn p-btn-secondary" onClick={prevStep}>
              <ArrowLeftOutlined /> 上一步
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < 4 ? (
            <button className="p-btn p-btn-primary" onClick={nextStep}>
              下一步 <ArrowRightOutlined />
            </button>
          ) : (
            <button className="p-btn p-btn-primary p-btn-lg" onClick={handleGenerate} disabled={loading}>
              {loading ? '生成中...' : '生成行程'}
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <Spin size="large" />
          <h3>AI 正在为您规划行程...</h3>
          <p>请稍候，这可能需要几秒钟</p>
        </div>
      )}
    </div>
  );
};

export default ItineraryForm;
