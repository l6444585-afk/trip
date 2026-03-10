/**
 * 全局常量配置
 * @module constants
 */

/** 兴趣标签配置 */
export const INTEREST_OPTIONS = [
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
export const DESTINATION_OPTIONS = [
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
export const COMPANION_OPTIONS = [
  { label: '💑 情侣', value: '情侣', description: '浪漫之旅,甜蜜时光' },
  { label: '👨‍👩‍👧‍👦 亲子', value: '亲子', description: '家庭欢乐,亲子互动' },
  { label: '🚶 独行', value: '独行', description: '自由探索,随心所欲' },
  { label: '👥 朋友', value: '朋友', description: '结伴同行,欢乐共享' },
  { label: '🏠 家庭', value: '家庭', description: '全家出游,温馨时光' }
];

/** 旅游风格选项 */
export const TRAVEL_STYLE_OPTIONS = [
  { label: '🎯 精品深度', value: '精品深度', description: '深入体验,品质优先', color: '#667eea' },
  { label: '⚡ 高效紧凑', value: '高效紧凑', description: '行程紧凑,高效游览', color: '#f5576c' },
  { label: '🌿 休闲放松', value: '休闲放松', description: '慢节奏,享受当下', color: '#4facfe' },
  { label: '🎪 丰富多样', value: '丰富多样', description: '体验多元,精彩纷呈', color: '#fa709a' }
];

/** 规划约束选项 */
export const CONSTRAINT_OPTIONS = [
  { label: '预算优先', value: 'budget_priority', icon: 'DollarOutlined', description: '在预算范围内最大化体验' },
  { label: '时间紧凑', value: 'time_efficient', icon: 'ClockCircleOutlined', description: '高效利用时间,减少等待' },
  { label: '舒适优先', value: 'comfort_first', icon: 'SafetyOutlined', description: '注重住宿和交通舒适度' },
  { label: '体验深度', value: 'deep_experience', icon: 'CameraOutlined', description: '深入体验当地文化' },
  { label: '网红打卡', value: 'popular_spots', icon: 'FireOutlined', description: '优先推荐热门景点' },
  { label: '小众探索', value: 'niche_exploration', icon: 'CompassOutlined', description: '探索小众独特景点' }
];

/** 规划步骤配置 */
export const PLANNING_STEPS = [
  { title: '意图识别', icon: 'BulbOutlined', description: 'GLM-4.7 分析您的旅行需求' },
  { title: '约束分析', icon: 'AimOutlined', description: '理解预算、时间等限制条件' },
  { title: '智能规划', icon: 'RobotOutlined', description: '多Agent并行生成最优方案' },
  { title: '方案优化', icon: 'ThunderboltOutlined', description: '基于反馈持续优化行程' }
];

/** 热门目的地数据 */
export const POPULAR_DESTINATIONS = [
  { id: 1, name: '杭州西湖', city: '杭州', rating: 4.9, heat: 98, image: '/images/cities/hangzhou.jpg', tags: ['自然风光', '人文古迹', '网红打卡'], description: '断桥残雪、苏堤春晓、雷峰夕照，西湖十景美不胜收' },
  { id: 2, name: '上海外滩', city: '上海', rating: 4.8, heat: 95, image: '/images/cities/shanghai.jpg', tags: ['都市风情', '夜景', '历史建筑'], description: '万国建筑博览群，黄浦江畔璀璨夜景' },
  { id: 3, name: '苏州园林', city: '苏州', rating: 4.9, heat: 92, image: '/images/cities/suzhou.jpg', tags: ['园林艺术', '文化遗产', '摄影圣地'], description: '拙政园、留园、狮子林，一步一景皆是画' },
  { id: 4, name: '南京夫子庙', city: '南京', rating: 4.7, heat: 88, image: '/images/cities/nanjing.jpg', tags: ['历史底蕴', '美食打卡', '文化体验'], description: '秦淮河畔古韵悠长，小吃美食应有尽有' },
  { id: 5, name: '乌镇古镇', city: '嘉兴', rating: 4.8, heat: 90, image: '/images/cities/jiaxing.jpg', tags: ['古镇水乡', '历史文化', '摄影圣地'], description: '小桥流水人家，江南水乡的典型代表' },
  { id: 6, name: '普陀山', city: '舟山', rating: 4.8, heat: 87, image: '/images/cities/zhoushan.jpg', tags: ['佛教圣地', '自然风光', '文化体验'], description: '海天佛国，观音菩萨的道场' },
  { id: 7, name: '雪窦山', city: '宁波', rating: 4.6, heat: 83, image: '/images/cities/ningbo.jpg', tags: ['自然风光', '佛教文化', '登山徒步'], description: '弥勒佛道场，四明山第一山' },
  { id: 8, name: '无锡太湖', city: '无锡', rating: 4.6, heat: 85, image: '/images/cities/wuxi.jpg', tags: ['自然风光', '湖光山色', '休闲度假'], description: '鼋头渚樱花盛开，太湖明珠风光旖旎' }
];

/** 景点数据库 */
export const ATTRACTIONS_DATA = [
  { name: '杭州西湖', openTime: '全天开放', ticketPrice: '免费', suggestedDuration: '4-6小时', bestSeason: '春秋两季', rating: 4.9 },
  { name: '上海外滩', openTime: '全天开放', ticketPrice: '免费', suggestedDuration: '2-3小时', bestSeason: '全年', rating: 4.8 },
  { name: '苏州拙政园', openTime: '07:30-17:30', ticketPrice: '¥70', suggestedDuration: '3-4小时', bestSeason: '春夏', rating: 4.9 },
  { name: '南京夫子庙', openTime: '09:00-22:00', ticketPrice: '免费', suggestedDuration: '2-3小时', bestSeason: '全年', rating: 4.7 }
];

/** 住宿推荐数据 */
export const ACCOMMODATION_DATA = [
  { name: '杭州西湖国宾馆', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop', rating: 4.9, price: '¥1,200/晚', description: '西湖边五星级园林式酒店，环境优美' },
  { name: '上海外滩华尔道夫', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop', rating: 4.8, price: '¥2,500/晚', description: '外滩历史建筑，奢华体验' },
  { name: '苏州书香府邸', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop', rating: 4.7, price: '¥800/晚', description: '古典园林风格，文化氛围浓厚' },
  { name: '南京金陵饭店', image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop', rating: 4.6, price: '¥600/晚', description: '南京地标性酒店，交通便利' }
];

/** 餐饮推荐数据 */
export const DINING_DATA = [
  { name: '楼外楼', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop', rating: 4.8, price: '¥200/人', cuisine: '杭帮菜', description: '百年老店，正宗西湖醋鱼' },
  { name: '外滩三号', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop', rating: 4.9, price: '¥500/人', cuisine: '西餐', description: '外滩顶级西餐厅，江景绝佳' },
  { name: '得月楼', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop', rating: 4.7, price: '¥180/人', cuisine: '苏帮菜', description: '苏州百年老店，松鼠桂鱼' },
  { name: '南京大牌档', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop', rating: 4.6, price: '¥80/人', cuisine: '南京菜', description: '地道南京小吃，性价比高' }
];

/** 系统特色功能 */
export const SYSTEM_FEATURES = [
  { icon: 'EnvironmentOutlined', iconColor: '#667eea', title: '智能推荐', description: 'GLM-4.7 推理引擎驱动 - 基于200K超长上下文窗口，结合实时联网数据，为您推荐最符合个人喜好的景点、美食和活动。模型的多语言理解能力确保推荐精准度。' },
  { icon: 'CameraOutlined', iconColor: '#f5576c', title: '路线优化', description: '多Agent并行规划 - 采用类似Claude Code的Session隔离技术，多个GLM-4.7 Agent同时工作：一个规划景点顺序，一个计算交通时间，一个优化步行路线，最终生成最短时间和最佳体验的行程。' },
  { icon: 'StarOutlined', iconColor: '#00f2fe', title: '行程管理', description: 'Claude Code式工作流 - 所有行程基于GLM-4.7生成，支持随时调整参数并一键重新规划。保留式思考模式确保修改历史完整，可随时回溯或微调。' },
  { icon: 'HeartOutlined', iconColor: '#764ba2', title: '预算管理', description: '动态工具调用 - GLM-4.7的精准工具调用能力实时分析价格趋势，自动计算交通、住宿、餐饮成本，并提供预算预警和替代方案，确保您的行程在预算范围内。' }
];

/** 状态颜色映射 */
export const STATUS_COLORS = {
  planning: 'default',
  confirmed: 'processing',
  ongoing: 'active',
  completed: 'success',
  cancelled: 'error'
};

/** 状态文本映射 */
export const STATUS_TEXTS = {
  planning: '规划中',
  confirmed: '已确认',
  ongoing: '进行中',
  completed: '已完成',
  cancelled: '已取消'
};

/** 同行人员颜色映射 */
export const COMPANION_COLORS = {
  情侣: 'pink',
  亲子: 'orange',
  独行: 'blue',
  朋友: 'green',
  家庭: 'purple'
};

/** 同行人员图标映射 */
export const COMPANION_ICONS = {
  情侣: '💑',
  亲子: '👨‍👩‍👧‍👦',
  独行: '🚶',
  朋友: '👥',
  家庭: '🏠'
};

/** 兴趣颜色映射 */
export const INTEREST_COLORS = {
  自然风光: '#52c41a',
  历史文化: '#722ed1',
  美食购物: '#fa8c16',
  城市漫步: '#1890ff',
  摄影打卡: '#eb2f96',
  休闲度假: '#13c2c2',
  亲子游玩: '#faad14',
  户外探险: '#f5222d'
};

/** 预算类别颜色映射 */
export const BUDGET_CATEGORY_COLORS = {
  transport: '#52c41a',
  accommodation: '#1890ff',
  food: '#fa8c16',
  tickets: '#722ed1',
  shopping: '#eb2f96',
  other: '#607D8B'
};

/** 预算类别标签映射 */
export const BUDGET_CATEGORY_LABELS = {
  transport: '交通',
  accommodation: '住宿',
  food: '餐饮',
  tickets: '门票',
  shopping: '购物',
  other: '其他'
};

/** 默认预算配置 */
export const DEFAULT_BUDGET = {
  total: 5000,
  transport: 1000,
  accommodation: 2000,
  food: 1200,
  tickets: 500,
  shopping: 300
};

/** 默认表单配置 */
export const DEFAULT_FORM_CONFIG = {
  days: 3,
  budget: 3000,
  companion_type: '情侣',
  travel_style: '精品深度'
};

/** 时间段映射 */
export const PERIOD_MAP = {
  morning: { label: '上午', color: 'orange' },
  afternoon: { label: '下午', color: 'blue' },
  evening: { label: '晚上', color: 'purple' }
};

/** 活动类型颜色映射 */
export const ACTIVITY_TYPE_COLORS = {
  sightseeing: 'blue',
  dining: 'orange',
  culture: 'purple',
  leisure: 'green'
};

/** 活动类型标签映射 */
export const ACTIVITY_TYPE_LABELS = {
  sightseeing: '景点',
  dining: '餐饮',
  culture: '文化',
  leisure: '休闲'
};

/** 优化建议类型颜色映射 */
export const OPTIMIZATION_TYPE_COLORS = {
  adjustment: '#1890ff',
  addition: '#52c41a',
  alternative: '#fa8c16'
};

/** 优化建议类型标签映射 */
export const OPTIMIZATION_TYPE_LABELS = {
  adjustment: '调整',
  addition: '新增',
  alternative: '替代'
};

/** API 端点配置 */
export const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  CHECK_USERNAME: '/api/auth/check-username',
  CHECK_PASSWORD: '/api/auth/check-password',
  REFRESH_TOKEN: '/api/auth/refresh',
  LOGOUT: '/api/auth/logout',
  ITINERARIES: '/api/itineraries',
  GENERATE_ITINERARY: '/api/itineraries/generate',
  CHAT: '/api/chat'
};

/** 本地存储键名 */
export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  REMEMBER_ME: 'remember_me'
};

/** 路由路径配置 */
export const ROUTES = {
  HOME: '/',
  CREATE: '/create',
  ITINERARIES: '/itineraries',
  ITINERARY_DETAIL: '/itinerary/:id',
  AUTH: '/auth',
  AI_PLANNING: '/ai-planning'
};

/** 动画持续时间配置 (ms) */
export const ANIMATION_DURATION = {
  FAST: 150,
  BASE: 200,
  SLOW: 300,
  SLOWER: 500
};

/** 防抖延迟配置 (ms) */
export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  INPUT: 500,
  RESIZE: 200
};

/** 分页配置 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};
