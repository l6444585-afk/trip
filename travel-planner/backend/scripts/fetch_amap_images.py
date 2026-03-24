"""
从高德 POI API 批量拉取景点实景图片
"""
import json
import time
import urllib.request
import urllib.parse
import sys

AMAP_KEY = "3e113cec7b87aef5348421baf5e9f1b6"

SCENIC_SPOTS = [
    ("上海迪士尼乐园", "上海"), ("上海外滩", "上海"), ("上海东方明珠", "上海"),
    ("上海豫园", "上海"), ("上海野生动物园", "上海"), ("上海田子坊", "上海"),
    ("上海中华艺术宫", "上海"), ("杭州西湖", "杭州"), ("杭州灵隐寺", "杭州"),
    ("杭州宋城", "杭州"), ("杭州西溪湿地", "杭州"), ("杭州千岛湖", "杭州"),
    ("杭州龙井村", "杭州"), ("苏州拙政园", "苏州"), ("苏州留园", "苏州"),
    ("苏州虎丘", "苏州"), ("苏州平江路", "苏州"), ("苏州周庄古镇", "苏州"),
    ("苏州同里古镇", "苏州"), ("南京中山陵", "南京"), ("南京夫子庙", "南京"),
    ("南京总统府", "南京"), ("南京明孝陵", "南京"), ("南京玄武湖", "南京"),
    ("无锡鼋头渚", "无锡"), ("无锡灵山大佛", "无锡"), ("无锡惠山古镇", "无锡"),
    ("扬州瘦西湖", "扬州"), ("扬州个园", "扬州"), ("扬州大明寺", "扬州"),
    ("宁波天一阁", "宁波"), ("宁波溪口-滕头旅游区", "宁波"),
    ("绍兴鲁迅故里", "绍兴"), ("绍兴安昌古镇", "绍兴"),
    ("嘉兴乌镇", "嘉兴"), ("嘉兴西塘古镇", "嘉兴"), ("嘉兴南湖", "嘉兴"),
    ("湖州南浔古镇", "湖州"), ("湖州莫干山", "湖州"),
    ("舟山普陀山", "舟山"), ("舟山朱家尖", "舟山"),
    ("金华横店影视城", "金华"), ("常州中华恐龙园", "常州"), ("常州天目湖", "常州"),
    ("镇江金山", "镇江"), ("镇江西津渡", "镇江"),
    ("温州雁荡山", "温州"), ("温州楠溪江", "温州"),
    ("南通濠河风景区", "南通"), ("台州天台山", "台州"),
]


def fetch_photos(name, city):
    """通过高德 POI 搜索获取景点图片"""
    params = urllib.parse.urlencode({
        "key": AMAP_KEY,
        "keywords": name,
        "city": city,
        "extensions": "all",
        "output": "json",
        "offset": 1,
    })
    url = f"https://restapi.amap.com/v3/place/text?{params}"

    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())

        if data.get("infocode") != "10000" or not data.get("pois"):
            return []

        poi = data["pois"][0]
        photos = poi.get("photos", [])
        # 提取图片 URL，转为 https
        urls = []
        for p in photos:
            u = p.get("url", "")
            if u:
                urls.append(u.replace("http://", "https://"))
        return urls
    except Exception as e:
        print(f"  [ERROR] {name}: {e}", file=sys.stderr)
        return []


def main():
    results = {}
    for i, (name, city) in enumerate(SCENIC_SPOTS):
        photos = fetch_photos(name, city)
        results[name] = photos
        status = f"✓ {len(photos)}张" if photos else "✗ 无图"
        print(f"[{i+1:2d}/50] {name:　<12s} {status}")
        time.sleep(0.15)  # 限流

    # 输出 JSON
    output_path = "/Users/tkag/Projects/trip/travel-planner/backend/data/amap_photos.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    total = sum(len(v) for v in results.values())
    empty = sum(1 for v in results.values() if not v)
    print(f"\n完成! 共获取 {total} 张图片, {empty} 个景点无图")
    print(f"结果保存至: {output_path}")


if __name__ == "__main__":
    main()
