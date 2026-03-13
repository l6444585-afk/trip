"""
扩充版江浙沪旅游数据
包含50+景点、更多餐厅、酒店和交通数据
"""
from datetime import datetime

CITIES_DATA = [
    {"name": "上海", "province": "上海", "latitude": 31.2304, "longitude": 121.4737, "description": "国际大都市，融合东西方文化", "best_season": "春秋", "avg_daily_cost": 800, "highlights": ["外滩", "迪士尼", "豫园"]},
    {"name": "杭州", "province": "浙江", "latitude": 30.2741, "longitude": 120.1551, "description": "人间天堂，西湖美景闻名天下", "best_season": "春秋", "avg_daily_cost": 600, "highlights": ["西湖", "灵隐寺", "西溪湿地"]},
    {"name": "苏州", "province": "江苏", "latitude": 31.2990, "longitude": 120.5853, "description": "园林之城，小桥流水人家", "best_season": "春秋", "avg_daily_cost": 500, "highlights": ["拙政园", "留园", "虎丘"]},
    {"name": "南京", "province": "江苏", "latitude": 32.0603, "longitude": 118.7969, "description": "六朝古都，历史文化名城", "best_season": "春秋", "avg_daily_cost": 500, "highlights": ["中山陵", "夫子庙", "玄武湖"]},
    {"name": "无锡", "province": "江苏", "latitude": 31.4912, "longitude": 120.3119, "description": "太湖明珠，鼋头渚樱花烂漫", "best_season": "春秋", "avg_daily_cost": 450, "highlights": ["鼋头渚", "灵山大佛", "拈花湾"]},
    {"name": "扬州", "province": "江苏", "latitude": 32.3912, "longitude": 119.4129, "description": "烟花三月下扬州，瘦西湖畔柳如烟", "best_season": "春季", "avg_daily_cost": 400, "highlights": ["瘦西湖", "个园", "何园"]},
    {"name": "绍兴", "province": "浙江", "latitude": 30.0000, "longitude": 120.5833, "description": "鲁迅故里，水乡古镇", "best_season": "春秋", "avg_daily_cost": 350, "highlights": ["鲁迅故里", "沈园", "兰亭"]},
    {"name": "嘉兴", "province": "浙江", "latitude": 30.7468, "longitude": 120.7509, "description": "南湖红船，乌镇水乡", "best_season": "春秋", "avg_daily_cost": 400, "highlights": ["乌镇", "西塘", "南湖"]},
    {"name": "宁波", "province": "浙江", "latitude": 29.8683, "longitude": 121.5440, "description": "港口城市，天一阁藏书", "best_season": "春秋", "avg_daily_cost": 500, "highlights": ["天一阁", "老外滩", "溪口"]},
    {"name": "常州", "province": "江苏", "latitude": 31.8122, "longitude": 119.9692, "description": "恐龙之乡，天目湖山水秀美", "best_season": "春秋", "avg_daily_cost": 400, "highlights": ["中华恐龙园", "天目湖", "南山竹海"]}
]

