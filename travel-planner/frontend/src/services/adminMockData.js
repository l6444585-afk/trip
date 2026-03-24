/**
 * 管理后台 Mock 数据（毕设演示用，小规模）
 */

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysAgo));
  d.setHours(randomInt(8, 22), randomInt(0, 59), randomInt(0, 59));
  return d.toISOString();
};

// ========== Dashboard ==========
export const mockStats = {
  total_users: 8,
  new_users_today: 0,
  total_itineraries: 6,
  new_itineraries_today: 0,
  total_orders: 0,
  today_orders: 0,
  total_revenue: 0,
  month_revenue: 0,
  today_revenue: 0,
  active_users_today: 3,
  published_itineraries: 4,
  pending_review: 1,
  total_attractions: 50,
  new_users_week: 1,
  new_users_month: 3,
};

export const generateTrendData = (days = 30) => {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toISOString().split('T')[0],
      revenue: 0,
      orders: 0,
    });
  }
  return data;
};

export const generateUserActivity = (days = 30) => {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toISOString().split('T')[0],
      new_users: randomInt(0, 1),
      logins: randomInt(0, 5),
    });
  }
  return data;
};

export const mockPopularItineraries = [
  { id: 1, title: '杭州西湖三日深度游', view_count: 23, order_count: 0, revenue: 0 },
  { id: 2, title: '苏州园林+周庄水乡两日游', view_count: 15, order_count: 0, revenue: 0 },
  { id: 3, title: '上海迪士尼+外滩精华两日', view_count: 12, order_count: 0, revenue: 0 },
  { id: 4, title: '南京历史文化两日游', view_count: 8, order_count: 0, revenue: 0 },
  { id: 5, title: '乌镇+西塘古镇周末游', view_count: 5, order_count: 0, revenue: 0 },
];

// ========== Users ==========
const userNames = ['张伟', '李娜', '王芳', '刘洋', '陈磊', '杨静', '赵敏', '黄鑫'];

const generateUsers = () => userNames.map((name, i) => ({
  id: i + 1,
  username: `user_${String(i + 1).padStart(3, '0')}`,
  email: `user${i + 1}@example.com`,
  real_name: name,
  status: i === 3 ? 0 : 1,
  itineraries_count: randomInt(0, 2),
  orders_count: 0,
  created_at: randomDate(90),
  preferences: {
    preferred_pace: ['休闲', '适中', '紧凑'][i % 3],
    budget_preference: ['经济', '舒适', '豪华'][i % 3],
    interests: ['自然风光,人文历史', '美食购物,主题乐园', '古镇水乡,文艺清新'][i % 3],
    dietary_restrictions: i === 0 ? '素食' : '无',
  },
  recent_itineraries: [
    { title: '杭州西湖周末游', days: 2, created_at: randomDate(30) },
  ],
  recent_orders: [],
}));

// ========== Itineraries ==========
const itineraryTitles = [
  '杭州西湖+灵隐寺三日深度游', '苏州古典园林精华两日', '上海都市风光两日游',
  '南京六朝古都历史游', '乌镇+西塘水乡两日', '千岛湖休闲度假三日',
];

const statuses = ['draft', 'pending', 'approved', 'published', 'published', 'rejected'];
const departures = ['上海', '杭州', '南京', '苏州'];
const companions = ['独自出行', '情侣出行', '家庭出游', '朋友结伴'];

const generateItineraries = () => itineraryTitles.map((title, i) => ({
  id: i + 1,
  title,
  user: { username: userNames[i % userNames.length] },
  days: randomInt(1, 4),
  budget: randomInt(300, 2000),
  departure: departures[i % departures.length],
  companion_type: companions[i % companions.length],
  interests: '自然风光,人文历史',
  status: statuses[i % statuses.length],
  created_at: randomDate(60),
  schedules: [
    { day: 1, period: '上午', activity: '游览景点', location: '西湖' },
    { day: 1, period: '下午', activity: '品尝美食', location: '河坊街' },
    { day: 2, period: '上午', activity: '参观寺庙', location: '灵隐寺' },
  ],
}));

