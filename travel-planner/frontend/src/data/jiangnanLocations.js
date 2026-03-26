/**
 * 江浙沪旅游地点数据 - 50 个精选景点
 * 覆盖 17 城：上海、杭州、苏州、南京、无锡、扬州、宁波、绍兴、嘉兴、湖州、
 * 舟山、金华、常州、镇江、温州、南通、台州
 */

export const JIANGNAN_LOCATIONS = [
  // ==================== 上海 (7) ====================
  { id: 'sh-disney', name: '上海迪士尼乐园', city: '上海', category: '主题乐园', description: '中国内地首座迪士尼主题乐园，拥有全球最大的迪士尼城堡，包含七大主题园区。创极速光轮、飞越地平线等项目全球领先。', longitude: 121.657, latitude: 31.1434, address: '上海市浦东新区川沙镇黄赵路310号', rating: 4.8, ticketPrice: '475元', ticket_price: 475 },
  { id: 'sh-bund', name: '上海外滩', city: '上海', category: '都市休闲', description: '上海标志性景观，沿黄浦江西岸分布52幢万国建筑博览群，与陆家嘴现代摩天大楼群隔江对望。', longitude: 121.4903, latitude: 31.2454, address: '上海市黄浦区中山东一路', rating: 4.7, ticketPrice: '免费', ticket_price: 0 },
  { id: 'sh-pearl', name: '上海东方明珠', city: '上海', category: '都市休闲', description: '上海标志性建筑，高468米。拥有259米全透明悬空观光廊、旋转餐厅，俯瞰外滩全景的最佳机位。', longitude: 121.4998, latitude: 31.2397, address: '上海市浦东新区世纪大道1号', rating: 4.6, ticketPrice: '199元', ticket_price: 199 },
  { id: 'sh-yuyuan', name: '上海豫园', city: '上海', category: '人文历史', description: '始建于明代嘉靖年间的古典园林，有江南三大名石之一的玉玲珑。周边城隍庙商圈汇集上海传统小吃。', longitude: 121.4917, latitude: 31.2278, address: '上海市黄浦区安仁街137号', rating: 4.5, ticketPrice: '40元', ticket_price: 40 },
  { id: 'sh-zoo', name: '上海野生动物园', city: '上海', category: '主题乐园', description: '中国首座国家级野生动物园，占地153公顷，汇集世界各地珍稀动物200余种。', longitude: 121.7369, latitude: 31.0586, address: '上海市浦东新区南六公路178号', rating: 4.6, ticketPrice: '165元', ticket_price: 165 },
  { id: 'sh-tianzifang', name: '上海田子坊', city: '上海', category: '都市休闲', description: '由上海石库门里弄改造而成的创意文化街区，保留了老上海弄堂的生活气息，汇集创意小店、画廊、咖啡馆。', longitude: 121.4689, latitude: 31.2107, address: '上海市黄浦区泰康路210弄', rating: 4.4, ticketPrice: '免费', ticket_price: 0 },
  { id: 'sh-artpalace', name: '上海中华艺术宫', city: '上海', category: '人文历史', description: '由2010年世博会中国馆改建，上海最大的美术馆。常设展包括海派艺术大师作品和多媒体版《清明上河图》。', longitude: 121.492, latitude: 31.1865, address: '上海市浦东新区上南路205号', rating: 4.5, ticketPrice: '免费', ticket_price: 0 },

  // ==================== 杭州 (6) ====================
  { id: 'hz-westlake', name: '杭州西湖', city: '杭州', category: '自然景观', description: '世界文化遗产，苏堤春晓、断桥残雪、三潭印月等西湖十景闻名天下，四季皆有独特韵味。', longitude: 120.1487, latitude: 30.2425, address: '浙江省杭州市西湖区龙井路1号', rating: 4.9, ticketPrice: '免费', ticket_price: 0 },
  { id: 'hz-lingyin', name: '杭州灵隐寺', city: '杭州', category: '人文历史', description: '始建于东晋1700多年历史的佛教名刹，飞来峰有470余尊石窟造像，大雄宝殿佛像高24.8米。', longitude: 120.1014, latitude: 30.2417, address: '浙江省杭州市西湖区灵隐路法云弄1号', rating: 4.7, ticketPrice: '45元', ticket_price: 45 },
  { id: 'hz-songcheng', name: '杭州宋城', city: '杭州', category: '主题乐园', description: '"给我一天，还你千年"——中国最大的宋文化主题公园。核心演出《宋城千古情》一年超千场。', longitude: 120.1167, latitude: 30.1833, address: '浙江省杭州市西湖区之江路148号', rating: 4.6, ticketPrice: '320元', ticket_price: 320 },
  { id: 'hz-xixi', name: '杭州西溪湿地', city: '杭州', category: '自然景观', description: '中国首个国家湿地公园，电影《非诚勿扰》取景地，保留原生态水乡风貌，城市中的天然氧吧。', longitude: 120.0556, latitude: 30.2611, address: '浙江省杭州市西湖区天目山路518号', rating: 4.6, ticketPrice: '80元', ticket_price: 80 },
  { id: 'hz-qiandao', name: '杭州千岛湖', city: '杭州', category: '自然景观', description: '世界上岛屿最多的湖泊，1078个翠岛散落碧波间，湖水能见度12米，被誉为"天下第一秀水"。', longitude: 119.0444, latitude: 29.6089, address: '浙江省杭州市淳安县千岛湖镇', rating: 4.7, ticketPrice: '150元', ticket_price: 150 },
  { id: 'hz-longjing', name: '杭州龙井村', city: '杭州', category: '自然景观', description: '西湖龙井茶原产地，翠绿茶园层叠山间，可体验采茶、炒茶、品茶全过程。', longitude: 120.11, latitude: 30.22, address: '浙江省杭州市西湖区龙井路龙井村', rating: 4.5, ticketPrice: '免费', ticket_price: 0 },

  // ==================== 苏州 (6) ====================
  { id: 'sz-zhuozheng', name: '苏州拙政园', city: '苏州', category: '人文历史', description: '中国四大名园之首，世界文化遗产。以水景为主布局疏朗自然，中部远香堂和荷花池是精华所在。', longitude: 120.6291, latitude: 31.3229, address: '江苏省苏州市姑苏区东北街178号', rating: 4.8, ticketPrice: '80元', ticket_price: 80 },
  { id: 'sz-liuyuan', name: '苏州留园', city: '苏州', category: '人文历史', description: '中国四大名园之一，以建筑空间处理精湛著称。冠云峰为太湖石极品，被誉为"吴下名园之冠"。', longitude: 120.5889, latitude: 31.3069, address: '江苏省苏州市姑苏区留园路338号', rating: 4.7, ticketPrice: '55元', ticket_price: 55 },
  { id: 'sz-huqiu', name: '苏州虎丘', city: '苏州', category: '人文历史', description: '"吴中第一名胜"，虎丘塔是世界第二斜塔，剑池传说藏有吴王阖闾宝剑。苏东坡曾说"到苏州不游虎丘乃憾事"。', longitude: 120.575, latitude: 31.3378, address: '江苏省苏州市姑苏区虎丘山门内8号', rating: 4.6, ticketPrice: '70元', ticket_price: 70 },
  { id: 'sz-pingjiang', name: '苏州平江路', city: '苏州', category: '人文历史', description: '苏州保存最完整的古街区，保持宋代《平江图》格局。小桥流水、粉墙黛瓦，沿河有百年老店和评弹茶馆。', longitude: 120.6331, latitude: 31.3167, address: '江苏省苏州市姑苏区平江路', rating: 4.6, ticketPrice: '免费', ticket_price: 0 },
  { id: 'sz-zhouzhuang', name: '苏州周庄古镇', city: '苏州', category: '人文历史', description: '"中国第一水乡"，近千年历史。14座古桥、60多栋明清建筑，陈逸飞油画《故乡的回忆》让周庄闻名世界。', longitude: 120.85, latitude: 31.1167, address: '江苏省苏州市昆山市周庄镇', rating: 4.6, ticketPrice: '100元', ticket_price: 100 },
  { id: 'sz-tongli', name: '苏州同里古镇', city: '苏州', category: '人文历史', description: '江南六大古镇之一，"东方小威尼斯"。退思园是世界文化遗产，三桥走一走寓意吉祥。', longitude: 120.7374, latitude: 31.1277, address: '江苏省苏州市吴江区同里镇', rating: 4.5, ticketPrice: '100元', ticket_price: 100 },

  // ==================== 南京 (5) ====================
  { id: 'nj-zhongshanling', name: '南京中山陵', city: '南京', category: '人文历史', description: '孙中山先生陵寝，中国近代建筑史杰作。从牌坊到祭堂392级台阶，寓意当时3.92亿同胞。', longitude: 118.8569, latitude: 32.0578, address: '江苏省南京市玄武区石象路7号', rating: 4.8, ticketPrice: '免费', ticket_price: 0 },
  { id: 'nj-fuzimiao', name: '南京夫子庙', city: '南京', category: '人文历史', description: '中国四大文庙之一，秦淮河畔文化名片。集文化、美食、购物于一体，夜游秦淮河画舫是必体验项目。', longitude: 118.7861, latitude: 32.0278, address: '江苏省南京市秦淮区贡院街152号', rating: 4.5, ticketPrice: '免费', ticket_price: 0 },
  { id: 'nj-zongtongfu', name: '南京总统府', city: '南京', category: '人文历史', description: '中国近代史重要遗址，先后为太平天国天王府、两江总督署、民国总统府。中西合璧建筑群完整保存。', longitude: 118.7917, latitude: 32.0417, address: '江苏省南京市玄武区长江路292号', rating: 4.7, ticketPrice: '40元', ticket_price: 40 },
  { id: 'nj-mingxiaoling', name: '南京明孝陵', city: '南京', category: '人文历史', description: '明太祖朱元璋陵寝，世界文化遗产，明清皇家陵寝之首。秋季石象路银杏和枫叶交织美不胜收。', longitude: 118.8417, latitude: 32.0583, address: '江苏省南京市玄武区石象路', rating: 4.7, ticketPrice: '70元', ticket_price: 70 },
  { id: 'nj-xuanwuhu', name: '南京玄武湖', city: '南京', category: '自然景观', description: '中国最大的皇家园林湖泊，2300多年历史。五洲相连、紫金山倒映湖中，环湖绿道是跑步骑行热门线路。', longitude: 118.7917, latitude: 32.075, address: '江苏省南京市玄武区玄武巷1号', rating: 4.5, ticketPrice: '免费', ticket_price: 0 },

  // ==================== 无锡 (3) ====================
  { id: 'wx-yuantouzhu', name: '无锡鼋头渚', city: '无锡', category: '自然景观', description: '"太湖第一名胜"，春季3万株樱花盛放，被誉为"中华第一赏樱胜地"。可乘船至太湖仙岛。', longitude: 120.2167, latitude: 31.5333, address: '江苏省无锡市滨湖区鼋渚路1号', rating: 4.7, ticketPrice: '90元', ticket_price: 90 },
  { id: 'wx-lingshan', name: '无锡灵山大佛', city: '无锡', category: '人文历史', description: '世界最高释迦牟尼青铜立像高88米，灵山梵宫金碧辉煌，九龙灌浴每天定时表演。', longitude: 120.1, latitude: 31.4167, address: '江苏省无锡市滨湖区马山灵山路1号', rating: 4.7, ticketPrice: '210元', ticket_price: 210 },
  { id: 'wx-huishan', name: '无锡惠山古镇', city: '无锡', category: '人文历史', description: '集寺庙、园林、祠堂于一体，"无锡露天博物馆"。天下第二泉是陆羽品定名泉，惠山泥人是国家级非遗。', longitude: 120.27, latitude: 31.57, address: '江苏省无锡市梁溪区惠山直街', rating: 4.5, ticketPrice: '70元', ticket_price: 70 },

  // ==================== 扬州 (3) ====================
  { id: 'yz-shouxihu', name: '扬州瘦西湖', city: '扬州', category: '自然景观', description: '"烟花三月下扬州"的诗意所在，五亭桥、白塔、二十四桥串联其中，是中国湖上园林的代表。', longitude: 119.4167, latitude: 32.4, address: '江苏省扬州市邗江区大虹桥路28号', rating: 4.7, ticketPrice: '100元', ticket_price: 100 },
  { id: 'yz-geyuan', name: '扬州个园', city: '扬州', category: '人文历史', description: '中国四大名园之一，以竹石取胜。"四季假山"用不同石材堆叠春夏秋冬意境，是叠石艺术巅峰。', longitude: 119.4333, latitude: 32.3917, address: '江苏省扬州市广陵区盐阜东路10号', rating: 4.6, ticketPrice: '45元', ticket_price: 45 },
  { id: 'yz-daming', name: '扬州大明寺', city: '扬州', category: '人文历史', description: '因鉴真大师东渡日本而闻名世界，栖灵塔为扬州最高点，可俯瞰瘦西湖全景。', longitude: 119.42, latitude: 32.4133, address: '江苏省扬州市邗江区平山堂东路8号', rating: 4.5, ticketPrice: '45元', ticket_price: 45 },

  // ==================== 宁波 (2) ====================
  { id: 'nb-tianyige', name: '宁波天一阁', city: '宁波', category: '人文历史', description: '中国现存最早的私家藏书楼，始建于明代，被誉为"亚洲现存最古老的图书馆"。', longitude: 121.55, latitude: 29.8667, address: '浙江省宁波市海曙区天一街10号', rating: 4.6, ticketPrice: '30元', ticket_price: 30 },
  { id: 'nb-xikou', name: '宁波溪口-滕头旅游区', city: '宁波', category: '人文历史', description: '蒋介石故里，集民国历史与自然风光于一体。蒋氏故居、雪窦寺、千丈岩瀑布散布山水间。', longitude: 121.26, latitude: 29.67, address: '浙江省宁波市奉化区溪口镇', rating: 4.6, ticketPrice: '230元', ticket_price: 230 },

  // ==================== 绍兴 (2) ====================
  { id: 'sx-luxun', name: '绍兴鲁迅故里', city: '绍兴', category: '人文历史', description: '鲁迅先生诞生和成长之地，百草园、三味书屋原址保存完好，真实感受鲁迅笔下的绍兴旧时光。', longitude: 120.5833, latitude: 30.0, address: '浙江省绍兴市越城区鲁迅中路241号', rating: 4.6, ticketPrice: '免费', ticket_price: 0 },
  { id: 'sx-anchang', name: '绍兴安昌古镇', city: '绍兴', category: '人文历史', description: '保持原汁原味的绍兴水乡风情，以酱园、酱鸭、腊肠闻名，每年腊月酱香节最热闹。', longitude: 120.49, latitude: 30.08, address: '浙江省绍兴市柯桥区安昌镇', rating: 4.4, ticketPrice: '免费', ticket_price: 0 },

  // ==================== 嘉兴 (3) ====================
  { id: 'jx-wuzhen', name: '嘉兴乌镇', city: '嘉兴', category: '人文历史', description: '世界互联网大会永久举办地，"中国最后的枕水人家"。西栅夜景被誉为中国最美古镇夜景。', longitude: 120.4833, latitude: 30.75, address: '浙江省嘉兴市桐乡市乌镇镇', rating: 4.7, ticketPrice: '150元', ticket_price: 150 },
  { id: 'jx-xitang', name: '嘉兴西塘古镇', city: '嘉兴', category: '人文历史', description: '江南六大古镇之一，1300米烟雨长廊是最大特色，《碟中谍3》取景地。', longitude: 120.8833, latitude: 30.95, address: '浙江省嘉兴市嘉善县西塘镇', rating: 4.6, ticketPrice: '100元', ticket_price: 100 },
  { id: 'jx-nanhu', name: '嘉兴南湖', city: '嘉兴', category: '人文历史', description: '中共一大在南湖红船上完成，中国共产党诞生地。湖心岛有烟雨楼，南湖革命纪念馆免费开放。', longitude: 120.77, latitude: 30.75, address: '浙江省嘉兴市南湖区南湖路1号', rating: 4.5, ticketPrice: '60元', ticket_price: 60 },

  // ==================== 湖州 (2) ====================
  { id: 'huzhou-nanxun', name: '湖州南浔古镇', city: '湖州', category: '人文历史', description: '江南六大古镇之一，以中西合璧建筑风格独树一帜。小莲庄、嘉业堂藏书楼等精美建筑。', longitude: 120.0833, latitude: 30.8667, address: '浙江省湖州市南浔区南浔镇', rating: 4.6, ticketPrice: '100元', ticket_price: 100 },
  { id: 'huzhou-moganshan', name: '湖州莫干山', city: '湖州', category: '自然景观', description: '中国四大避暑胜地之一，"民宿圣地"。山间200+精品民宿点缀竹海茶园。', longitude: 119.87, latitude: 30.63, address: '浙江省湖州市德清县莫干山镇', rating: 4.6, ticketPrice: '80元', ticket_price: 80 },

  // ==================== 舟山 (2) ====================
  { id: 'zs-putuoshan', name: '舟山普陀山', city: '舟山', category: '人文历史', description: '中国佛教四大名山之一，观音菩萨道场，"海天佛国"。南海观音立像高33米面朝大海。', longitude: 122.3842, latitude: 30.0056, address: '浙江省舟山市普陀区普陀山', rating: 4.8, ticketPrice: '160元', ticket_price: 160 },
  { id: 'zs-zhujiajian', name: '舟山朱家尖', city: '舟山', category: '自然景观', description: '十里金沙是华东最大沙滩群，大青山观景台可360度观海，舟山海岛度假首选地。', longitude: 122.3833, latitude: 29.9167, address: '浙江省舟山市普陀区朱家尖镇', rating: 4.5, ticketPrice: '100元', ticket_price: 100 },

  // ==================== 金华 (1) ====================
  { id: 'jh-hengdian', name: '金华横店影视城', city: '金华', category: '主题乐园', description: '"中国好莱坞"，全球规模最大的影视拍摄基地。13个影视主题景区，运气好能偶遇剧组拍摄。', longitude: 120.3, latitude: 29.1833, address: '浙江省金华市东阳市横店镇', rating: 4.6, ticketPrice: '480元', ticket_price: 480 },

  // ==================== 常州 (2) ====================
  { id: 'cz-dinosaur', name: '常州中华恐龙园', city: '常州', category: '主题乐园', description: '"东方侏罗纪"，集科普、娱乐于一体的大型恐龙主题乐园，50余个游乐项目。', longitude: 119.97, latitude: 31.83, address: '江苏省常州市新北区河海东路60号', rating: 4.6, ticketPrice: '260元', ticket_price: 260 },
  { id: 'cz-tianmuhu', name: '常州天目湖', city: '常州', category: '自然景观', description: '清澈湖水和连绵山丘，天目湖砂锅鱼头享誉全国，南山竹海有华东最大竹海。', longitude: 119.45, latitude: 31.26, address: '江苏省常州市溧阳市天目湖镇', rating: 4.6, ticketPrice: '180元', ticket_price: 180 },

  // ==================== 镇江 (2) ====================
  { id: 'zj-jinshan', name: '镇江金山', city: '镇江', category: '人文历史', description: '"白娘子水漫金山"传说发生地。金山寺依山而建，寺裹山的独特格局使人只见寺不见山。', longitude: 119.42, latitude: 32.22, address: '江苏省镇江市润州区金山路62号', rating: 4.6, ticketPrice: '65元', ticket_price: 65 },
  { id: 'zj-xijindu', name: '镇江西津渡', city: '镇江', category: '人文历史', description: '3000多年渡口历史，从三国到清代遗迹层叠，"一座活着的历史博物馆"。', longitude: 119.43, latitude: 32.21, address: '江苏省镇江市润州区长江路西津渡', rating: 4.5, ticketPrice: '免费', ticket_price: 0 },

  // ==================== 温州 (2) ====================
  { id: 'wz-yandang', name: '温州雁荡山', city: '温州', category: '自然景观', description: '世界地质公园，中国十大名山之一。灵峰夜景全国独一无二——白天山峰在夜晚变成各种形象。', longitude: 121.07, latitude: 28.38, address: '浙江省温州市乐清市雁荡镇', rating: 4.7, ticketPrice: '170元', ticket_price: 170 },
  { id: 'wz-nanxijiang', name: '温州楠溪江', city: '温州', category: '自然景观', description: '中国山水诗的摇篮，36湾72滩清澈江水穿越田园古村，竹筏漂流是核心体验。', longitude: 120.67, latitude: 28.54, address: '浙江省温州市永嘉县楠溪江风景区', rating: 4.5, ticketPrice: '80元', ticket_price: 80 },

  // ==================== 南通 (1) ====================
  { id: 'nt-haohe', name: '南通濠河风景区', city: '南通', category: '都市休闲', description: '全国保存最完整的古护城河，全长10公里，被誉为"少女脖子上的翡翠项链"。', longitude: 120.86, latitude: 32.01, address: '江苏省南通市崇川区濠河风景区', rating: 4.4, ticketPrice: '免费', ticket_price: 0 },

  // ==================== 台州 (1) ====================
  { id: 'tz-tiantaishan', name: '台州天台山', city: '台州', category: '人文历史', description: '天台宗发源地，"佛宗道源"之地。国清寺是天台宗祖庭，石梁飞瀑是罕见花岗岩天生桥。', longitude: 121.02, latitude: 29.14, address: '浙江省台州市天台县天台山', rating: 4.6, ticketPrice: '100元', ticket_price: 100 },
];

export const JIANGNAN_ROUTE_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b',
  '#ef4444', '#ec4899', '#14b8a6',
];

export const getLocationsByCity = (city) => {
  return JIANGNAN_LOCATIONS.filter(loc => loc.city === city);
};

export const getLocationById = (id) => {
  return JIANGNAN_LOCATIONS.find(loc => loc.id === id);
};

export const getRouteLocations = () => {
  return [
    getLocationById('hz-westlake'),
    getLocationById('sz-zhuozheng'),
    getLocationById('sh-bund'),
  ].filter(Boolean);
};