ATTRACTIONS_DATA = [
    {"name": "外滩", "city": "上海", "category": "地标建筑", "description": "上海的标志性景观，万国建筑博览群", "latitude": 31.2400, "longitude": 121.4900, "address": "上海市黄浦区中山东一路", "rating": 4.8, "avg_visit_duration": 120, "open_time": "00:00", "close_time": "23:59", "ticket_price": 0, "booking_required": False, "tags": "地标建筑,夜景,摄影,免费,历史建筑", "suitable_for": "情侣,家庭,朋友,独行,亲子", "best_time_to_visit": "傍晚至夜间", "peak_hours": "18:00-21:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "建议傍晚前往，可同时欣赏日落和夜景", "warnings": "节假日人流量极大"},
    {"name": "上海迪士尼乐园", "city": "上海", "category": "主题乐园", "description": "中国大陆首座迪士尼主题乐园", "latitude": 31.1443, "longitude": 121.6570, "address": "上海市浦东新区川沙镇黄赵路310号", "rating": 4.7, "avg_visit_duration": 600, "open_time": "08:30", "close_time": "21:00", "ticket_price": 475, "ticket_price_peak": 665, "ticket_price_student": None, "ticket_price_child": 356, "booking_required": True, "booking_advance_days": 3, "booking_url": "https://www.shanghaidisneyresort.com/", "tags": "主题乐园,亲子,童话,烟花,游乐设施", "suitable_for": "亲子,情侣,朋友,家庭", "best_time_to_visit": "工作日", "peak_hours": "10:00-15:00", "indoor_outdoor": "outdoor", "weather_sensitive": False, "tips": "建议提前下载APP预约项目", "warnings": "节假日排队时间极长"},
    {"name": "豫园", "city": "上海", "category": "古典园林", "description": "明代私家园林，江南古典园林艺术的瑰宝", "latitude": 31.2270, "longitude": 121.4920, "address": "上海市黄浦区福佑路168号", "rating": 4.5, "avg_visit_duration": 150, "open_time": "09:00", "close_time": "16:30", "ticket_price": 40, "booking_required": False, "tags": "古典园林,历史文化,摄影,建筑", "suitable_for": "家庭,情侣,朋友,独行", "best_time_to_visit": "上午", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "可搭配城隍庙小吃一起游览", "warnings": "周一部分展厅可能闭馆维护"},
    {"name": "东方明珠", "city": "上海", "category": "地标建筑", "description": "上海地标性建筑，亚洲第四高塔", "latitude": 31.2397, "longitude": 121.4998, "address": "上海市浦东新区世纪大道1号", "rating": 4.6, "avg_visit_duration": 120, "open_time": "08:00", "close_time": "21:30", "ticket_price": 199, "ticket_price_peak": 259, "booking_required": False, "tags": "地标建筑,观光塔,夜景,摄影", "suitable_for": "情侣,家庭,朋友,亲子", "best_time_to_visit": "傍晚", "peak_hours": "17:00-20:00", "indoor_outdoor": "indoor", "weather_sensitive": False, "tips": "建议购买联票，可参观多个球体", "warnings": "节假日排队时间较长"},
    {"name": "上海博物馆", "city": "上海", "category": "博物馆", "description": "中国四大博物馆之一，馆藏珍贵文物", "latitude": 31.2281, "longitude": 121.4755, "address": "上海市黄浦区人民大道201号", "rating": 4.8, "avg_visit_duration": 180, "open_time": "09:00", "close_time": "17:00", "closed_days": "周一", "ticket_price": 0, "booking_required": True, "booking_advance_days": 1, "booking_url": "https://www.shanghaimuseum.net/", "tags": "博物馆,文物,历史,免费", "suitable_for": "家庭,朋友,独行,亲子", "best_time_to_visit": "工作日上午", "peak_hours": "10:00-14:00", "indoor_outdoor": "indoor", "weather_sensitive": False, "tips": "需提前预约，建议预留半天时间", "warnings": "周一闭馆"},
    {"name": "田子坊", "city": "上海", "category": "创意园区", "description": "上海最具特色的创意园区，文艺小店聚集地", "latitude": 31.2167, "longitude": 121.4672, "address": "上海市黄浦区泰康路210弄", "rating": 4.4, "avg_visit_duration": 120, "open_time": "10:00", "close_time": "21:00", "ticket_price": 0, "booking_required": False, "tags": "创意园区,文艺,购物,美食", "suitable_for": "情侣,朋友,独行", "best_time_to_visit": "下午", "peak_hours": "14:00-18:00", "indoor_outdoor": "indoor", "weather_sensitive": False, "tips": "适合拍照打卡，有很多特色小店", "warnings": "周末人流量大"},
    {"name": "新天地", "city": "上海", "category": "历史街区", "description": "石库门建筑群改造的时尚休闲区", "latitude": 31.2203, "longitude": 121.4739, "address": "上海市黄浦区太仓路181弄", "rating": 4.5, "avg_visit_duration": 120, "open_time": "00:00", "close_time": "23:59", "ticket_price": 0, "booking_required": False, "tags": "历史街区,石库门,美食,夜生活", "suitable_for": "情侣,朋友,家庭", "best_time_to_visit": "傍晚", "peak_hours": "18:00-22:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "适合晚上逛街用餐", "warnings": "消费较高"},
    {"name": "上海科技馆", "city": "上海", "category": "博物馆", "description": "大型科技馆，适合亲子科普教育", "latitude": 31.2144, "longitude": 121.5404, "address": "上海市浦东新区世纪大道2000号", "rating": 4.6, "avg_visit_duration": 240, "open_time": "09:00", "close_time": "17:15", "closed_days": "周一", "ticket_price": 45, "ticket_price_child": 22, "booking_required": True, "booking_advance_days": 1, "tags": "科技馆,亲子,科普,互动", "suitable_for": "亲子,家庭,学生", "best_time_to_visit": "工作日", "peak_hours": "10:00-14:00", "indoor_outdoor": "indoor", "weather_sensitive": False, "tips": "建议提前预约，适合带小朋友", "warnings": "周一闭馆"},
    {"name": "静安寺", "city": "上海", "category": "宗教文化", "description": "上海著名古刹，金碧辉煌的都市寺庙", "latitude": 31.2244, "longitude": 121.4464, "address": "上海市静安区南京西路1686号", "rating": 4.5, "avg_visit_duration": 60, "open_time": "07:30", "close_time": "17:00", "ticket_price": 50, "booking_required": False, "tags": "寺庙,宗教,历史建筑", "suitable_for": "家庭,朋友,独行", "best_time_to_visit": "上午", "peak_hours": "09:00-11:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "寺内禁止拍照，注意着装", "warnings": "节假日香客众多"},
    {"name": "朱家角古镇", "city": "上海", "category": "古镇水乡", "description": "上海保存最完整的江南水乡古镇", "latitude": 31.1158, "longitude": 121.0561, "address": "上海市青浦区朱家角镇", "rating": 4.5, "avg_visit_duration": 240, "open_time": "08:30", "close_time": "16:30", "ticket_price": 0, "booking_required": False, "tags": "古镇,水乡,历史,摄影", "suitable_for": "情侣,家庭,朋友,独行", "best_time_to_visit": "工作日", "peak_hours": "10:00-15:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "建议清晨前往，人少景美", "warnings": "周末人流量大"},
    {"name": "西湖", "city": "杭州", "category": "自然风光", "description": "世界文化遗产，杭州的城市名片", "latitude": 30.2592, "longitude": 120.1489, "address": "杭州市西湖区龙井路1号", "rating": 4.9, "avg_visit_duration": 240, "open_time": "00:00", "close_time": "23:59", "ticket_price": 0, "booking_required": False, "tags": "自然风光,世界遗产,免费,骑行,摄影", "suitable_for": "情侣,家庭,朋友,独行,亲子", "best_time_to_visit": "春秋两季", "peak_hours": "10:00-16:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "建议租借公共自行车环湖骑行", "warnings": "节假日人流量极大"},
    {"name": "灵隐寺", "city": "杭州", "category": "宗教文化", "description": "江南著名古刹，济公出家之地", "latitude": 30.2397, "longitude": 120.1008, "address": "杭州市西湖区灵隐路法云弄1号", "rating": 4.6, "avg_visit_duration": 180, "open_time": "07:00", "close_time": "18:00", "ticket_price": 75, "booking_required": False, "tags": "宗教文化,古刹,历史,飞来峰", "suitable_for": "家庭,朋友,独行", "best_time_to_visit": "上午", "peak_hours": "09:00-12:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "建议早到避开人流", "warnings": "寺内禁止拍照"},
    {"name": "西溪湿地", "city": "杭州", "category": "自然风光", "description": "国家湿地公园，城市绿肺", "latitude": 30.2628, "longitude": 120.0583, "address": "杭州市西湖区天目山路518号", "rating": 4.6, "avg_visit_duration": 240, "open_time": "08:30", "close_time": "17:30", "ticket_price": 80, "booking_required": False, "tags": "湿地,自然,生态,船游", "suitable_for": "家庭,情侣,朋友", "best_time_to_visit": "春秋", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "建议乘船游览，体验更好", "warnings": "夏季蚊虫较多"},
    {"name": "宋城", "city": "杭州", "category": "主题乐园", "description": "大型主题公园，宋城千古情演出闻名", "latitude": 30.1847, "longitude": 120.1142, "address": "杭州市西湖区之江路148号", "rating": 4.5, "avg_visit_duration": 300, "open_time": "10:00", "close_time": "21:00", "ticket_price": 310, "ticket_price_peak": 350, "booking_required": False, "tags": "主题乐园,演出,宋代文化", "suitable_for": "家庭,情侣,朋友,亲子", "best_time_to_visit": "下午", "peak_hours": "14:00-18:00", "indoor_outdoor": "outdoor", "weather_sensitive": False, "tips": "千古情演出必看，建议提前订票", "warnings": "节假日人流量大"},
    {"name": "千岛湖", "city": "杭州", "category": "自然风光", "description": "天下第一秀水，千岛湖风光旖旎", "latitude": 29.6088, "longitude": 119.0342, "address": "杭州市淳安县千岛湖镇", "rating": 4.7, "avg_visit_duration": 480, "open_time": "08:00", "close_time": "17:00", "ticket_price": 150, "ticket_price_peak": 215, "booking_required": False, "tags": "湖泊,岛屿,自然风光,游船", "suitable_for": "家庭,情侣,朋友", "best_time_to_visit": "春秋", "peak_hours": "09:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "建议住一晚，体验更好", "warnings": "距离市区较远"},
    {"name": "龙井村", "city": "杭州", "category": "乡村田园", "description": "龙井茶产地，茶园风光秀美", "latitude": 30.2311, "longitude": 120.1167, "address": "杭州市西湖区龙井村", "rating": 4.5, "avg_visit_duration": 120, "open_time": "00:00", "close_time": "23:59", "ticket_price": 0, "booking_required": False, "tags": "茶园,乡村,龙井茶,免费", "suitable_for": "情侣,家庭,朋友,独行", "best_time_to_visit": "春季", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "春季采茶季节最美", "warnings": "无"},
    {"name": "河坊街", "city": "杭州", "category": "历史街区", "description": "杭州历史文化街区，老字号云集", "latitude": 30.2439, "longitude": 120.1697, "address": "杭州市上城区河坊街", "rating": 4.4, "avg_visit_duration": 120, "open_time": "00:00", "close_time": "23:59", "ticket_price": 0, "booking_required": False, "tags": "历史街区,美食,购物,老字号", "suitable_for": "家庭,朋友,独行", "best_time_to_visit": "傍晚", "peak_hours": "18:00-21:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "适合品尝杭州小吃", "warnings": "节假日人流量大"},
    {"name": "雷峰塔", "city": "杭州", "category": "历史遗迹", "description": "西湖十景之一，白娘子传说发生地", "latitude": 30.2319, "longitude": 120.1486, "address": "杭州市西湖区南山路15号", "rating": 4.5, "avg_visit_duration": 90, "open_time": "08:00", "close_time": "20:30", "ticket_price": 40, "booking_required": False, "tags": "古塔,历史,传说,观景", "suitable_for": "情侣,家庭,朋友", "best_time_to_visit": "傍晚", "peak_hours": "16:00-19:00", "indoor_outdoor": "outdoor", "weather_sensitive": False, "tips": "傍晚登塔可看西湖日落", "warnings": "节假日排队时间较长"},
    {"name": "拙政园", "city": "苏州", "category": "古典园林", "description": "中国四大名园之一，苏州园林的代表作品", "latitude": 31.3170, "longitude": 120.6330, "address": "苏州市姑苏区东北街178号", "rating": 4.8, "avg_visit_duration": 180, "open_time": "07:30", "close_time": "17:30", "ticket_price": 80, "booking_required": True, "booking_advance_days": 1, "booking_url": "https://www.szmuseum.com/", "tags": "古典园林,世界遗产,摄影,建筑", "suitable_for": "家庭,情侣,朋友,独行", "best_time_to_visit": "春夏", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "建议请导游讲解", "warnings": "需提前预约"},
    {"name": "苏州博物馆", "city": "苏州", "category": "博物馆", "description": "建筑大师贝聿铭封山之作", "latitude": 31.3150, "longitude": 120.6300, "address": "苏州市姑苏区东北街204号", "rating": 4.8, "avg_visit_duration": 150, "open_time": "09:00", "close_time": "17:00", "closed_days": "周一", "ticket_price": 0, "booking_required": True, "booking_advance_days": 7, "booking_url": "https://www.szmuseum.com/", "tags": "博物馆,建筑艺术,免费,贝聿铭", "suitable_for": "家庭,朋友,独行,亲子", "best_time_to_visit": "工作日上午", "peak_hours": "10:00-14:00", "indoor_outdoor": "indoor", "weather_sensitive": False, "tips": "需提前7天预约", "warnings": "周一闭馆"},
    {"name": "留园", "city": "苏州", "category": "古典园林", "description": "中国四大名园之一，以建筑空间处理著称", "latitude": 31.3058, "longitude": 120.6153, "address": "苏州市姑苏区留园路338号", "rating": 4.7, "avg_visit_duration": 150, "open_time": "07:30", "close_time": "17:30", "ticket_price": 55, "booking_required": False, "tags": "古典园林,世界遗产,建筑", "suitable_for": "家庭,情侣,朋友,独行", "best_time_to_visit": "春秋", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "建议与拙政园同日游览", "warnings": "节假日人流量大"},
    {"name": "虎丘", "city": "苏州", "category": "历史遗迹", "description": "吴中第一名胜，斜塔闻名天下", "latitude": 31.3372, "longitude": 120.5689, "address": "苏州市姑苏区虎丘山门内8号", "rating": 4.6, "avg_visit_duration": 180, "open_time": "07:30", "close_time": "17:30", "ticket_price": 80, "booking_required": False, "tags": "历史遗迹,斜塔,园林", "suitable_for": "家庭,朋友,独行", "best_time_to_visit": "春秋", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "建议请导游讲解历史典故", "warnings": "台阶较多"},
    {"name": "平江路", "city": "苏州", "category": "历史街区", "description": "苏州保存最完整的古街区", "latitude": 31.3119, "longitude": 120.6297, "address": "苏州市姑苏区平江路", "rating": 4.6, "avg_visit_duration": 120, "open_time": "00:00", "close_time": "23:59", "ticket_price": 0, "booking_required": False, "tags": "历史街区,水乡,美食,文艺", "suitable_for": "情侣,朋友,独行", "best_time_to_visit": "傍晚", "peak_hours": "18:00-21:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "适合漫步拍照，有很多特色小店", "warnings": "节假日人流量大"},
    {"name": "寒山寺", "city": "苏州", "category": "宗教文化", "description": "姑苏城外寒山寺，夜半钟声到客船", "latitude": 31.3092, "longitude": 120.5678, "address": "苏州市姑苏区寒山寺弄24号", "rating": 4.5, "avg_visit_duration": 90, "open_time": "07:30", "close_time": "17:00", "ticket_price": 20, "booking_required": False, "tags": "寺庙,诗词,历史", "suitable_for": "家庭,朋友,独行", "best_time_to_visit": "上午", "peak_hours": "09:00-11:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "可撞钟祈福", "warnings": "节假日香客众多"},
    {"name": "周庄古镇", "city": "苏州", "category": "古镇水乡", "description": "中国第一水乡，江南六大古镇之一", "latitude": 31.0933, "longitude": 120.8572, "address": "苏州市昆山市周庄镇", "rating": 4.6, "avg_visit_duration": 300, "open_time": "08:00", "close_time": "21:00", "ticket_price": 100, "booking_required": False, "tags": "古镇,水乡,双桥,沈厅", "suitable_for": "情侣,家庭,朋友,独行", "best_time_to_visit": "工作日", "peak_hours": "10:00-16:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "建议住一晚体验夜景", "warnings": "节假日人流量极大"},
    {"name": "同里古镇", "city": "苏州", "category": "古镇水乡", "description": "东方小威尼斯，退思园闻名", "latitude": 31.1600, "longitude": 120.7158, "address": "苏州市吴江区同里镇", "rating": 4.6, "avg_visit_duration": 300, "open_time": "07:30", "close_time": "17:30", "ticket_price": 100, "booking_required": False, "tags": "古镇,水乡,退思园", "suitable_for": "情侣,家庭,朋友,独行", "best_time_to_visit": "工作日", "peak_hours": "10:00-15:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "比周庄更安静，适合慢游", "warnings": "节假日人流量大"},
    {"name": "中山陵", "city": "南京", "category": "历史遗迹", "description": "孙中山先生陵寝，中国近代建筑史上的杰作", "latitude": 32.0576, "longitude": 118.8567, "address": "南京市玄武区石象路7号", "rating": 4.7, "avg_visit_duration": 180, "open_time": "08:30", "close_time": "17:00", "ticket_price": 0, "booking_required": True, "booking_advance_days": 1, "booking_url": "http://www.zschina.org/", "tags": "历史遗迹,免费,民国,建筑", "suitable_for": "家庭,朋友,独行,亲子", "best_time_to_visit": "春秋", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "需提前预约，建议穿舒适的鞋子", "warnings": "周一祭堂闭馆维护"},
    {"name": "夫子庙秦淮河", "city": "南京", "category": "历史街区", "description": "十里秦淮，六朝金粉", "latitude": 32.0400, "longitude": 118.7940, "address": "南京市秦淮区贡院街", "rating": 4.5, "avg_visit_duration": 180, "open_time": "09:00", "close_time": "22:00", "ticket_price": 0, "booking_required": False, "tags": "历史街区,夜景,美食,秦淮河", "suitable_for": "情侣,家庭,朋友,独行", "best_time_to_visit": "傍晚至夜间", "peak_hours": "18:00-21:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "建议傍晚前往，夜游秦淮河", "warnings": "节假日人流量极大"},
    {"name": "总统府", "city": "南京", "category": "历史遗迹", "description": "中国近代史遗址博物馆，民国建筑群", "latitude": 32.0411, "longitude": 118.7953, "address": "南京市玄武区长江路292号", "rating": 4.6, "avg_visit_duration": 180, "open_time": "08:30", "close_time": "17:00", "closed_days": "周一", "ticket_price": 40, "booking_required": True, "booking_advance_days": 1, "tags": "历史遗迹,民国,建筑,博物馆", "suitable_for": "家庭,朋友,独行", "best_time_to_visit": "工作日", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "需提前预约，建议请导游讲解", "warnings": "周一闭馆"},
    {"name": "玄武湖", "city": "南京", "category": "自然风光", "description": "江南三大名湖之一，南京城中的明珠", "latitude": 32.0753, "longitude": 118.7975, "address": "南京市玄武区玄武巷1号", "rating": 4.6, "avg_visit_duration": 180, "open_time": "06:00", "close_time": "18:00", "ticket_price": 0, "booking_required": False, "tags": "湖泊,公园,免费,骑行", "suitable_for": "家庭,情侣,朋友,独行", "best_time_to_visit": "春秋", "peak_hours": "09:00-16:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "适合环湖骑行或散步", "warnings": "节假日人流量大"},
    {"name": "明孝陵", "city": "南京", "category": "历史遗迹", "description": "明太祖朱元璋陵寝，世界文化遗产", "latitude": 32.0583, "longitude": 118.8486, "address": "南京市玄武区石象路7号", "rating": 4.7, "avg_visit_duration": 180, "open_time": "06:30", "close_time": "18:00", "ticket_price": 70, "booking_required": False, "tags": "历史遗迹,世界遗产,明代,神道", "suitable_for": "家庭,朋友,独行", "best_time_to_visit": "秋季", "peak_hours": "09:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "秋季石象路最美", "warnings": "景区较大，建议预留充足时间"},
    {"name": "南京博物院", "city": "南京", "category": "博物馆", "description": "中国三大博物馆之一，馆藏丰富", "latitude": 32.0403, "longitude": 118.8219, "address": "南京市玄武区中山东路321号", "rating": 4.8, "avg_visit_duration": 240, "open_time": "09:00", "close_time": "17:00", "closed_days": "周一", "ticket_price": 0, "booking_required": True, "booking_advance_days": 1, "tags": "博物馆,文物,历史,免费", "suitable_for": "家庭,朋友,独行,亲子", "best_time_to_visit": "工作日", "peak_hours": "10:00-14:00", "indoor_outdoor": "indoor", "weather_sensitive": False, "tips": "需提前预约，建议预留半天时间", "warnings": "周一闭馆"},
    {"name": "鼋头渚", "city": "无锡", "category": "自然风光", "description": "太湖第一名胜，世界三大赏樱胜地之一", "latitude": 31.5300, "longitude": 120.2300, "address": "无锡市滨湖区鼋渚路1号", "rating": 4.7, "avg_visit_duration": 240, "open_time": "08:00", "close_time": "17:00", "ticket_price": 90, "booking_required": False, "tags": "自然风光,樱花,太湖,摄影", "suitable_for": "家庭,情侣,朋友,亲子", "best_time_to_visit": "3-4月樱花季", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "樱花季建议工作日前往", "warnings": "樱花季人流量极大"},
    {"name": "灵山大佛", "city": "无锡", "category": "宗教文化", "description": "世界最高的释迦牟尼青铜立像", "latitude": 31.4167, "longitude": 120.1000, "address": "无锡市滨湖区马山灵山路1号", "rating": 4.6, "avg_visit_duration": 240, "open_time": "07:30", "close_time": "17:30", "ticket_price": 210, "booking_required": False, "tags": "宗教文化,大佛,佛教,建筑", "suitable_for": "家庭,朋友,独行", "best_time_to_visit": "春秋", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "建议观看九龙灌浴表演", "warnings": "景区较大，建议预留充足时间"},
    {"name": "拈花湾", "city": "无锡", "category": "度假休闲", "description": "禅意小镇，东方禅境度假胜地", "latitude": 31.4056, "longitude": 120.0833, "address": "无锡市滨湖区马山环山西路68号", "rating": 4.6, "avg_visit_duration": 300, "open_time": "09:00", "close_time": "21:00", "ticket_price": 120, "booking_required": False, "tags": "禅意,度假,夜景,演出", "suitable_for": "情侣,家庭,朋友", "best_time_to_visit": "傍晚", "peak_hours": "16:00-20:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "建议住一晚，夜景很美", "warnings": "节假日人流量大"},
    {"name": "三国城", "city": "无锡", "category": "影视基地", "description": "央视水浒传拍摄基地，三国主题景区", "latitude": 31.4867, "longitude": 120.2167, "address": "无锡市滨湖区山水西路128号", "rating": 4.4, "avg_visit_duration": 180, "open_time": "07:30", "close_time": "17:30", "ticket_price": 90, "booking_required": False, "tags": "影视基地,三国,演出", "suitable_for": "家庭,朋友,亲子", "best_time_to_visit": "春秋", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "可观看三英战吕布演出", "warnings": "节假日人流量大"},
    {"name": "瘦西湖", "city": "扬州", "category": "自然风光", "description": "扬州标志性景点，湖上园林", "latitude": 32.4000, "longitude": 119.4200, "address": "扬州市邗江区大虹桥路28号", "rating": 4.7, "avg_visit_duration": 240, "open_time": "06:30", "close_time": "18:00", "ticket_price": 100, "ticket_price_peak": 150, "booking_required": False, "tags": "自然风光,园林,湖泊,摄影", "suitable_for": "家庭,情侣,朋友,独行", "best_time_to_visit": "3-5月", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "建议乘船游览", "warnings": "节假日门票可能上涨"},
    {"name": "个园", "city": "扬州", "category": "古典园林", "description": "中国四大名园之一，以竹石取胜", "latitude": 32.3958, "longitude": 119.4267, "address": "扬州市广陵区盐阜东路10号", "rating": 4.6, "avg_visit_duration": 120, "open_time": "07:15", "close_time": "17:30", "ticket_price": 45, "booking_required": False, "tags": "古典园林,竹子,假山", "suitable_for": "家庭,情侣,朋友,独行", "best_time_to_visit": "春秋", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "四季假山是特色", "warnings": "节假日人流量大"},
    {"name": "何园", "city": "扬州", "category": "古典园林", "description": "晚清第一园，中西合璧的园林艺术", "latitude": 32.3892, "longitude": 119.4250, "address": "扬州市广陵区徐凝门大街66号", "rating": 4.5, "avg_visit_duration": 120, "open_time": "07:30", "close_time": "17:30", "ticket_price": 45, "booking_required": False, "tags": "古典园林,晚清,建筑", "suitable_for": "家庭,情侣,朋友,独行", "best_time_to_visit": "春秋", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "复道回廊是特色", "warnings": "节假日人流量大"},
    {"name": "东关街", "city": "扬州", "category": "历史街区", "description": "扬州最具代表性的历史老街", "latitude": 32.3972, "longitude": 119.4308, "address": "扬州市广陵区东关街", "rating": 4.5, "avg_visit_duration": 120, "open_time": "00:00", "close_time": "23:59", "ticket_price": 0, "booking_required": False, "tags": "历史街区,美食,购物,老字号", "suitable_for": "家庭,朋友,独行", "best_time_to_visit": "傍晚", "peak_hours": "18:00-21:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "适合品尝扬州小吃", "warnings": "节假日人流量大"},
    {"name": "鲁迅故里", "city": "绍兴", "category": "历史遗迹", "description": "鲁迅先生诞生和成长的地方", "latitude": 30.0000, "longitude": 120.5833, "address": "绍兴市越城区鲁迅中路235号", "rating": 4.6, "avg_visit_duration": 150, "open_time": "08:30", "close_time": "17:00", "closed_days": "周一", "ticket_price": 0, "booking_required": True, "booking_advance_days": 1, "booking_url": "http://www.luxunmuseum.com/", "tags": "历史遗迹,名人故居,免费,文化", "suitable_for": "家庭,朋友,独行,亲子", "best_time_to_visit": "全年", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "需凭身份证免费领取门票", "warnings": "周一闭馆"},
    {"name": "沈园", "city": "绍兴", "category": "古典园林", "description": "陆游与唐婉爱情故事发生地", "latitude": 29.9972, "longitude": 120.5861, "address": "绍兴市越城区鲁迅中路318号", "rating": 4.5, "avg_visit_duration": 90, "open_time": "08:00", "close_time": "17:00", "ticket_price": 40, "booking_required": False, "tags": "古典园林,爱情,诗词", "suitable_for": "情侣,家庭,朋友,独行", "best_time_to_visit": "春秋", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "钗头凤碑是必看点", "warnings": "无"},
    {"name": "兰亭", "city": "绍兴", "category": "历史遗迹", "description": "王羲之兰亭集序诞生地，书法圣地", "latitude": 29.9333, "longitude": 120.5167, "address": "绍兴市柯桥区兰亭街道", "rating": 4.6, "avg_visit_duration": 120, "open_time": "08:30", "close_time": "17:00", "ticket_price": 70, "booking_required": False, "tags": "历史遗迹,书法,文化", "suitable_for": "家庭,朋友,独行", "best_time_to_visit": "春秋", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "书法爱好者必去", "warnings": "距离市区较远"},
    {"name": "安昌古镇", "city": "绍兴", "category": "古镇水乡", "description": "原汁原味的江南水乡古镇", "latitude": 30.0667, "longitude": 120.5000, "address": "绍兴市柯桥区安昌镇", "rating": 4.5, "avg_visit_duration": 180, "open_time": "08:00", "close_time": "16:30", "ticket_price": 0, "booking_required": False, "tags": "古镇,水乡,腊味,免费", "suitable_for": "情侣,家庭,朋友,独行", "best_time_to_visit": "冬季", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "冬季腊味节最热闹", "warnings": "无"},
    {"name": "乌镇", "city": "嘉兴", "category": "古镇水乡", "description": "江南四大名镇之一，小桥流水人家", "latitude": 30.7468, "longitude": 120.4870, "address": "嘉兴市桐乡市乌镇石佛南路18号", "rating": 4.7, "avg_visit_duration": 360, "open_time": "07:00", "close_time": "22:00", "ticket_price": 150, "ticket_price_peak": 190, "booking_required": False, "tags": "古镇水乡,夜景,民宿,摄影", "suitable_for": "情侣,家庭,朋友,独行", "best_time_to_visit": "春秋", "peak_hours": "10:00-16:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "建议住一晚体验夜景", "warnings": "节假日人流量大"},
    {"name": "西塘古镇", "city": "嘉兴", "category": "古镇水乡", "description": "活着的千年古镇，烟雨长廊独具特色", "latitude": 30.9480, "longitude": 120.8880, "address": "嘉兴市嘉善县西塘镇南苑路258号", "rating": 4.6, "avg_visit_duration": 300, "open_time": "08:00", "close_time": "21:00", "ticket_price": 100, "booking_required": False, "tags": "古镇水乡,夜景,烟雨长廊,摄影", "suitable_for": "情侣,家庭,朋友,独行", "best_time_to_visit": "春秋", "peak_hours": "10:00-16:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "傍晚后进入可免门票", "warnings": "周末人流量较大"},
    {"name": "南湖", "city": "嘉兴", "category": "自然风光", "description": "中共一大会址，红船起航地", "latitude": 30.7468, "longitude": 120.7509, "address": "嘉兴市南湖区南湖路", "rating": 4.5, "avg_visit_duration": 120, "open_time": "08:00", "close_time": "17:00", "ticket_price": 0, "booking_required": False, "tags": "湖泊,红色旅游,历史", "suitable_for": "家庭,朋友,独行", "best_time_to_visit": "春秋", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "可乘船登湖心岛", "warnings": "节假日人流量大"},
    {"name": "天一阁", "city": "宁波", "category": "博物馆", "description": "亚洲现有最古老的图书馆", "latitude": 29.8683, "longitude": 121.5440, "address": "宁波市海曙区天一街10号", "rating": 4.6, "avg_visit_duration": 120, "open_time": "08:30", "close_time": "17:30", "closed_days": "周一", "ticket_price": 30, "booking_required": False, "tags": "博物馆,藏书楼,历史,文化", "suitable_for": "家庭,朋友,独行", "best_time_to_visit": "全年", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "建议请导游讲解", "warnings": "周一闭馆"},
    {"name": "溪口", "city": "宁波", "category": "历史遗迹", "description": "蒋介石故里，雪窦山风景区", "latitude": 29.6667, "longitude": 121.1167, "address": "宁波市奉化区溪口镇", "rating": 4.5, "avg_visit_duration": 300, "open_time": "08:00", "close_time": "17:00", "ticket_price": 150, "booking_required": False, "tags": "历史遗迹,民国,山水", "suitable_for": "家庭,朋友,独行", "best_time_to_visit": "春秋", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "建议预留一天时间", "warnings": "距离市区较远"},
    {"name": "东钱湖", "city": "宁波", "category": "自然风光", "description": "浙江最大的天然淡水湖", "latitude": 29.8000, "longitude": 121.6500, "address": "宁波市鄞州区东钱湖镇", "rating": 4.5, "avg_visit_duration": 240, "open_time": "08:00", "close_time": "17:00", "ticket_price": 0, "booking_required": False, "tags": "湖泊,自然风光,骑行", "suitable_for": "家庭,情侣,朋友", "best_time_to_visit": "春秋", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "适合环湖骑行", "warnings": "景区较大"},
    {"name": "老外滩", "city": "宁波", "category": "历史街区", "description": "宁波最早的外滩，比上海外滩还早", "latitude": 29.8750, "longitude": 121.5500, "address": "宁波市江北区老外滩", "rating": 4.4, "avg_visit_duration": 120, "open_time": "00:00", "close_time": "23:59", "ticket_price": 0, "booking_required": False, "tags": "历史街区,酒吧,美食,夜景", "suitable_for": "情侣,朋友,独行", "best_time_to_visit": "傍晚", "peak_hours": "18:00-22:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "适合晚上逛街用餐", "warnings": "消费较高"},
    {"name": "中华恐龙园", "city": "常州", "category": "主题乐园", "description": "中国首个恐龙主题公园", "latitude": 31.8122, "longitude": 119.9692, "address": "常州市新北区汉江路1号", "rating": 4.5, "avg_visit_duration": 420, "open_time": "09:00", "close_time": "17:00", "ticket_price": 260, "booking_required": False, "tags": "主题乐园,亲子,恐龙,游乐设施", "suitable_for": "亲子,家庭,朋友", "best_time_to_visit": "春秋", "peak_hours": "10:00-15:00", "indoor_outdoor": "outdoor", "weather_sensitive": False, "tips": "建议早到先玩热门项目", "warnings": "节假日排队时间较长"},
    {"name": "天目湖", "city": "常州", "category": "自然风光", "description": "江南明珠，山水相映", "latitude": 31.3500, "longitude": 119.5000, "address": "常州市溧阳市天目湖镇", "rating": 4.6, "avg_visit_duration": 300, "open_time": "08:00", "close_time": "17:00", "ticket_price": 120, "booking_required": False, "tags": "湖泊,山水,温泉,度假", "suitable_for": "家庭,情侣,朋友", "best_time_to_visit": "春秋", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "建议住一晚，体验温泉", "warnings": "距离市区较远"},
    {"name": "南山竹海", "city": "常州", "category": "自然风光", "description": "万亩竹海，天然氧吧", "latitude": 31.3000, "longitude": 119.4500, "address": "常州市溧阳市戴埠镇", "rating": 4.5, "avg_visit_duration": 240, "open_time": "08:00", "close_time": "17:00", "ticket_price": 90, "booking_required": False, "tags": "竹海,自然,徒步", "suitable_for": "家庭,情侣,朋友", "best_time_to_visit": "夏季", "peak_hours": "10:00-14:00", "indoor_outdoor": "outdoor", "weather_sensitive": True, "tips": "夏季避暑胜地", "warnings": "距离市区较远"},
    {"name": "淹城春秋乐园", "city": "常州", "category": "主题乐园", "description": "春秋文化主题公园，遗址与现代游乐结合", "latitude": 31.7500, "longitude": 119.9500, "address": "常州市武进区武宜中路197号", "rating": 4.4, "avg_visit_duration": 300, "open_time": "09:00", "close_time": "17:00", "ticket_price": 190, "booking_required": False, "tags": "主题乐园,春秋文化,遗址", "suitable_for": "家庭,朋友,亲子", "best_time_to_visit": "春秋", "peak_hours": "10:00-15:00", "indoor_outdoor": "outdoor", "weather_sensitive": False, "tips": "可了解春秋历史", "warnings": "节假日人流量大"}
]

RESTAURANTS_DATA = [
    {"name": "松鹤楼", "city": "苏州", "address": "苏州市姑苏区观前街141号", "latitude": 31.3100, "longitude": 120.6200, "category": "苏帮菜", "cuisine_type": "苏菜", "price_level": 4, "avg_cost_per_person": 150, "rating": 4.5, "open_time": "10:00", "close_time": "21:00", "specialty_dishes": "松鼠桂鱼,响油鳝丝,清炒虾仁", "suitable_for": "家庭,朋友,商务", "tags": "老字号,苏帮菜,观前街", "tips": "建议提前预约"},
    {"name": "楼外楼", "city": "杭州", "address": "杭州市西湖区孤山路30号", "latitude": 30.2500, "longitude": 120.1400, "category": "杭帮菜", "cuisine_type": "浙菜", "price_level": 4, "avg_cost_per_person": 180, "rating": 4.4, "open_time": "10:00", "close_time": "21:00", "specialty_dishes": "西湖醋鱼,东坡肉,龙井虾仁", "suitable_for": "家庭,朋友,商务", "tags": "老字号,杭帮菜,西湖边", "tips": "西湖醋鱼是招牌"},
    {"name": "外婆家", "city": "杭州", "address": "杭州市西湖区马塍路6-1号", "latitude": 30.2800, "longitude": 120.1600, "category": "杭帮菜", "cuisine_type": "浙菜", "price_level": 2, "avg_cost_per_person": 60, "rating": 4.3, "open_time": "10:00", "close_time": "22:00", "specialty_dishes": "茶香鸡,麻婆豆腐,西湖牛肉羹", "suitable_for": "家庭,朋友,情侣", "tags": "连锁,性价比,杭帮菜", "tips": "排队较久"},
    {"name": "南京大牌档", "city": "南京", "address": "南京市秦淮区中山门大街9号", "latitude": 32.0400, "longitude": 118.8000, "category": "金陵菜", "cuisine_type": "苏菜", "price_level": 3, "avg_cost_per_person": 80, "rating": 4.4, "open_time": "10:00", "close_time": "22:00", "specialty_dishes": "金陵烤鸭,盐水鸭,鸭血粉丝汤", "suitable_for": "家庭,朋友,亲子", "tags": "老字号,金陵菜,特色", "tips": "环境有特色"},
    {"name": "南翔馒头店", "city": "上海", "address": "上海市黄浦区豫园路85号", "latitude": 31.2270, "longitude": 120.4920, "category": "小吃", "cuisine_type": "上海本帮", "price_level": 2, "avg_cost_per_person": 40, "rating": 4.3, "open_time": "07:00", "close_time": "21:00", "specialty_dishes": "南翔小笼包,蟹黄灌汤包", "suitable_for": "家庭,朋友,独行", "tags": "老字号,小吃,小笼包", "tips": "排队较长"},
    {"name": "老正兴", "city": "上海", "address": "上海市黄浦区福州路556号", "latitude": 31.2350, "longitude": 121.4800, "category": "本帮菜", "cuisine_type": "上海本帮", "price_level": 3, "avg_cost_per_person": 100, "rating": 4.4, "open_time": "10:00", "close_time": "21:00", "specialty_dishes": "草头圈子,油爆虾,红烧肉", "suitable_for": "家庭,朋友,商务", "tags": "老字号,本帮菜,福州路", "tips": "草头圈子是招牌"},
    {"name": "知味观", "city": "杭州", "address": "杭州市上城区仁和路83号", "latitude": 30.2500, "longitude": 120.1700, "category": "杭帮菜", "cuisine_type": "浙菜", "price_level": 3, "avg_cost_per_person": 80, "rating": 4.3, "open_time": "10:00", "close_time": "21:00", "specialty_dishes": "猫耳朵,幸福双,片儿川", "suitable_for": "家庭,朋友", "tags": "老字号,杭帮菜,小吃", "tips": "小吃品种丰富"},
    {"name": "得月楼", "city": "苏州", "address": "苏州市姑苏区太监弄27号", "latitude": 31.3100, "longitude": 120.6200, "category": "苏帮菜", "cuisine_type": "苏菜", "price_level": 4, "avg_cost_per_person": 150, "rating": 4.4, "open_time": "10:00", "close_time": "21:00", "specialty_dishes": "松鼠桂鱼,响油鳝丝", "suitable_for": "家庭,朋友,商务", "tags": "老字号,苏帮菜", "tips": "与松鹤楼齐名"},
    {"name": "秦淮小吃城", "city": "南京", "address": "南京市秦淮区夫子庙贡院街", "latitude": 32.0400, "longitude": 118.7940, "category": "小吃", "cuisine_type": "金陵小吃", "price_level": 2, "avg_cost_per_person": 50, "rating": 4.2, "open_time": "09:00", "close_time": "22:00", "specialty_dishes": "鸭血粉丝汤,鸡汁汤包,牛肉锅贴", "suitable_for": "家庭,朋友,独行", "tags": "小吃,夫子庙,金陵", "tips": "品种丰富"},
    {"name": "咸亨酒店", "city": "绍兴", "address": "绍兴市越城区鲁迅中路179号", "latitude": 30.0000, "longitude": 120.5833, "category": "绍兴菜", "cuisine_type": "浙菜", "price_level": 3, "avg_cost_per_person": 80, "rating": 4.3, "open_time": "10:00", "close_time": "21:00", "specialty_dishes": "茴香豆,臭豆腐,花雕鸡", "suitable_for": "家庭,朋友", "tags": "老字号,鲁迅,绍兴菜", "tips": "孔乙己同款"},
    {"name": "五芳斋", "city": "嘉兴", "address": "嘉兴市南湖区建国中路", "latitude": 30.7500, "longitude": 120.7500, "category": "小吃", "cuisine_type": "嘉兴小吃", "price_level": 2, "avg_cost_per_person": 30, "rating": 4.3, "open_time": "06:00", "close_time": "20:00", "specialty_dishes": "粽子,汤圆,馄饨", "suitable_for": "家庭,朋友,独行", "tags": "老字号,粽子,嘉兴", "tips": "粽子是招牌"},
    {"name": "缸鸭狗", "city": "宁波", "address": "宁波市海曙区中山东路188号", "latitude": 29.8700, "longitude": 121.5500, "category": "小吃", "cuisine_type": "宁波小吃", "price_level": 2, "avg_cost_per_person": 40, "rating": 4.2, "open_time": "07:00", "close_time": "21:00", "specialty_dishes": "汤圆,酒酿圆子,油赞子", "suitable_for": "家庭,朋友,独行", "tags": "老字号,汤圆,宁波", "tips": "汤圆是招牌"},
    {"name": "富春茶社", "city": "扬州", "address": "扬州市广陵区国庆路得胜桥35号", "latitude": 32.3950, "longitude": 119.4300, "category": "淮扬菜", "cuisine_type": "苏菜", "price_level": 3, "avg_cost_per_person": 80, "rating": 4.4, "open_time": "06:00", "close_time": "20:00", "specialty_dishes": "蟹黄汤包,三丁包子,翡翠烧卖", "suitable_for": "家庭,朋友", "tags": "老字号,早茶,淮扬菜", "tips": "早茶必去"},
    {"name": "冶春茶社", "city": "扬州", "address": "扬州市邗江区丰乐下街10号", "latitude": 32.4050, "longitude": 119.4250, "category": "淮扬菜", "cuisine_type": "苏菜", "price_level": 3, "avg_cost_per_person": 70, "rating": 4.3, "open_time": "06:00", "close_time": "20:00", "specialty_dishes": "蟹黄汤包,千层油糕,大煮干丝", "suitable_for": "家庭,朋友", "tags": "老字号,早茶,淮扬菜", "tips": "环境优美"},
    {"name": "王兴记", "city": "无锡", "address": "无锡市梁溪区中山路223号", "latitude": 31.4900, "longitude": 120.3100, "category": "小吃", "cuisine_type": "无锡小吃", "price_level": 2, "avg_cost_per_person": 35, "rating": 4.2, "open_time": "07:00", "close_time": "20:00", "specialty_dishes": "小笼包,馄饨,酱排骨", "suitable_for": "家庭,朋友,独行", "tags": "老字号,小笼包,无锡", "tips": "小笼包是招牌"}
]

HOTELS_DATA = [
    {"name": "上海外滩华尔道夫酒店", "city": "上海", "address": "上海市黄浦区中山东一路2号", "latitude": 31.2400, "longitude": 121.4900, "hotel_type": "豪华型", "star_rating": 5, "price_level": 5, "price_min": 2000, "price_max": 5000, "rating": 4.8, "amenities": "健身房,游泳池,SPA,餐厅,酒吧", "suitable_for": "商务,情侣,家庭", "tags": "外滩,江景,历史建筑", "tips": "外滩景观房视野极佳"},
    {"name": "杭州西湖国宾馆", "city": "杭州", "address": "杭州市西湖区杨公堤18号", "latitude": 30.2500, "longitude": 120.1300, "hotel_type": "豪华型", "star_rating": 5, "price_level": 5, "price_min": 1500, "price_max": 4000, "rating": 4.7, "amenities": "健身房,游泳池,SPA,餐厅,花园", "suitable_for": "商务,家庭,情侣", "tags": "西湖,园林,国宾级", "tips": "园林景观优美"},
    {"name": "苏州平江华庭精品酒店", "city": "苏州", "address": "苏州市姑苏区平江路", "latitude": 31.3119, "longitude": 120.6297, "hotel_type": "精品酒店", "star_rating": 4, "price_level": 4, "price_min": 600, "price_max": 1200, "rating": 4.5, "amenities": "餐厅,茶室,花园", "suitable_for": "情侣,家庭", "tags": "平江路,古城区,精品", "tips": "位置绝佳"},
    {"name": "南京金陵饭店", "city": "南京", "address": "南京市玄武区汉中路2号", "latitude": 32.0500, "longitude": 118.7800, "hotel_type": "豪华型", "star_rating": 5, "price_level": 4, "price_min": 800, "price_max": 2000, "rating": 4.6, "amenities": "健身房,游泳池,餐厅,会议室", "suitable_for": "商务,家庭", "tags": "市中心,老牌,商务", "tips": "南京地标酒店"},
    {"name": "乌镇通安客栈", "city": "嘉兴", "address": "嘉兴市桐乡市乌镇西栅景区内", "latitude": 30.7468, "longitude": 120.4870, "hotel_type": "特色民宿", "star_rating": 4, "price_level": 4, "price_min": 800, "price_max": 1500, "rating": 4.5, "amenities": "餐厅,茶室,园林", "suitable_for": "情侣,家庭,朋友", "tags": "乌镇,水乡,特色", "tips": "住客可多次进出景区"},
    {"name": "无锡拈花湾拈花客栈", "city": "无锡", "address": "无锡市滨湖区马山拈花湾", "latitude": 31.4056, "longitude": 120.0833, "hotel_type": "特色民宿", "star_rating": 4, "price_level": 4, "price_min": 600, "price_max": 1200, "rating": 4.6, "amenities": "餐厅,茶室,禅修", "suitable_for": "情侣,家庭,朋友", "tags": "禅意,度假,特色", "tips": "夜景很美"},
    {"name": "扬州迎宾馆", "city": "扬州", "address": "扬州市邗江区瘦西湖路48号", "latitude": 32.4000, "longitude": 119.4200, "hotel_type": "豪华型", "star_rating": 5, "price_level": 4, "price_min": 600, "price_max": 1500, "rating": 4.5, "amenities": "健身房,游泳池,餐厅,花园", "suitable_for": "商务,家庭", "tags": "瘦西湖,园林,国宾级", "tips": "园林景观优美"},
    {"name": "绍兴咸亨酒店", "city": "绍兴", "address": "绍兴市越城区鲁迅中路155号", "latitude": 30.0000, "longitude": 120.5833, "hotel_type": "精品酒店", "star_rating": 4, "price_level": 3, "price_min": 400, "price_max": 800, "rating": 4.4, "amenities": "餐厅,茶室", "suitable_for": "家庭,朋友", "tags": "鲁迅故里,文化,特色", "tips": "文化氛围浓厚"},
    {"name": "常州恐龙主题酒店", "city": "常州", "address": "常州市新北区汉江路1号", "latitude": 31.8122, "longitude": 119.9692, "hotel_type": "主题酒店", "star_rating": 4, "price_level": 4, "price_min": 600, "price_max": 1200, "rating": 4.4, "amenities": "餐厅,儿童乐园,游泳池", "suitable_for": "亲子,家庭", "tags": "恐龙园,亲子,主题", "tips": "住客可提前入园"},
    {"name": "宁波柏悦酒店", "city": "宁波", "address": "宁波市鄞州区东钱湖大堰路188号", "latitude": 29.8000, "longitude": 121.6500, "hotel_type": "豪华型", "star_rating": 5, "price_level": 5, "price_min": 1500, "price_max": 3000, "rating": 4.7, "amenities": "健身房,游泳池,SPA,餐厅", "suitable_for": "商务,情侣,家庭", "tags": "东钱湖,度假,江景", "tips": "湖景房视野极佳"}
]

TRANSPORT_MATRIX_DATA = [
    {"from_city": "上海", "to_city": "杭州", "transport_type": "高铁", "duration_minutes": 45, "cost_min": 73, "cost_max": 117, "frequency": "每10-20分钟一班", "notes": "上海虹桥-杭州东", "distance_km": 176},
    {"from_city": "上海", "to_city": "苏州", "transport_type": "高铁", "duration_minutes": 25, "cost_min": 40, "cost_max": 60, "frequency": "每5-10分钟一班", "notes": "上海虹桥-苏州北", "distance_km": 84},
    {"from_city": "上海", "to_city": "南京", "transport_type": "高铁", "duration_minutes": 60, "cost_min": 134, "cost_max": 220, "frequency": "每10-15分钟一班", "notes": "上海虹桥-南京南", "distance_km": 301},
    {"from_city": "上海", "to_city": "无锡", "transport_type": "高铁", "duration_minutes": 35, "cost_min": 50, "cost_max": 80, "frequency": "每10分钟一班", "notes": "上海虹桥-无锡东", "distance_km": 126},
    {"from_city": "上海", "to_city": "扬州", "transport_type": "高铁", "duration_minutes": 90, "cost_min": 110, "cost_max": 180, "frequency": "每30分钟一班", "notes": "上海虹桥-扬州东", "distance_km": 254},
    {"from_city": "上海", "to_city": "绍兴", "transport_type": "高铁", "duration_minutes": 75, "cost_min": 90, "cost_max": 140, "frequency": "每20分钟一班", "notes": "上海虹桥-绍兴北", "distance_km": 198},
    {"from_city": "上海", "to_city": "嘉兴", "transport_type": "高铁", "duration_minutes": 30, "cost_min": 35, "cost_max": 55, "frequency": "每15分钟一班", "notes": "上海虹桥-嘉兴南", "distance_km": 85},
    {"from_city": "上海", "to_city": "宁波", "transport_type": "高铁", "duration_minutes": 100, "cost_min": 140, "cost_max": 220, "frequency": "每15分钟一班", "notes": "上海虹桥-宁波", "distance_km": 314},
    {"from_city": "上海", "to_city": "常州", "transport_type": "高铁", "duration_minutes": 40, "cost_min": 55, "cost_max": 85, "frequency": "每10分钟一班", "notes": "上海虹桥-常州北", "distance_km": 165},
    {"from_city": "杭州", "to_city": "苏州", "transport_type": "高铁", "duration_minutes": 90, "cost_min": 110, "cost_max": 180, "frequency": "每20分钟一班", "notes": "杭州东-苏州北", "distance_km": 160},
    {"from_city": "杭州", "to_city": "南京", "transport_type": "高铁", "duration_minutes": 70, "cost_min": 120, "cost_max": 200, "frequency": "每15分钟一班", "notes": "杭州东-南京南", "distance_km": 280},
    {"from_city": "杭州", "to_city": "无锡", "transport_type": "高铁", "duration_minutes": 60, "cost_min": 80, "cost_max": 130, "frequency": "每20分钟一班", "notes": "杭州东-无锡东", "distance_km": 180},
    {"from_city": "杭州", "to_city": "绍兴", "transport_type": "高铁", "duration_minutes": 20, "cost_min": 25, "cost_max": 40, "frequency": "每10分钟一班", "notes": "杭州东-绍兴北", "distance_km": 50},
    {"from_city": "杭州", "to_city": "嘉兴", "transport_type": "高铁", "duration_minutes": 25, "cost_min": 30, "cost_max": 50, "frequency": "每15分钟一班", "notes": "杭州东-嘉兴南", "distance_km": 80},
    {"from_city": "杭州", "to_city": "宁波", "transport_type": "高铁", "duration_minutes": 55, "cost_min": 70, "cost_max": 110, "frequency": "每10分钟一班", "notes": "杭州东-宁波", "distance_km": 155},
    {"from_city": "苏州", "to_city": "南京", "transport_type": "高铁", "duration_minutes": 50, "cost_min": 90, "cost_max": 150, "frequency": "每15分钟一班", "notes": "苏州北-南京南", "distance_km": 217},
    {"from_city": "苏州", "to_city": "无锡", "transport_type": "高铁", "duration_minutes": 15, "cost_min": 20, "cost_max": 30, "frequency": "每10分钟一班", "notes": "苏州北-无锡东", "distance_km": 42},
    {"from_city": "苏州", "to_city": "扬州", "transport_type": "高铁", "duration_minutes": 60, "cost_min": 80, "cost_max": 130, "frequency": "每30分钟一班", "notes": "苏州北-扬州东", "distance_km": 170},
    {"from_city": "苏州", "to_city": "常州", "transport_type": "高铁", "duration_minutes": 20, "cost_min": 25, "cost_max": 40, "frequency": "每10分钟一班", "notes": "苏州北-常州北", "distance_km": 81},
    {"from_city": "南京", "to_city": "无锡", "transport_type": "高铁", "duration_minutes": 40, "cost_min": 70, "cost_max": 110, "frequency": "每15分钟一班", "notes": "南京南-无锡东", "distance_km": 175},
    {"from_city": "南京", "to_city": "扬州", "transport_type": "高铁", "duration_minutes": 30, "cost_min": 40, "cost_max": 65, "frequency": "每20分钟一班", "notes": "南京南-扬州东", "distance_km": 87},
    {"from_city": "南京", "to_city": "常州", "transport_type": "高铁", "duration_minutes": 30, "cost_min": 50, "cost_max": 80, "frequency": "每15分钟一班", "notes": "南京南-常州北", "distance_km": 136},
    {"from_city": "无锡", "to_city": "扬州", "transport_type": "高铁", "duration_minutes": 45, "cost_min": 60, "cost_max": 100, "frequency": "每30分钟一班", "notes": "无锡东-扬州东", "distance_km": 128},
    {"from_city": "无锡", "to_city": "常州", "transport_type": "高铁", "duration_minutes": 10, "cost_min": 15, "cost_max": 25, "frequency": "每10分钟一班", "notes": "无锡东-常州北", "distance_km": 39},
    {"from_city": "嘉兴", "to_city": "宁波", "transport_type": "高铁", "duration_minutes": 70, "cost_min": 100, "cost_max": 160, "frequency": "每20分钟一班", "notes": "嘉兴南-宁波", "distance_km": 230},
    {"from_city": "上海", "to_city": "杭州", "transport_type": "自驾", "duration_minutes": 150, "cost_min": 120, "cost_max": 150, "frequency": "随时", "notes": "约180公里，高速费约80元", "distance_km": 180},
    {"from_city": "上海", "to_city": "苏州", "transport_type": "自驾", "duration_minutes": 90, "cost_min": 60, "cost_max": 80, "frequency": "随时", "notes": "约100公里，高速费约40元", "distance_km": 100},
    {"from_city": "上海", "to_city": "南京", "transport_type": "自驾", "duration_minutes": 240, "cost_min": 200, "cost_max": 250, "frequency": "随时", "notes": "约300公里，高速费约140元", "distance_km": 300},
    {"from_city": "杭州", "to_city": "苏州", "transport_type": "自驾", "duration_minutes": 150, "cost_min": 120, "cost_max": 150, "frequency": "随时", "notes": "约160公里，高速费约70元", "distance_km": 160},
    {"from_city": "苏州", "to_city": "无锡", "transport_type": "自驾", "duration_minutes": 40, "cost_min": 30, "cost_max": 40, "frequency": "随时", "notes": "约50公里，高速费约20元", "distance_km": 50}
]

BUSINESS_RULES_DATA = [
    {"rule_type": "闭馆日", "rule_name": "苏州博物馆周一闭馆", "description": "苏州博物馆每周一闭馆，节假日除外", "city": "苏州", "condition_type": "weekday", "condition_value": "周一", "action_type": "exclude", "action_value": "苏州博物馆", "priority": 10, "is_active": True},
    {"rule_type": "闭馆日", "rule_name": "上海博物馆周一闭馆", "description": "上海博物馆每周一闭馆", "city": "上海", "condition_type": "weekday", "condition_value": "周一", "action_type": "exclude", "action_value": "上海博物馆", "priority": 10, "is_active": True},
    {"rule_type": "闭馆日", "rule_name": "南京博物院周一闭馆", "description": "南京博物院每周一闭馆", "city": "南京", "condition_type": "weekday", "condition_value": "周一", "action_type": "exclude", "action_value": "南京博物院", "priority": 10, "is_active": True},
    {"rule_type": "闭馆日", "rule_name": "总统府周一闭馆", "description": "南京总统府每周一闭馆", "city": "南京", "condition_type": "weekday", "condition_value": "周一", "action_type": "exclude", "action_value": "总统府", "priority": 10, "is_active": True},
    {"rule_type": "闭馆日", "rule_name": "鲁迅故里周一闭馆", "description": "鲁迅故里每周一闭馆", "city": "绍兴", "condition_type": "weekday", "condition_value": "周一", "action_type": "exclude", "action_value": "鲁迅故里", "priority": 10, "is_active": True},
    {"rule_type": "闭馆日", "rule_name": "天一阁周一闭馆", "description": "天一阁每周一闭馆", "city": "宁波", "condition_type": "weekday", "condition_value": "周一", "action_type": "exclude", "action_value": "天一阁", "priority": 10, "is_active": True},
    {"rule_type": "预约要求", "rule_name": "拙政园需提前预约", "description": "拙政园需提前1天预约", "city": "苏州", "condition_type": "booking_advance", "condition_value": "1", "action_type": "require_booking", "action_value": "拙政园", "priority": 8, "is_active": True},
    {"rule_type": "预约要求", "rule_name": "苏州博物馆需提前预约", "description": "苏州博物馆需提前7天预约", "city": "苏州", "condition_type": "booking_advance", "condition_value": "7", "action_type": "require_booking", "action_value": "苏州博物馆", "priority": 8, "is_active": True},
    {"rule_type": "预约要求", "rule_name": "中山陵需提前预约", "description": "中山陵需提前1天预约", "city": "南京", "condition_type": "booking_advance", "condition_value": "1", "action_type": "require_booking", "action_value": "中山陵", "priority": 8, "is_active": True},
    {"rule_type": "预约要求", "rule_name": "上海迪士尼需提前预约", "description": "上海迪士尼需提前3天预约", "city": "上海", "condition_type": "booking_advance", "condition_value": "3", "action_type": "require_booking", "action_value": "上海迪士尼乐园", "priority": 8, "is_active": True},
    {"rule_type": "时间调整", "rule_name": "中山陵周一祭堂闭馆", "description": "中山陵周一祭堂闭馆维护，其他区域正常开放", "city": "南京", "condition_type": "weekday", "condition_value": "周一", "action_type": "partial_close", "action_value": "中山陵祭堂", "priority": 9, "is_active": True},
    {"rule_type": "时间调整", "rule_name": "鼋头渚樱花季延长开放", "description": "鼋头渚樱花季期间延长开放时间", "city": "无锡", "condition_type": "date_range", "condition_value": "03-15,04-15", "action_type": "extend_hours", "action_value": "07:00-20:00", "priority": 7, "is_active": True},
    {"rule_type": "价格调整", "rule_name": "乌镇节假日票价上浮", "description": "乌镇节假日票价上浮", "city": "嘉兴", "condition_type": "holiday", "condition_value": "all", "action_type": "price_adjust", "action_value": "190", "priority": 6, "is_active": True},
    {"rule_type": "价格调整", "rule_name": "上海迪士尼节假日票价上浮", "description": "上海迪士尼节假日票价上浮", "city": "上海", "condition_type": "holiday", "condition_value": "all", "action_type": "price_adjust", "action_value": "665", "priority": 6, "is_active": True},
    {"rule_type": "客流限制", "rule_name": "拙政园每日限流", "description": "拙政园每日限流3万人次", "city": "苏州", "condition_type": "daily_limit", "condition_value": "30000", "action_type": "visitor_limit", "action_value": "拙政园", "priority": 7, "is_active": True}
]

HOLIDAYS_DATA = [
    {"name": "元旦", "date": "2026-01-01", "is_public_holiday": True, "affected_cities": "all", "special_notes": "三天小长假"},
    {"name": "春节", "date": "2026-02-17", "is_public_holiday": True, "affected_cities": "all", "special_notes": "七天长假，景区人流量极大"},
    {"name": "清明节", "date": "2026-04-05", "is_public_holiday": True, "affected_cities": "all", "special_notes": "三天小长假，赏花踏青"},
    {"name": "劳动节", "date": "2026-05-01", "is_public_holiday": True, "affected_cities": "all", "special_notes": "五天长假，景区人流量极大"},
    {"name": "端午节", "date": "2026-05-31", "is_public_holiday": True, "affected_cities": "all", "special_notes": "三天小长假"},
    {"name": "中秋节", "date": "2026-09-25", "is_public_holiday": True, "affected_cities": "all", "special_notes": "三天小长假"},
    {"name": "国庆节", "date": "2026-10-01", "is_public_holiday": True, "affected_cities": "all", "special_notes": "七天长假，景区人流量极大"}
]


def init_enhanced_database(force_recreate: bool = False):
    """初始化增强版数据库"""
    from enhanced_models import Base
    from database import EnhancedSessionLocal, enhanced_engine
    import json
    
    if force_recreate:
        Base.metadata.drop_all(bind=enhanced_engine)
        print("已删除旧表结构")
    
    Base.metadata.create_all(bind=enhanced_engine)
    
    db = EnhancedSessionLocal()
    try:
        from enhanced_models import City, Attraction, Restaurant, Hotel, TransportMatrix, BusinessRule, Holiday
        
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
            attr_data_copy["city_id"] = city_map.get(attr_data_copy["city"])
            attraction = Attraction(**attr_data_copy)
            db.add(attraction)
        db.commit()
        print(f"已导入 {len(ATTRACTIONS_DATA)} 个景点")
        
        print("开始初始化餐厅数据...")
        for rest_data in RESTAURANTS_DATA:
            rest_data_copy = rest_data.copy()
            rest_data_copy["city_id"] = city_map.get(rest_data_copy["city"])
            restaurant = Restaurant(**rest_data_copy)
            db.add(restaurant)
        db.commit()
        print(f"已导入 {len(RESTAURANTS_DATA)} 家餐厅")
        
        print("开始初始化酒店数据...")
        for hotel_data in HOTELS_DATA:
            hotel_data_copy = hotel_data.copy()
            hotel_data_copy["city_id"] = city_map.get(hotel_data_copy["city"])
            hotel = Hotel(**hotel_data_copy)
            db.add(hotel)
        db.commit()
        print(f"已导入 {len(HOTELS_DATA)} 家酒店")
        
        print("开始初始化交通矩阵数据...")
        for transport_data in TRANSPORT_MATRIX_DATA:
            transport = TransportMatrix(**transport_data)
            db.add(transport)
        db.commit()
        print(f"已导入 {len(TRANSPORT_MATRIX_DATA)} 条交通数据")
        
        print("开始初始化业务规则数据...")
        for rule_data in BUSINESS_RULES_DATA:
            rule = BusinessRule(**rule_data)
            db.add(rule)
        db.commit()
        print(f"已导入 {len(BUSINESS_RULES_DATA)} 条业务规则")
        
        print("开始初始化节假日数据...")
        for holiday_data in HOLIDAYS_DATA:
            holiday_data_copy = holiday_data.copy()
            holiday_data_copy["date"] = datetime.strptime(holiday_data_copy["date"], "%Y-%m-%d").date()
            holiday = Holiday(**holiday_data_copy)
            db.add(holiday)
        db.commit()
        print(f"已导入 {len(HOLIDAYS_DATA)} 个节假日")
        
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
    init_enhanced_database(force_recreate=force)
