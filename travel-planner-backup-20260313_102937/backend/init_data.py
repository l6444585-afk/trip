"""
江浙沪旅游数据初始化脚本
包含：城市、景点、交通矩阵、餐厅数据
"""
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, City, Attraction, TransportMatrix, Restaurant
import json

CITIES_DATA = [
    {
        "name": "上海",
        "province": "上海",
        "latitude": 31.2304,
        "longitude": 121.4737,
        "description": "国际大都市，融合东西方文化，拥有外滩、豫园、迪士尼等知名景点",
        "best_season": "春秋",
        "avg_daily_cost": 800,
        "highlights": ["外滩", "迪士尼", "豫园", "新天地", "田子坊"]
    },
    {
        "name": "杭州",
        "province": "浙江",
        "latitude": 30.2741,
        "longitude": 120.1551,
        "description": "人间天堂，西湖美景闻名天下，龙井茶香四溢",
        "best_season": "春秋",
        "avg_daily_cost": 600,
        "highlights": ["西湖", "灵隐寺", "西溪湿地", "宋城", "龙井村"]
    },
    {
        "name": "苏州",
        "province": "江苏",
        "latitude": 31.2990,
        "longitude": 120.5853,
        "description": "园林之城，小桥流水人家，吴文化发源地",
        "best_season": "春秋",
        "avg_daily_cost": 500,
        "highlights": ["拙政园", "留园", "虎丘", "平江路", "寒山寺"]
    },
    {
        "name": "南京",
        "province": "江苏",
        "latitude": 32.0603,
        "longitude": 118.7969,
        "description": "六朝古都，历史文化名城，民国风情浓郁",
        "best_season": "春秋",
        "avg_daily_cost": 500,
        "highlights": ["中山陵", "夫子庙", "玄武湖", "总统府", "明孝陵"]
    },
    {
        "name": "无锡",
        "province": "江苏",
        "latitude": 31.4912,
        "longitude": 120.3119,
        "description": "太湖明珠，鼋头渚樱花烂漫，灵山大佛庄严",
        "best_season": "春秋",
        "avg_daily_cost": 450,
        "highlights": ["鼋头渚", "灵山大佛", "拈花湾", "三国城", "蠡园"]
    },
    {
        "name": "扬州",
        "province": "江苏",
        "latitude": 32.3912,
        "longitude": 119.4129,
        "description": "烟花三月下扬州，瘦西湖畔柳如烟",
        "best_season": "春季",
        "avg_daily_cost": 400,
        "highlights": ["瘦西湖", "个园", "何园", "大明寺", "东关街"]
    },
    {
        "name": "绍兴",
        "province": "浙江",
        "latitude": 30.0000,
        "longitude": 120.5833,
        "description": "鲁迅故里，水乡古镇，黄酒飘香",
        "best_season": "春秋",
        "avg_daily_cost": 350,
        "highlights": ["鲁迅故里", "沈园", "兰亭", "东湖", "安昌古镇"]
    },
    {
        "name": "嘉兴",
        "province": "浙江",
        "latitude": 30.7468,
        "longitude": 120.7509,
        "description": "南湖红船，乌镇水乡，粽子之乡",
        "best_season": "春秋",
        "avg_daily_cost": 400,
        "highlights": ["乌镇", "西塘", "南湖", "月河历史街区"]
    },
    {
        "name": "宁波",
        "province": "浙江",
        "latitude": 29.8683,
        "longitude": 121.5440,
        "description": "港口城市，天一阁藏书，海鲜美食",
        "best_season": "春秋",
        "avg_daily_cost": 500,
        "highlights": ["天一阁", "老外滩", "溪口", "东钱湖", "象山影视城"]
    },
    {
        "name": "常州",
        "province": "江苏",
        "latitude": 31.8122,
        "longitude": 119.9692,
        "description": "恐龙之乡，天目湖山水秀美",
        "best_season": "春秋",
        "avg_daily_cost": 400,
        "highlights": ["中华恐龙园", "天目湖", "南山竹海", "淹城春秋乐园"]
    }
]

