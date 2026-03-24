"""
第三方平台链接健康检查 + 自动修复
后端启动时执行：检测平台链接是否可达，挂了自动切换备选 URL
"""
import json
import logging
import os
import sys
import urllib.request
import urllib.parse

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

logger = logging.getLogger("platform_links")

TIMEOUT = 8
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
OK_CODES = {200, 201, 202, 301, 302}

# 每个平台的备选 URL 模板（按优先级排列）
# {kw} 会被替换为 URL 编码后的景点名
PLATFORM_CANDIDATES = {
    "ctrip": {
        "name": "携程",
        "urls": [
            "https://you.ctrip.com/sight/0/s-{kw}.html",
            "https://m.ctrip.com/webapp/you/sight/search?keyword={kw}",
        ],
    },
    "qunar": {
        "name": "去哪儿",
        "urls": [
            "https://piao.qunar.com/ticket/list.htm?keyword={kw}",
            "https://travel.qunar.com/p-oi/search?keyword={kw}",
        ],
    },
    "mafengwo": {
        "name": "马蜂窝",
        "urls": [
            "https://www.mafengwo.cn/search/q.php?q={kw}",
            "https://www.mafengwo.cn/search/s.php?q={kw}",
        ],
    },
    "fliggy": {
        "name": "飞猪旅行",
        "urls": [
            "https://www.fliggy.com/search/index?searchType=product&keyword={kw}",
        ],
    },
}

# 当主平台全挂时的后备平台
FALLBACK_PLATFORMS = {
    "tongcheng": {
        "name": "同程旅行",
        "urls": [
            "https://www.ly.com/scenery/searchscenery.aspx?searchkey={kw}",
        ],
    },
    "douyin": {
        "name": "抖音",
        "urls": [
            "https://www.douyin.com/search/{kw}",
        ],
    },
}


def _check_url(url):
    """检测 URL 是否可达"""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            code = resp.getcode()
            return code, code in OK_CODES
    except urllib.error.HTTPError as e:
        return e.code, False
    except Exception:
        return 0, False


def _find_working_url(candidates, test_keyword="上海迪士尼乐园"):
    """从候选 URL 列表中找到第一个可用的"""
    kw = urllib.parse.quote(test_keyword)
    for template in candidates:
        url = template.replace("{kw}", kw)
        code, ok = _check_url(url)
        if ok:
            return template, code
    return None, 0


def check_and_repair():
    """
    检查所有平台链接，自动修复失效的。
    返回 {platform_key: url_template} 的最新可用映射。
    """
    working = {}
    broken = []

    logger.info("开始平台链接健康检查...")

    for key, config in PLATFORM_CANDIDATES.items():
        template, code = _find_working_url(config["urls"])
        if template:
            working[key] = {"name": config["name"], "template": template}
            logger.info(f"  ✓ {config['name']:8s} [{code}]")
        else:
            broken.append(key)
            logger.warning(f"  ✗ {config['name']:8s} 所有候选 URL 均不可达")

    # 对挂掉的平台尝试后备替换
    for dead_key in broken:
        replaced = False
        for fb_key, fb_config in FALLBACK_PLATFORMS.items():
            if fb_key in working:
                continue
            template, code = _find_working_url(fb_config["urls"])
            if template:
                working[fb_key] = {"name": fb_config["name"], "template": template}
                logger.info(f"  ↻ {PLATFORM_CANDIDATES[dead_key]['name']} 已替换为 {fb_config['name']} [{code}]")
                replaced = True
                break
        if not replaced:
            logger.error(f"  ✗ {PLATFORM_CANDIDATES[dead_key]['name']} 无可用替代")

    logger.info(f"检查完成: {len(working)} 个平台可用, {len(broken)} 个已修复/移除")
    return working


def rebuild_platform_links(working_platforms):
    """用最新的可用平台重建所有景区的 platform_links 并更新数据库"""
    from database import SessionLocal
    from models import Attraction

    db = SessionLocal()
    try:
        spots = db.query(Attraction).all()
        updated = 0
        for spot in spots:
            new_links = {}
            kw = urllib.parse.quote(spot.name)
            for key, info in working_platforms.items():
                url = info["template"].replace("{kw}", kw)
                new_links[key] = {"name": info["name"], "url": url}

            new_json = json.dumps(new_links, ensure_ascii=False)
            if spot.platform_links != new_json:
                spot.platform_links = new_json
                updated += 1

        if updated > 0:
            db.commit()
            logger.info(f"已更新 {updated} 条景区的平台链接")
        else:
            logger.info("所有链接均为最新，无需更新")
    finally:
        db.close()


def startup_check():
    """后端启动时调用：检查 + 自动修复"""
    working = check_and_repair()
    if working:
        rebuild_platform_links(working)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    startup_check()
