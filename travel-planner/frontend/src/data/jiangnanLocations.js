/**
 * 江浙沪旅游地点数据
 * 包含杭州西湖、苏州拙政园、上海外滩等经典景点
 */

export const JIANGNAN_LOCATIONS = [
  {
    id: 'hangzhou-west-lake',
    name: '杭州西湖',
    city: '杭州',
    description: '西湖是中国大陆首批国家重点风景名胜区和中国十大风景名胜之一，是现今《世界遗产名录》中少数几个和中国唯一一个湖泊类文化遗产。',
    longitude: 120.148732,
    latitude: 30.242489,
    address: '浙江省杭州市西湖区龙井路1号',
    category: 'attraction',
    rating: 5.0,
    visitDuration: '3-4小时',
    bestTime: '春秋两季',
    ticketPrice: '免费',
    tips: [
      '建议租借自行车环湖游览',
      '断桥残雪、苏堤春晓是必看景点',
      '傍晚时分可在雷峰塔看日落'
    ]
  },
  {
    id: 'suzhou-humble-administrator-garden',
    name: '拙政园',
    city: '苏州',
    description: '拙政园位于苏州古城区东北隅，是苏州现存最大的古典园林，与北京颐和园、承德避暑山庄、苏州留园一起被誉为中国四大名园。',
    longitude: 120.629073,
    latitude: 31.322898,
    address: '江苏省苏州市姑苏区东北街178号',
    category: 'attraction',
    rating: 4.9,
    visitDuration: '2-3小时',
    bestTime: '春夏季节',
    ticketPrice: '70元（淡季）/ 80元（旺季）',
    tips: [
      '建议请导游讲解，更能理解园林之美',
      '园内有多处拍照打卡点',
      '可与苏州博物馆一同游览'
    ]
  },
  {
    id: 'shanghai-the-bund',
    name: '上海外滩',
    city: '上海',
    description: '外滩是上海最具标志性的景点之一，位于黄浦江畔，与陆家嘴金融区隔江相望，汇集了52幢风格迥异的古典复兴大楼。',
    longitude: 121.490317,
    latitude: 31.245417,
    address: '上海市黄浦区中山东一路',
    category: 'attraction',
    rating: 4.8,
    visitDuration: '2-3小时',
    bestTime: '傍晚至夜间',
    ticketPrice: '免费',
    tips: [
      '傍晚时分前往可同时欣赏日落和夜景',
      '可乘坐轮渡前往陆家嘴',
      '周末人流较大，建议错峰出行'
    ]
  },
  {
    id: 'hangzhou-lingyin-temple',
    name: '灵隐寺',
    city: '杭州',
    description: '灵隐寺是中国佛教著名寺院，始建于东晋咸和元年，是中国最早的佛教寺院之一，也是中国佛教禅宗十大古刹之一。',
    longitude: 120.101393,
    latitude: 30.241667,
    address: '浙江省杭州市西湖区灵隐路法云弄1号',
    category: 'attraction',
    rating: 4.7,
    visitDuration: '2-3小时',
    bestTime: '全年',
    ticketPrice: '飞来峰景区45元 + 灵隐寺香花券30元',
    tips: [
      '建议早上前往，人少清静',
      '注意着装得体，保持安静',
      '可顺道游览飞来峰石窟'
    ]
  },
  {
    id: 'suzhou-pingjiang-road',
    name: '平江路',
    city: '苏州',
    description: '平江路是苏州的一条历史老街，是一条沿河的小路，河名为平江河，是苏州古城迄今为止保存最为完整的一个区域。',
    longitude: 120.633056,
    latitude: 31.316667,
    address: '江苏省苏州市姑苏区平江路',
    category: 'attraction',
    rating: 4.6,
    visitDuration: '1-2小时',
    bestTime: '傍晚',
    ticketPrice: '免费',
    tips: [
      '傍晚时分灯光亮起更有韵味',
      '可品尝当地特色小吃',
      '适合拍照打卡'
    ]
  },
  {
    id: 'shanghai-yuyuan-garden',
    name: '豫园',
    city: '上海',
    description: '豫园是江南古典园林，始建于明代嘉靖、万历年间，有四百余年历史，是上海著名的古典园林。',
    longitude: 121.491667,
    latitude: 31.227778,
    address: '上海市黄浦区福佑路168号',
    category: 'attraction',
    rating: 4.5,
    visitDuration: '2小时',
    bestTime: '全年',
    ticketPrice: '40元',
    tips: [
      '可与城隍庙一同游览',
      '园内九曲桥是必打卡点',
      '节假日期间人流较大'
    ]
  }
];

export const JIANGNAN_ROUTE_COLORS = [
  '#1890ff',
  '#52c41a',
  '#fa8c16',
  '#eb2f96',
  '#722ed1',
  '#13c2c2',
];

export const getLocationsByCity = (city) => {
  return JIANGNAN_LOCATIONS.filter(loc => loc.city === city);
};

export const getLocationById = (id) => {
  return JIANGNAN_LOCATIONS.find(loc => loc.id === id);
};

export const getRouteLocations = () => {
  return [
    getLocationById('hangzhou-west-lake'),
    getLocationById('suzhou-humble-administrator-garden'),
    getLocationById('shanghai-the-bund')
  ].filter(Boolean);
};