// ========== Attractions ==========
const mockAttractions = [
  { id: 1, name: '西湖风景区', city: '杭州', category: '自然景观', rating: 4.9, popularity: 156, ticket_price: 0, address: '杭州市西湖区龙井路1号', description: '中国十大风景名胜之一', latitude: 30.2590, longitude: 120.1485 },
  { id: 2, name: '灵隐寺', city: '杭州', category: '人文历史', rating: 4.7, popularity: 98, ticket_price: 75, address: '杭州市西湖区灵隐路法云弄1号', description: '中国佛教名寺', latitude: 30.2408, longitude: 120.0988 },
  { id: 3, name: '拙政园', city: '苏州', category: '人文历史', rating: 4.8, popularity: 112, ticket_price: 80, address: '苏州市姑苏区东北街178号', description: '中国四大名园之一', latitude: 31.3248, longitude: 120.6311 },
  { id: 4, name: '留园', city: '苏州', category: '人文历史', rating: 4.7, popularity: 67, ticket_price: 55, address: '苏州市姑苏区留园路338号', description: '苏州古典园林代表', latitude: 31.3176, longitude: 120.6085 },
  { id: 5, name: '外滩', city: '上海', category: '都市休闲', rating: 4.8, popularity: 189, ticket_price: 0, address: '上海市黄浦区中山东一路', description: '上海标志性景点', latitude: 31.2400, longitude: 121.4900 },
  { id: 6, name: '上海迪士尼', city: '上海', category: '主题乐园', rating: 4.6, popularity: 203, ticket_price: 475, address: '上海市浦东新区川沙镇', description: '中国内地首座迪士尼主题乐园', latitude: 31.1440, longitude: 121.6570 },
  { id: 7, name: '中山陵', city: '南京', category: '人文历史', rating: 4.8, popularity: 134, ticket_price: 0, address: '南京市玄武区石象路7号', description: '孙中山先生陵墓', latitude: 32.0624, longitude: 118.8481 },
  { id: 8, name: '夫子庙', city: '南京', category: '人文历史', rating: 4.5, popularity: 145, ticket_price: 0, address: '南京市秦淮区秦淮河畔', description: '六朝古都文化缩影', latitude: 32.0213, longitude: 118.7876 },
  { id: 9, name: '乌镇', city: '嘉兴', category: '自然景观', rating: 4.7, popularity: 167, ticket_price: 150, address: '嘉兴市桐乡市乌镇石佛南路18号', description: '中国最美水乡古镇', latitude: 30.7445, longitude: 120.4877 },
  { id: 10, name: '普陀山', city: '舟山', category: '人文历史', rating: 4.8, popularity: 91, ticket_price: 160, address: '舟山市普陀区普陀山', description: '中国佛教四大名山之一', latitude: 30.0082, longitude: 122.3850 },
  { id: 11, name: '千岛湖', city: '杭州', category: '自然景观', rating: 4.6, popularity: 78, ticket_price: 150, address: '杭州市淳安县千岛湖镇', description: '天下第一秀水', latitude: 29.6041, longitude: 118.9477 },
  { id: 12, name: '太湖鼋头渚', city: '无锡', category: '自然景观', rating: 4.5, popularity: 56, ticket_price: 90, address: '无锡市滨湖区鼋渚路1号', description: '太湖最美赏樱胜地', latitude: 31.5186, longitude: 120.2151 },
  { id: 13, name: '西塘古镇', city: '嘉兴', category: '自然景观', rating: 4.6, popularity: 85, ticket_price: 100, address: '嘉兴市嘉善县西塘镇', description: '江南六大古镇之一', latitude: 30.9463, longitude: 120.8934 },
  { id: 14, name: '灵山大佛', city: '无锡', category: '人文历史', rating: 4.5, popularity: 62, ticket_price: 210, address: '无锡市滨湖区马山灵山路1号', description: '世界最高释迦牟尼青铜立像', latitude: 31.4125, longitude: 120.1310 },
  { id: 15, name: '东方明珠', city: '上海', category: '都市休闲', rating: 4.4, popularity: 178, ticket_price: 220, address: '上海市浦东新区世纪大道1号', description: '上海地标建筑', latitude: 31.2397, longitude: 121.4998 },
].map(a => ({ ...a, media_count: randomInt(2, 8), updated_at: randomDate(60), open_time: '08:00', close_time: '17:30', avg_visit_duration: randomInt(60, 240), tips: '建议穿舒适的步行鞋' }));