ATTRACTIONS_DATA = [
    {
        "name": "外滩",
        "city": "上海",
        "category": "地标建筑",
        "description": "上海的标志性景观，万国建筑博览群，黄浦江畔欣赏陆家嘴天际线的最佳位置",
        "latitude": 31.2400,
        "longitude": 121.4900,
        "address": "上海市黄浦区中山东一路",
        "rating": 4.8,
        "avg_visit_duration": 120,
        "open_time": "00:00",
        "close_time": "23:59",
        "ticket_price": 0,
        "booking_required": False,
        "tags": "地标建筑,夜景,摄影,免费,历史建筑",
        "suitable_for": "情侣,家庭,朋友,独行,亲子",
        "best_time_to_visit": "傍晚至夜间",
        "peak_hours": "18:00-21:00",
        "tips": "建议傍晚前往，可同时欣赏日落和夜景。周末人流量大，注意安全。",
        "warnings": "节假日人流量极大，建议错峰出行"
    },
    {
        "name": "上海迪士尼乐园",
        "city": "上海",
        "category": "主题乐园",
        "description": "中国大陆首座迪士尼主题乐园，拥有全球最大的迪士尼城堡",
        "latitude": 31.1443,
        "longitude": 121.6570,
        "address": "上海市浦东新区川沙镇黄赵路310号",
        "rating": 4.7,
        "avg_visit_duration": 600,
        "open_time": "08:30",
        "close_time": "21:00",
        "ticket_price": 475,
        "ticket_price_peak": 665,
        "booking_required": True,
        "booking_advance_days": 3,
        "booking_url": "https://www.shanghaidisneyresort.com/",
        "tags": "主题乐园,亲子,童话,烟花,游乐设施",
        "suitable_for": "亲子,情侣,朋友,家庭",
        "best_time_to_visit": "工作日",
        "peak_hours": "10:00-15:00",
        "tips": "建议提前下载APP预约项目，早到可先玩热门项目。自带食物可节省开支。",
        "warnings": "节假日排队时间极长，建议购买快速通行证"
    },
    {
        "name": "豫园",
        "city": "上海",
        "category": "古典园林",
        "description": "明代私家园林，江南古典园林艺术的瑰宝，毗邻城隍庙商圈",
        "latitude": 31.2270,
        "longitude": 121.4920,
        "address": "上海市黄浦区福佑路168号",
        "rating": 4.5,
        "avg_visit_duration": 150,
        "open_time": "09:00",
        "close_time": "16:30",
        "ticket_price": 40,
        "booking_required": False,
        "tags": "古典园林,历史文化,摄影,建筑",
        "suitable_for": "家庭,情侣,朋友,独行",
        "best_time_to_visit": "上午",
        "peak_hours": "10:00-14:00",
        "tips": "可搭配城隍庙小吃一起游览，建议预留半天时间",
        "warnings": "周一部分展厅可能闭馆维护"
    },
    {
        "name": "西湖",
        "city": "杭州",
        "category": "自然风光",
        "description": "世界文化遗产，杭州的城市名片，苏堤春晓、断桥残雪等十景闻名天下",
        "latitude": 30.2592,
        "longitude": 120.1489,
        "address": "杭州市西湖区龙井路1号",
        "rating": 4.9,
        "avg_visit_duration": 240,
        "open_time": "00:00",
        "close_time": "23:59",
        "ticket_price": 0,
        "booking_required": False,
        "tags": "自然风光,世界遗产,免费,骑行,摄影",
        "suitable_for": "情侣,家庭,朋友,独行,亲子",
        "best_time_to_visit": "春秋两季",
        "peak_hours": "10:00-16:00",
        "tips": "建议租借公共自行车环湖骑行，清晨和傍晚人少景美",
        "warnings": "节假日人流量极大，建议避开断桥等热门景点"
    },
    {
        "name": "灵隐寺",
        "city": "杭州",
        "category": "宗教文化",
        "description": "江南著名古刹，始建于东晋，济公出家之地，飞来峰石刻精美",
        "latitude": 30.2397,
        "longitude": 120.1008,
        "address": "杭州市西湖区灵隐路法云弄1号",
        "rating": 4.6,
        "avg_visit_duration": 180,
        "open_time": "07:00",
        "close_time": "18:00",
        "ticket_price": 75,
        "booking_required": False,
        "tags": "宗教文化,古刹,历史,飞来峰",
        "suitable_for": "家庭,朋友,独行",
        "best_time_to_visit": "上午",
        "peak_hours": "09:00-12:00",
        "tips": "建议早到避开人流，飞来峰石窟值得细看",
        "warnings": "寺内禁止拍照，注意着装得体"
    },
    {
        "name": "拙政园",
        "city": "苏州",
        "category": "古典园林",
        "description": "中国四大名园之一，苏州园林的代表作品，世界文化遗产",
        "latitude": 31.3170,
        "longitude": 120.6330,
        "address": "苏州市姑苏区东北街178号",
        "rating": 4.8,
        "avg_visit_duration": 180,
        "open_time": "07:30",
        "close_time": "17:30",
        "ticket_price": 80,
        "ticket_price_peak": 80,
        "booking_required": True,
        "booking_advance_days": 1,
        "booking_url": "https://www.szmuseum.com/",
        "tags": "古典园林,世界遗产,摄影,建筑",
        "suitable_for": "家庭,情侣,朋友,独行",
        "best_time_to_visit": "春夏",
        "peak_hours": "10:00-14:00",
        "tips": "建议请导游讲解，能更好理解园林艺术。夏季荷花盛开时最美。",
        "warnings": "需提前预约，节假日门票紧张"
    },
    {
        "name": "苏州博物馆",
        "city": "苏州",
        "category": "博物馆",
        "description": "建筑大师贝聿铭封山之作，现代建筑与传统园林的完美结合",
        "latitude": 31.3150,
        "longitude": 120.6300,
        "address": "苏州市姑苏区东北街204号",
        "rating": 4.8,
        "avg_visit_duration": 150,
        "open_time": "09:00",
        "close_time": "17:00",
        "closed_days": "周一",
        "ticket_price": 0,
        "booking_required": True,
        "booking_advance_days": 7,
        "booking_url": "https://www.szmuseum.com/",
        "tags": "博物馆,建筑艺术,免费,贝聿铭",
        "suitable_for": "家庭,朋友,独行,亲子",
        "best_time_to_visit": "工作日上午",
        "peak_hours": "10:00-14:00",
        "tips": "需提前7天预约，建议与拙政园同日游览",
        "warnings": "周一闭馆，节假日预约难度极大"
    },
    {
        "name": "中山陵",
        "city": "南京",
        "category": "历史遗迹",
        "description": "孙中山先生陵寝，中国近代建筑史上的杰作，南京地标",
        "latitude": 32.0576,
        "longitude": 118.8567,
        "address": "南京市玄武区石象路7号",
        "rating": 4.7,
        "avg_visit_duration": 180,
        "open_time": "08:30",
        "close_time": "17:00",
        "ticket_price": 0,
        "booking_required": True,
        "booking_advance_days": 1,
        "booking_url": "http://www.zschina.org/",
        "tags": "历史遗迹,免费,民国,建筑",
        "suitable_for": "家庭,朋友,独行,亲子",
        "best_time_to_visit": "春秋",
        "peak_hours": "10:00-14:00",
        "tips": "需提前预约，建议穿舒适的鞋子，台阶较多",
        "warnings": "周一祭堂闭馆维护"
    },
    {
        "name": "夫子庙秦淮河",
        "city": "南京",
        "category": "历史街区",
        "description": "十里秦淮，六朝金粉，南京最具人气的文化街区",
        "latitude": 32.0400,
        "longitude": 118.7940,
        "address": "南京市秦淮区贡院街",
        "rating": 4.5,
        "avg_visit_duration": 180,
        "open_time": "09:00",
        "close_time": "22:00",
        "ticket_price": 0,
        "booking_required": False,
        "tags": "历史街区,夜景,美食,秦淮河",
        "suitable_for": "情侣,家庭,朋友,独行",
        "best_time_to_visit": "傍晚至夜间",
        "peak_hours": "18:00-21:00",
        "tips": "建议傍晚前往，夜游秦淮河别有风味",
        "warnings": "节假日人流量极大，注意财物安全"
    },
    {
        "name": "鼋头渚",
        "city": "无锡",
        "category": "自然风光",
        "description": "太湖第一名胜，世界三大赏樱胜地之一，春季樱花烂漫",
        "latitude": 31.5300,
        "longitude": 120.2300,
        "address": "无锡市滨湖区鼋渚路1号",
        "rating": 4.7,
        "avg_visit_duration": 240,
        "open_time": "08:00",
        "close_time": "17:00",
        "ticket_price": 90,
        "booking_required": False,
        "tags": "自然风光,樱花,太湖,摄影",
        "suitable_for": "家庭,情侣,朋友,亲子",
        "best_time_to_visit": "3-4月樱花季",
        "peak_hours": "10:00-14:00",
        "tips": "樱花季建议工作日前往，可乘船游太湖",
        "warnings": "樱花季人流量极大，建议提前规划"
    },
    {
        "name": "灵山大佛",
        "city": "无锡",
        "category": "宗教文化",
        "description": "世界最高的释迦牟尼青铜立像，88米大佛巍峨壮观",
        "latitude": 31.4167,
        "longitude": 120.1000,
        "address": "无锡市滨湖区马山灵山路1号",
        "rating": 4.6,
        "avg_visit_duration": 240,
        "open_time": "07:30",
        "close_time": "17:30",
        "ticket_price": 210,
        "booking_required": False,
        "tags": "宗教文化,大佛,佛教,建筑",
        "suitable_for": "家庭,朋友,独行",
        "best_time_to_visit": "春秋",
        "peak_hours": "10:00-14:00",
        "tips": "建议观看九龙灌浴表演，可抱佛脚祈福",
        "warnings": "景区较大，建议预留充足时间"
    },
    {
        "name": "瘦西湖",
        "city": "扬州",
        "category": "自然风光",
        "description": "扬州标志性景点，湖上园林，烟花三月下扬州的最佳去处",
        "latitude": 32.4000,
        "longitude": 119.4200,
        "address": "扬州市邗江区大虹桥路28号",
        "rating": 4.7,
        "avg_visit_duration": 240,
        "open_time": "06:30",
        "close_time": "18:00",
        "ticket_price": 100,
        "ticket_price_peak": 150,
        "booking_required": False,
        "tags": "自然风光,园林,湖泊,摄影",
        "suitable_for": "家庭,情侣,朋友,独行",
        "best_time_to_visit": "3-5月",
        "peak_hours": "10:00-14:00",
        "tips": "建议乘船游览，春季琼花盛开时最美",
        "warnings": "节假日门票可能上涨"
    },
    {
        "name": "鲁迅故里",
        "city": "绍兴",
        "category": "历史遗迹",
        "description": "鲁迅先生诞生和成长的地方，百草园、三味书屋原址保留",
        "latitude": 30.0000,
        "longitude": 120.5833,
        "address": "绍兴市越城区鲁迅中路235号",
        "rating": 4.6,
        "avg_visit_duration": 150,
        "open_time": "08:30",
        "close_time": "17:00",
        "ticket_price": 0,
        "booking_required": True,
        "booking_advance_days": 1,
        "booking_url": "http://www.luxunmuseum.com/",
        "tags": "历史遗迹,名人故居,免费,文化",
        "suitable_for": "家庭,朋友,独行,亲子",
        "best_time_to_visit": "全年",
        "peak_hours": "10:00-14:00",
        "tips": "需凭身份证免费领取门票，建议请导游讲解",
        "warnings": "周一闭馆"
    },
    {
        "name": "乌镇",
        "city": "嘉兴",
        "category": "古镇水乡",
        "description": "江南四大名镇之一，小桥流水人家，夜色迷人",
        "latitude": 30.7468,
        "longitude": 120.4870,
        "address": "嘉兴市桐乡市乌镇石佛南路18号",
        "rating": 4.7,
        "avg_visit_duration": 360,
        "open_time": "07:00",
        "close_time": "22:00",
        "ticket_price": 150,
        "ticket_price_peak": 190,
        "booking_required": False,
        "tags": "古镇水乡,夜景,民宿,摄影",
        "suitable_for": "情侣,家庭,朋友,独行",
        "best_time_to_visit": "春秋",
        "peak_hours": "10:00-16:00",
        "tips": "建议住一晚体验夜景，清晨人少景美",
        "warnings": "节假日人流量大，建议提前预订住宿"
    },
    {
        "name": "西塘古镇",
        "city": "嘉兴",
        "category": "古镇水乡",
        "description": "活着的千年古镇，烟雨长廊独具特色",
        "latitude": 30.9480,
        "longitude": 120.8880,
        "address": "嘉兴市嘉善县西塘镇南苑路258号",
        "rating": 4.6,
        "avg_visit_duration": 300,
        "open_time": "08:00",
        "close_time": "21:00",
        "ticket_price": 100,
        "booking_required": False,
        "tags": "古镇水乡,夜景,烟雨长廊,摄影",
        "suitable_for": "情侣,家庭,朋友,独行",
        "best_time_to_visit": "春秋",
        "peak_hours": "10:00-16:00",
        "tips": "傍晚后进入可免门票，夜游别有风味",
        "warnings": "周末人流量较大"
    },
    {
        "name": "天一阁",
        "city": "宁波",
        "category": "博物馆",
        "description": "亚洲现有最古老的图书馆，明代藏书楼，书香四溢",
        "latitude": 29.8683,
        "longitude": 121.5440,
        "address": "宁波市海曙区天一街10号",
        "rating": 4.6,
        "avg_visit_duration": 120,
        "open_time": "08:30",
        "close_time": "17:30",
        "closed_days": "周一",
        "ticket_price": 30,
        "booking_required": False,
        "tags": "博物馆,藏书楼,历史,文化",
        "suitable_for": "家庭,朋友,独行",
        "best_time_to_visit": "全年",
        "peak_hours": "10:00-14:00",
        "tips": "建议请导游讲解，了解藏书历史",
        "warnings": "周一闭馆"
    },
    {
        "name": "中华恐龙园",
        "city": "常州",
        "category": "主题乐园",
        "description": "中国首个恐龙主题公园，集科普、娱乐、休闲于一体",
        "latitude": 31.8122,
        "longitude": 119.9692,
        "address": "常州市新北区汉江路1号",
        "rating": 4.5,
        "avg_visit_duration": 420,
        "open_time": "09:00",
        "close_time": "17:00",
        "ticket_price": 260,
        "booking_required": False,
        "tags": "主题乐园,亲子,恐龙,游乐设施",
        "suitable_for": "亲子,家庭,朋友",
        "best_time_to_visit": "春秋",
        "peak_hours": "10:00-15:00",
        "tips": "建议早到先玩热门项目，夏季有水上乐园",
        "warnings": "节假日排队时间较长"
    }
]

