/**
 * 行程模块常量配置
 * @module modules/itinerary/constants
 */

import type { InterestOption, DestinationOption, CompanionOption, TravelStyleOption, FormStep } from '../types';

/** 兴趣选项配置 */
export const INTEREST_OPTIONS: InterestOption[] = [
  { label: '自然风光', value: '自然风光', icon: 'EnvironmentOutlined', color: '#52c41a', description: '山水美景,亲近自然' },
  { label: '历史文化', value: '历史文化', icon: 'CameraOutlined', color: '#722ed1', description: '古迹遗址,文化体验' },
  { label: '美食购物', value: '美食购物', icon: 'CoffeeOutlined', color: '#fa8c16', description: '特色美食,购物天堂' },
  { label: '城市漫步', value: '城市漫步', icon: 'CompassOutlined', color: '#1890ff', description: '都市风情,街头探索' },
  { label: '摄影打卡', value: '摄影打卡', icon: 'CameraOutlined', color: '#eb2f96', description: '网红景点,摄影圣地' },
  { label: '休闲度假', value: '休闲度假', icon: 'SafetyOutlined', color: '#13c2c2', description: '放松身心,享受时光' },
  { label: '亲子游玩', value: '亲子游玩', icon: 'TeamOutlined', color: '#faad14', description: '家庭娱乐,亲子互动' },
  { label: '户外探险', value: '户外探险', icon: 'ThunderboltOutlined', color: '#f5222d', description: '户外运动,挑战自我' }
];

/** 目的地选项配置 */
export const DESTINATION_OPTIONS: DestinationOption[] = [
  { value: '杭州', label: '杭州', image: '/images/cities/hangzhou.jpg', tags: ['西湖', '灵隐寺', '宋城'], rating: 4.9, highlights: ['断桥残雪', '苏堤春晓', '雷峰夕照'] },
  { value: '上海', label: '上海', image: '/images/cities/shanghai.jpg', tags: ['外滩', '迪士尼', '豫园'], rating: 4.8, highlights: ['外滩夜景', '迪士尼乐园', '城隍庙'] },
  { value: '苏州', label: '苏州', image: '/images/cities/suzhou.jpg', tags: ['拙政园', '虎丘', '平江路'], rating: 4.9, highlights: ['拙政园', '留园', '平江路'] },
  { value: '南京', label: '南京', image: '/images/cities/nanjing.jpg', tags: ['夫子庙', '中山陵', '玄武湖'], rating: 4.7, highlights: ['夫子庙', '中山陵', '玄武湖'] },
  { value: '无锡', label: '无锡', image: '/images/cities/wuxi.jpg', tags: ['太湖', '灵山', '鼋头渚'], rating: 4.6, highlights: ['太湖风光', '灵山大佛', '鼋头渚'] },
  { value: '宁波', label: '宁波', image: '/images/cities/ningbo.jpg', tags: ['天一阁', '东钱湖', '老外滩'], rating: 4.6, highlights: ['天一阁', '东钱湖', '老外滩'] },
  { value: '嘉兴', label: '嘉兴', image: '/images/cities/jiaxing.jpg', tags: ['乌镇', '西塘', '南湖'], rating: 4.8, highlights: ['乌镇古镇', '西塘水乡', '南湖红船'] },
  { value: '舟山', label: '舟山', image: '/images/cities/zhoushan.jpg', tags: ['普陀山', '朱家尖', '桃花岛'], rating: 4.8, highlights: ['普陀山', '朱家尖', '桃花岛'] }
];

/** 同行人员选项 */
export const COMPANION_OPTIONS: CompanionOption[] = [
  { label: '💑 情侣', value: '情侣', description: '浪漫之旅,甜蜜时光' },
  { label: '👨‍👩‍👧‍👦 亲子', value: '亲子', description: '家庭欢乐,亲子互动' },
  { label: '🚶 独行', value: '独行', description: '自由探索,随心所欲' },
  { label: '👥 朋友', value: '朋友', description: '结伴同行,欢乐共享' },
  { label: '🏠 家庭', value: '家庭', description: '全家出游,温馨时光' }
];

/** 旅游风格选项 */
export const TRAVEL_STYLE_OPTIONS: TravelStyleOption[] = [
  { label: '🎯 精品深度', value: '精品深度', description: '深入体验,品质优先', color: '#667eea' },
  { label: '⚡ 高效紧凑', value: '高效紧凑', description: '行程紧凑,高效游览', color: '#f5576c' },
  { label: '🌿 休闲放松', value: '休闲放松', description: '慢节奏,享受当下', color: '#4facfe' },
  { label: '🎪 丰富多样', value: '丰富多样', description: '体验多元,精彩纷呈', color: '#fa709a' }
];

/** 表单步骤配置 */
export const FORM_STEPS: FormStep[] = [
  { title: '基本信息', icon: 'InfoCircleOutlined', description: '填写行程标题、出发地和出行日期' },
  { title: '目的地选择', icon: 'EnvironmentOutlined', description: '选择您想游览的目的地' },
  { title: '兴趣偏好', icon: 'HeartOutlined', description: '选择您的兴趣偏好和同行人员' },
  { title: '预算规划', icon: 'DollarOutlined', description: '设置总预算并分配各项开支' }
];

/** 预算分类配置 */
export const BUDGET_CATEGORIES = [
  { key: 'transport', label: '交通', color: '#52c41a', icon: 'CarOutlined' },
  { key: 'accommodation', label: '住宿', color: '#1890ff', icon: 'HomeOutlined' },
  { key: 'food', label: '餐饮', color: '#fa8c16', icon: 'CoffeeOutlined' },
  { key: 'tickets', label: '门票', color: '#722ed1', icon: 'TicketOutlined' },
  { key: 'shopping', label: '购物', color: '#eb2f96', icon: 'ShoppingOutlined' },
  { key: 'other', label: '其他', color: '#607D8B', icon: 'MoreOutlined' }
] as const;

/** 时间段配置 */
export const PERIOD_CONFIG = {
  morning: { label: '上午', color: 'orange', timeRange: '08:00-12:00' },
  afternoon: { label: '下午', color: 'blue', timeRange: '12:00-18:00' },
  evening: { label: '晚上', color: 'purple', timeRange: '18:00-22:00' }
} as const;

/** 默认预算配置 */
export const DEFAULT_BUDGET = {
  total: 3000,
  min: 500,
  max: 50000,
  step: 500
};

/** 默认天数配置 */
export const DEFAULT_DAYS = {
  min: 1,
  max: 15,
  default: 3
};

/** 分页配置 */
export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  pageSizeOptions: [10, 20, 50, 100]
};

/** 视图模式 */
export const VIEW_MODES = ['grid', 'list'] as const;

/** 排序选项 */
export const SORT_OPTIONS = [
  { value: 'created_at', label: '创建时间' },
  { value: 'budget', label: '预算' },
  { value: 'days', label: '天数' },
  { value: 'start_date', label: '出发日期' }
] as const;

/** 状态选项 */
export const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'planning', label: '规划中' },
  { value: 'confirmed', label: '已确认' },
  { value: 'ongoing', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
] as const;