export const mockCities = [
  { name: '杭州' }, { name: '苏州' }, { name: '上海' }, { name: '南京' },
  { name: '宁波' }, { name: '舟山' }, { name: '无锡' }, { name: '嘉兴' },
];

export const mockCategories = ['自然景观', '人文历史', '主题乐园', '都市休闲'];

// ========== Orders（毕设无订单）==========
const generateOrders = () => [];

// ========== Roles ==========
export const mockRoles = [
  { id: 1, name: '超级管理员', code: 'admin', description: '拥有系统所有权限', status: 1, permissions: Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `权限${i + 1}` })) },
  { id: 2, name: '内容管理员', code: 'content_admin', description: '管理行程和景点内容', status: 1, permissions: Array.from({ length: 6 }, (_, i) => ({ id: i + 1, name: `权限${i + 1}` })) },
  { id: 3, name: '客服专员', code: 'customer_service', description: '处理用户反馈和订单', status: 1, permissions: [{ id: 9, name: '订单管理' }, { id: 12, name: '用户反馈' }] },
];

export const mockPermissions = [
  { id: 1, name: '用户管理', parent_id: null },
  { id: 2, name: '查看用户', parent_id: 1 },
  { id: 3, name: '编辑用户', parent_id: 1 },
  { id: 4, name: '行程管理', parent_id: null },
  { id: 5, name: '审核行程', parent_id: 4 },
  { id: 6, name: '发布行程', parent_id: 4 },
  { id: 7, name: '景点管理', parent_id: null },
  { id: 8, name: '编辑景点', parent_id: 7 },
  { id: 9, name: '订单管理', parent_id: null },
  { id: 10, name: '退款处理', parent_id: 9 },
  { id: 11, name: '数据分析', parent_id: null },
  { id: 12, name: '系统设置', parent_id: null },
];

// ========== Admin Users ==========
export const mockAdminUsers = [
  { id: 1, username: 'admin', real_name: '系统管理员', email: 'admin@travel.com', phone: '13800000001', is_superuser: true, status: 1, last_login: randomDate(1), roles: [{ id: 1, name: '超级管理员' }] },
  { id: 2, username: 'editor', real_name: '李编辑', email: 'editor@travel.com', phone: '13800000002', is_superuser: false, status: 1, last_login: randomDate(3), roles: [{ id: 2, name: '内容管理员' }] },
  { id: 3, username: 'cs_wang', real_name: '王客服', email: 'cs@travel.com', phone: '13800000003', is_superuser: false, status: 1, last_login: randomDate(2), roles: [{ id: 3, name: '客服专员' }] },
];