TRANSPORT_MATRIX_DATA = [
    {"from_city": "上海", "to_city": "杭州", "transport_type": "高铁", "duration_minutes": 45, "cost_min": 73, "cost_max": 117, "frequency": "每10-20分钟一班", "notes": "上海虹桥-杭州东"},
    {"from_city": "上海", "to_city": "苏州", "transport_type": "高铁", "duration_minutes": 25, "cost_min": 40, "cost_max": 60, "frequency": "每5-10分钟一班", "notes": "上海虹桥-苏州北"},
    {"from_city": "上海", "to_city": "南京", "transport_type": "高铁", "duration_minutes": 60, "cost_min": 134, "cost_max": 220, "frequency": "每10-15分钟一班", "notes": "上海虹桥-南京南"},
    {"from_city": "上海", "to_city": "无锡", "transport_type": "高铁", "duration_minutes": 35, "cost_min": 50, "cost_max": 80, "frequency": "每10分钟一班", "notes": "上海虹桥-无锡东"},
    {"from_city": "上海", "to_city": "扬州", "transport_type": "高铁", "duration_minutes": 90, "cost_min": 110, "cost_max": 180, "frequency": "每30分钟一班", "notes": "上海虹桥-扬州东"},
    {"from_city": "上海", "to_city": "绍兴", "transport_type": "高铁", "duration_minutes": 75, "cost_min": 90, "cost_max": 140, "frequency": "每20分钟一班", "notes": "上海虹桥-绍兴北"},
    {"from_city": "上海", "to_city": "嘉兴", "transport_type": "高铁", "duration_minutes": 30, "cost_min": 35, "cost_max": 55, "frequency": "每15分钟一班", "notes": "上海虹桥-嘉兴南"},
    {"from_city": "上海", "to_city": "宁波", "transport_type": "高铁", "duration_minutes": 100, "cost_min": 140, "cost_max": 220, "frequency": "每15分钟一班", "notes": "上海虹桥-宁波"},
    {"from_city": "上海", "to_city": "常州", "transport_type": "高铁", "duration_minutes": 40, "cost_min": 55, "cost_max": 85, "frequency": "每10分钟一班", "notes": "上海虹桥-常州北"},
    {"from_city": "杭州", "to_city": "苏州", "transport_type": "高铁", "duration_minutes": 90, "cost_min": 110, "cost_max": 180, "frequency": "每20分钟一班", "notes": "杭州东-苏州北"},
    {"from_city": "杭州", "to_city": "南京", "transport_type": "高铁", "duration_minutes": 70, "cost_min": 120, "cost_max": 200, "frequency": "每15分钟一班", "notes": "杭州东-南京南"},
    {"from_city": "杭州", "to_city": "无锡", "transport_type": "高铁", "duration_minutes": 60, "cost_min": 80, "cost_max": 130, "frequency": "每20分钟一班", "notes": "杭州东-无锡东"},
    {"from_city": "杭州", "to_city": "绍兴", "transport_type": "高铁", "duration_minutes": 20, "cost_min": 25, "cost_max": 40, "frequency": "每10分钟一班", "notes": "杭州东-绍兴北"},
    {"from_city": "杭州", "to_city": "嘉兴", "transport_type": "高铁", "duration_minutes": 25, "cost_min": 30, "cost_max": 50, "frequency": "每15分钟一班", "notes": "杭州东-嘉兴南"},
    {"from_city": "杭州", "to_city": "宁波", "transport_type": "高铁", "duration_minutes": 55, "cost_min": 70, "cost_max": 110, "frequency": "每10分钟一班", "notes": "杭州东-宁波"},
    {"from_city": "苏州", "to_city": "南京", "transport_type": "高铁", "duration_minutes": 50, "cost_min": 90, "cost_max": 150, "frequency": "每15分钟一班", "notes": "苏州北-南京南"},
    {"from_city": "苏州", "to_city": "无锡", "transport_type": "高铁", "duration_minutes": 15, "cost_min": 20, "cost_max": 30, "frequency": "每10分钟一班", "notes": "苏州北-无锡东"},
    {"from_city": "苏州", "to_city": "扬州", "transport_type": "高铁", "duration_minutes": 60, "cost_min": 80, "cost_max": 130, "frequency": "每30分钟一班", "notes": "苏州北-扬州东"},
    {"from_city": "苏州", "to_city": "常州", "transport_type": "高铁", "duration_minutes": 20, "cost_min": 25, "cost_max": 40, "frequency": "每10分钟一班", "notes": "苏州北-常州北"},
    {"from_city": "南京", "to_city": "无锡", "transport_type": "高铁", "duration_minutes": 40, "cost_min": 70, "cost_max": 110, "frequency": "每15分钟一班", "notes": "南京南-无锡东"},
    {"from_city": "南京", "to_city": "扬州", "transport_type": "高铁", "duration_minutes": 30, "cost_min": 40, "cost_max": 65, "frequency": "每20分钟一班", "notes": "南京南-扬州东"},
    {"from_city": "南京", "to_city": "常州", "transport_type": "高铁", "duration_minutes": 30, "cost_min": 50, "cost_max": 80, "frequency": "每15分钟一班", "notes": "南京南-常州北"},
    {"from_city": "无锡", "to_city": "扬州", "transport_type": "高铁", "duration_minutes": 45, "cost_min": 60, "cost_max": 100, "frequency": "每30分钟一班", "notes": "无锡东-扬州东"},
    {"from_city": "无锡", "to_city": "常州", "transport_type": "高铁", "duration_minutes": 10, "cost_min": 15, "cost_max": 25, "frequency": "每10分钟一班", "notes": "无锡东-常州北"},
    {"from_city": "嘉兴", "to_city": "宁波", "transport_type": "高铁", "duration_minutes": 70, "cost_min": 100, "cost_max": 160, "frequency": "每20分钟一班", "notes": "嘉兴南-宁波"},
    {"from_city": "上海", "to_city": "杭州", "transport_type": "自驾", "duration_minutes": 150, "cost_min": 120, "cost_max": 150, "frequency": "随时", "notes": "约180公里，高速费约80元"},
    {"from_city": "上海", "to_city": "苏州", "transport_type": "自驾", "duration_minutes": 90, "cost_min": 60, "cost_max": 80, "frequency": "随时", "notes": "约100公里，高速费约40元"},
    {"from_city": "上海", "to_city": "南京", "transport_type": "自驾", "duration_minutes": 240, "cost_min": 200, "cost_max": 250, "frequency": "随时", "notes": "约300公里，高速费约140元"},
    {"from_city": "杭州", "to_city": "苏州", "transport_type": "自驾", "duration_minutes": 150, "cost_min": 120, "cost_max": 150, "frequency": "随时", "notes": "约160公里，高速费约70元"},
    {"from_city": "苏州", "to_city": "无锡", "transport_type": "自驾", "duration_minutes": 40, "cost_min": 30, "cost_max": 40, "frequency": "随时", "notes": "约50公里，高速费约20元"},
]