// ========== Operation Logs ==========
const generateLogs = () => {
  const entries = [
    { operator_name: '系统管理员', module: 'admin', action: 'login', target_type: 'admin', target_name: 'admin', description: '管理员登录系统' },
    { operator_name: '李编辑', module: 'attraction', action: 'create', target_type: 'attraction', target_name: '西湖风景区', description: '新增景点信息' },
    { operator_name: '李编辑', module: 'itinerary', action: 'review', target_type: 'itinerary', target_name: '杭州西湖三日游', description: '审核通过行程' },
    { operator_name: '王客服', module: 'order', action: 'update', target_type: 'order', target_name: 'ORD20250311', description: '确认订单' },
    { operator_name: '系统管理员', module: 'system', action: 'update', target_type: 'system', target_name: '系统配置', description: '修改系统配置' },
    { operator_name: '李编辑', module: 'itinerary', action: 'publish', target_type: 'itinerary', target_name: '苏州园林两日', description: '发布行程' },
    { operator_name: '王客服', module: 'order', action: 'refund', target_type: 'order', target_name: 'ORD20250318', description: '处理订单退款' },
    { operator_name: '系统管理员', module: 'user', action: 'update', target_type: 'user', target_name: '刘洋', description: '禁用用户账号' },
    { operator_name: '李编辑', module: 'attraction', action: 'update', target_type: 'attraction', target_name: '灵隐寺', description: '更新景点描述' },
    { operator_name: '系统管理员', module: 'admin', action: 'create', target_type: 'admin', target_name: '王客服', description: '创建管理员账号' },
    { operator_name: '王客服', module: 'order', action: 'update', target_type: 'order', target_name: 'ORD20250315', description: '确认订单发货' },
    { operator_name: '李编辑', module: 'itinerary', action: 'review', target_type: 'itinerary', target_name: '南京历史游', description: '审核拒绝行程' },
  ];
  return entries.map((e, i) => ({
    id: i + 1,
    ...e,
    operator_ip: `192.168.1.${randomInt(10, 50)}`,
    status: i === 11 ? 0 : 1,
    duration_ms: randomInt(15, 200),
    created_at: randomDate(30),
  }));
};

// ========== Backups ==========
export const mockBackups = [
  { id: 1, name: 'backup_20250318_020000', type: 'auto', file_size: 2097152, status: 'completed', created_at: '2025-03-18T02:00:00Z' },
  { id: 2, name: 'backup_20250317_020000', type: 'auto', file_size: 2048000, status: 'completed', created_at: '2025-03-17T02:00:00Z' },
  { id: 3, name: 'manual_init_data', type: 'manual', file_size: 1572864, status: 'completed', created_at: '2025-03-15T10:30:00Z' },
];

// ========== Paginate Helper ==========
const paginate = (items, params) => {
  const page = params?.page || 1;
  const pageSize = params?.page_size || 20;
  let filtered = [...items];
  if (params?.keyword) {
    const kw = params.keyword.toLowerCase();
    filtered = filtered.filter(item =>
      Object.values(item).some(v => typeof v === 'string' && v.toLowerCase().includes(kw))
    );
  }
  const start = (page - 1) * pageSize;
  return { items: filtered.slice(start, start + pageSize), total: filtered.length };
};

// ========== Export ==========
const users = generateUsers();
const itineraries = generateItineraries();
const orders = generateOrders();
const logs = generateLogs();

export const mockServices = {
  dashboard: {
    getStats: () => mockStats,
    getRevenueTrend: (days) => generateTrendData(days),
    getUserActivity: (days) => generateUserActivity(days),
    getPopularItineraries: () => mockPopularItineraries,
  },
  users: {
    getUsers: (params) => paginate(users, params),
    getUserDetail: (userId) => users.find(u => u.id === userId) || users[0],
  },
  itineraries: {
    getItineraries: (params) => {
      let filtered = itineraries;
      if (params?.status) filtered = filtered.filter(i => i.status === params.status);
      return paginate(filtered, params);
    },
  },
  attractions: {
    getAttractions: (params) => {
      let filtered = mockAttractions;
      if (params?.city) filtered = filtered.filter(a => a.city === params.city);
      if (params?.category) filtered = filtered.filter(a => a.category === params.category);
      return paginate(filtered, params);
    },
    getCities: () => mockCities,
    getCategories: () => mockCategories,
  },
  orders: {
    getOrders: (params) => {
      let filtered = orders;
      if (params?.status) filtered = filtered.filter(o => o.status === params.status);
      if (params?.payment_status) filtered = filtered.filter(o => o.payment_status === params.payment_status);
      return paginate(filtered, params);
    },
    getOrderDetail: (orderId) => orders.find(o => o.id === orderId) || orders[0],
  },
  system: {
    getRoles: () => mockRoles,
    getPermissions: () => mockPermissions,
    getAdminUsers: (params) => paginate(mockAdminUsers, params),
    getOperationLogs: (params) => paginate(logs, params),
    getBackups: () => mockBackups,
  },
};