RESTAURANTS_DATA = [
    {
        "name": "松鹤楼",
        "city": "苏州",
        "address": "苏州市姑苏区观前街141号",
        "latitude": 31.3100,
        "longitude": 120.6200,
        "category": "苏帮菜",
        "cuisine_type": "苏菜",
        "price_level": 4,
        "avg_cost_per_person": 150,
        "rating": 4.5,
        "open_time": "10:00",
        "close_time": "21:00",
        "specialty_dishes": "松鼠桂鱼,响油鳝丝,清炒虾仁",
        "suitable_for": "家庭,朋友,商务",
        "tags": "老字号,苏帮菜,观前街",
        "tips": "建议提前预约，松鼠桂鱼是招牌"
    },
    {
        "name": "楼外楼",
        "city": "杭州",
        "address": "杭州市西湖区孤山路30号",
        "latitude": 30.2500,
        "longitude": 120.1400,
        "category": "杭帮菜",
        "cuisine_type": "浙菜",
        "price_level": 4,
        "avg_cost_per_person": 180,
        "rating": 4.4,
        "open_time": "10:00",
        "close_time": "21:00",
        "specialty_dishes": "西湖醋鱼,东坡肉,龙井虾仁",
        "suitable_for": "家庭,朋友,商务",
        "tags": "老字号,杭帮菜,西湖边",
        "tips": "西湖醋鱼是招牌，建议提前预约"
    },
    {
        "name": "外婆家",
        "city": "杭州",
        "address": "杭州市西湖区马塍路6-1号",
        "latitude": 30.2800,
        "longitude": 120.1600,
        "category": "杭帮菜",
        "cuisine_type": "浙菜",
        "price_level": 2,
        "avg_cost_per_person": 60,
        "rating": 4.3,
        "open_time": "10:00",
        "close_time": "22:00",
        "specialty_dishes": "茶香鸡,麻婆豆腐,西湖牛肉羹",
        "suitable_for": "家庭,朋友,情侣",
        "tags": "连锁,性价比,杭帮菜",
        "tips": "排队较久，建议提前取号"
    },
    {
        "name": "南京大牌档",
        "city": "南京",
        "address": "南京市秦淮区中山门大街9号",
        "latitude": 32.0400,
        "longitude": 118.8000,
        "category": "金陵菜",
        "cuisine_type": "苏菜",
        "price_level": 3,
        "avg_cost_per_person": 80,
        "rating": 4.4,
        "open_time": "10:00",
        "close_time": "22:00",
        "specialty_dishes": "金陵烤鸭,盐水鸭,鸭血粉丝汤",
        "suitable_for": "家庭,朋友,亲子",
        "tags": "老字号,金陵菜,特色",
        "tips": "环境有特色，适合体验南京风味"
    },
    {
        "name": "南翔馒头店",
        "city": "上海",
        "address": "上海市黄浦区豫园路85号",
        "latitude": 31.2270,
        "longitude": 120.4920,
        "category": "小吃",
        "cuisine_type": "上海本帮",
        "price_level": 2,
        "avg_cost_per_person": 40,
        "rating": 4.3,
        "open_time": "07:00",
        "close_time": "21:00",
        "specialty_dishes": "南翔小笼包,蟹黄灌汤包",
        "suitable_for": "家庭,朋友,独行",
        "tags": "老字号,小吃,小笼包",
        "tips": "排队较长，建议错峰前往"
    },
    {
        "name": "老正兴",
        "city": "上海",
        "address": "上海市黄浦区福州路556号",
        "latitude": 31.2350,
        "longitude": 121.4800,
        "category": "本帮菜",
        "cuisine_type": "上海本帮",
        "price_level": 3,
        "avg_cost_per_person": 100,
        "rating": 4.4,
        "open_time": "10:00",
        "close_time": "21:00",
        "specialty_dishes": "草头圈子,油爆虾,红烧肉",
        "suitable_for": "家庭,朋友,商务",
        "tags": "老字号,本帮菜,福州路",
        "tips": "草头圈子是招牌，适合体验上海风味"
    }
]

def init_database(force_recreate: bool = False):
    if force_recreate:
        Base.metadata.drop_all(bind=engine)
        print("已删除旧表结构")
    
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        city_count = db.query(City).count()
        if city_count > 0:
            print(f"数据库已初始化，跳过数据导入")
            return
        
        print("开始初始化城市数据...")
        for city_data in CITIES_DATA:
            city_data_copy = city_data.copy()
            city_data_copy["highlights"] = json.dumps(city_data_copy["highlights"], ensure_ascii=False)
            city = City(**city_data_copy)
            db.add(city)
        db.commit()
        print(f"已导入 {len(CITIES_DATA)} 个城市")
        
        city_map = {c.name: c.id for c in db.query(City).all()}
        
        print("开始初始化景点数据...")
        for attr_data in ATTRACTIONS_DATA:
            attr_data_copy = attr_data.copy()
            if isinstance(attr_data_copy.get("tags"), list):
                attr_data_copy["tags"] = ",".join(attr_data_copy["tags"])
            if isinstance(attr_data_copy.get("suitable_for"), list):
                attr_data_copy["suitable_for"] = ",".join(attr_data_copy["suitable_for"])
            attr_data_copy["city_id"] = city_map.get(attr_data_copy["city"])
            attraction = Attraction(**attr_data_copy)
            db.add(attraction)
        db.commit()
        print(f"已导入 {len(ATTRACTIONS_DATA)} 个景点")
        
        print("开始初始化交通矩阵数据...")
        for transport_data in TRANSPORT_MATRIX_DATA:
            transport = TransportMatrix(**transport_data)
            db.add(transport)
        db.commit()
        print(f"已导入 {len(TRANSPORT_MATRIX_DATA)} 条交通数据")
        
        print("开始初始化餐厅数据...")
        for rest_data in RESTAURANTS_DATA:
            rest_data_copy = rest_data.copy()
            if isinstance(rest_data_copy.get("specialty_dishes"), list):
                rest_data_copy["specialty_dishes"] = ",".join(rest_data_copy["specialty_dishes"])
            if isinstance(rest_data_copy.get("suitable_for"), list):
                rest_data_copy["suitable_for"] = ",".join(rest_data_copy["suitable_for"])
            if isinstance(rest_data_copy.get("tags"), list):
                rest_data_copy["tags"] = ",".join(rest_data_copy["tags"])
            restaurant = Restaurant(**rest_data_copy)
            db.add(restaurant)
        db.commit()
        print(f"已导入 {len(RESTAURANTS_DATA)} 家餐厅")
        
        print("数据库初始化完成！")
        
    except Exception as e:
        print(f"初始化失败: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    force = "--force" in sys.argv or "-f" in sys.argv
    init_database(force_recreate=force)
