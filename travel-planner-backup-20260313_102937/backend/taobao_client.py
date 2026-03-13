"""
淘宝开放平台 API 客户端基类
支持飞猪四海通CPS接口调用
"""
import hashlib
import hmac
import time
import uuid
import json
from typing import Dict, Any, Optional, List
from urllib.parse import urlencode, quote
import httpx
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()


class TaobaoAPIClient:
    """
    淘宝开放平台API客户端
    
    支持的API:
    - alibaba.fliggy.cps.hotel.compare: 酒店比价
    - alibaba.fliggy.promote.orders.newlist: 订单列表
    - alibaba.fliggy.promote.hotel.details: 酒店详情（需确认接口名称）
    """
    
    GATEWAY_URL = "https://eco.taobao.com/router/rest"
    SANDBOX_URL = "https://gw.api.tbsandbox.com/router/rest"
    
    def __init__(
        self,
        app_key: Optional[str] = None,
        app_secret: Optional[str] = None,
        sandbox: bool = False
    ):
        self.app_key = app_key or os.getenv("TAOBAO_APP_KEY", "")
        self.app_secret = app_secret or os.getenv("TAOBAO_APP_SECRET", "")
        self.sandbox = sandbox
        self.base_url = self.SANDBOX_URL if sandbox else self.GATEWAY_URL
        
    def _generate_sign(self, params: Dict[str, Any]) -> str:
        """
        生成API签名
        签名规则: HMAC-MD5(secret, sorted_params_string)
        """
        sorted_params = sorted(params.items(), key=lambda x: x[0])
        param_string = "".join([f"{k}{v}" for k, v in sorted_params])
        
        sign = hmac.new(
            self.app_secret.encode('utf-8'),
            param_string.encode('utf-8'),
            hashlib.md5
        ).hexdigest().upper()
        
        return sign
    
    def _build_common_params(self, method: str) -> Dict[str, Any]:
        """
        构建公共请求参数
        """
        return {
            "method": method,
            "app_key": self.app_key,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "format": "json",
            "v": "2.0",
            "sign_method": "hmac",
            "partner_id": "trip-planner",
            "simplify": "true",
            "request_id": str(uuid.uuid4())
        }
    
    async def request(
        self,
        method: str,
        api_params: Dict[str, Any],
        session_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        发送API请求
        
        Args:
            method: API方法名
            api_params: API业务参数
            session_key: 用户授权session（部分接口需要）
        
        Returns:
            API响应数据
        """
        params = self._build_common_params(method)
        params.update(api_params)
        
        if session_key:
            params["session"] = session_key
        
        params["sign"] = self._generate_sign(params)
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    data=params,
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                response.raise_for_status()
                result = response.json()
                
                if "error_response" in result:
                    error = result["error_response"]
                    raise TaobaoAPIError(
                        code=error.get("code", "UNKNOWN"),
                        msg=error.get("msg", "未知错误"),
                        sub_code=error.get("sub_code"),
                        sub_msg=error.get("sub_msg")
                    )
                
                return result
                
        except httpx.HTTPError as e:
            raise TaobaoAPIError(
                code="HTTP_ERROR",
                msg=f"HTTP请求失败: {str(e)}"
            )
        except json.JSONDecodeError as e:
            raise TaobaoAPIError(
                code="JSON_ERROR",
                msg=f"JSON解析失败: {str(e)}"
            )


class TaobaoAPIError(Exception):
    """淘宝API异常"""
    
    def __init__(
        self,
        code: str,
        msg: str,
        sub_code: Optional[str] = None,
        sub_msg: Optional[str] = None
    ):
        self.code = code
        self.msg = msg
        self.sub_code = sub_code
        self.sub_msg = sub_msg
        super().__init__(f"[{code}] {msg}" + (f" - {sub_msg}" if sub_msg else ""))


class FliggyCPSClient(TaobaoAPIClient):
    """
    飞猪四海通CPS客户端
    提供酒店比价、订单查询等功能
    """
    
    async def hotel_compare(
        self,
        sh_id: str,
        check_in: str,
        check_out: str,
        user_id: Optional[int] = None,
        promotion_position_id: Optional[int] = None,
        client_type: str = "h5",
        activity_id: Optional[str] = None,
        max_price: Optional[int] = None,
        with_qr_code: bool = True
    ) -> Dict[str, Any]:
        """
        酒店比价接口
        
        Args:
            sh_id: 飞猪标准酒店ID
            check_in: 入住日期 (YYYY-MM-DD)
            check_out: 离店日期 (YYYY-MM-DD)
            user_id: 用户ID
            promotion_position_id: 推广位ID
            client_type: 客户端类型 (h5/weixin/app)
            activity_id: 活动ID
            max_price: 最高价格（分）
            with_qr_code: 是否返回二维码
        
        Returns:
            比价结果
        """
        request_data = {
            "sh_id": sh_id,
            "check_in": check_in,
            "check_out": check_out,
            "client": client_type,
            "with_qr_code": with_qr_code
        }
        
        if user_id:
            request_data["user_id"] = user_id
        if promotion_position_id:
            request_data["promotion_position_id"] = promotion_position_id
        if activity_id:
            request_data["activity_id"] = activity_id
        if max_price:
            request_data["max_price"] = max_price
        
        api_params = {
            "hotel_compare_price_request": json.dumps(request_data)
        }
        
        return await self.request(
            "alibaba.fliggy.cps.hotel.compare",
            api_params
        )
    
    async def get_promote_orders(
        self,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        page_no: int = 1,
        page_size: int = 20,
        order_status: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        获取推广订单列表
        
        Args:
            start_time: 开始时间
            end_time: 结束时间
            page_no: 页码
            page_size: 每页数量
            order_status: 订单状态
        
        Returns:
            订单列表
        """
        api_params = {
            "page_no": page_no,
            "page_size": page_size
        }
        
        if start_time:
            api_params["start_time"] = start_time
        if end_time:
            api_params["end_time"] = end_time
        if order_status is not None:
            api_params["order_status"] = order_status
        
        return await self.request(
            "alibaba.fliggy.promote.orders.newlist",
            api_params
        )
    
    async def get_hotel_details(
        self,
        hotel_id: str,
        activity_id: str,
        promotion_position_id: int,
        promote_app_key: int,
        need_new_query: bool = False
    ) -> Dict[str, Any]:
        """
        四海通推广者酒店详细查询
        
        API: alibaba.fliggy.promote.hotel.details
        免费，不需要用户授权
        
        Args:
            hotel_id: 酒店ID
            activity_id: 活动编码
            promotion_position_id: 推广位ID
            promote_app_key: 媒体ID，推广平台生成给渠道
            need_new_query: 是否走新接口
        
        Returns:
            酒店详细信息，包含：
            - hotel_id: 酒店ID
            - hotel_name: 酒店名称
            - address: 地址
            - city_code/city_name: 城市编码/名称
            - latitude/longitude: 经纬度
            - phone_list: 手机号列表
            - hotel_type: 酒店类型(HOTEL/APARTMENT/HOMESTAY等)
            - facilities: 设施列表
            - hotel_star: 酒店星级
            - hotel_category: 推荐星级(2经济型/3舒适型/4高档型/5豪华型)
            - brand_name: 品牌名称
            - group_name: 集团名称
            - hotel_desc: 酒店描述
            - room_list: 房间列表
        """
        request_data = {
            "hotel_id": hotel_id,
            "activity_id": activity_id,
            "promotion_position_id": promotion_position_id,
            "promote_app_key": promote_app_key,
            "need_new_query": need_new_query
        }
        
        api_params = {
            "query_hotel_details_request": json.dumps(request_data)
        }
        
        return await self.request(
            "alibaba.fliggy.promote.hotel.details",
            api_params
        )
    
    async def get_hotel_details_simple(
        self,
        sh_id: str,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        获取酒店详情（简化版，使用比价接口）
        
        Args:
            sh_id: 飞猪标准酒店ID
            check_in: 入住日期
            check_out: 离店日期
        
        Returns:
            酒店详情
        """
        if check_in and check_out:
            return await self.hotel_compare(
                sh_id=sh_id,
                check_in=check_in,
                check_out=check_out
            )
        
        return {
            "success": False,
            "error": "需要提供入住和离店日期",
            "sh_id": sh_id
        }


class FliggyHotelSearchClient(TaobaoAPIClient):
    """
    飞猪酒店搜索客户端
    用于搜索酒店列表
    """
    
    async def search_hotels(
        self,
        city_id: Optional[str] = None,
        keyword: Optional[str] = None,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        radius: Optional[int] = None,
        price_min: Optional[int] = None,
        price_max: Optional[int] = None,
        star_rating: Optional[List[int]] = None,
        page_no: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """
        搜索酒店
        
        Args:
            city_id: 城市ID
            keyword: 搜索关键词
            check_in: 入住日期
            check_out: 离店日期
            latitude: 纬度
            longitude: 经度
            radius: 搜索半径（米）
            price_min: 最低价格
            price_max: 最高价格
            star_rating: 星级筛选
            page_no: 页码
            page_size: 每页数量
        
        Returns:
            酒店列表
        """
        api_params = {
            "page_no": page_no,
            "page_size": page_size
        }
        
        if city_id:
            api_params["city_id"] = city_id
        if keyword:
            api_params["keyword"] = keyword
        if check_in:
            api_params["check_in"] = check_in
        if check_out:
            api_params["check_out"] = check_out
        if latitude and longitude:
            api_params["location"] = f"{latitude},{longitude}"
        if radius:
            api_params["radius"] = radius
        if price_min:
            api_params["price_min"] = price_min
        if price_max:
            api_params["price_max"] = price_max
        if star_rating:
            api_params["star_rating"] = ",".join(map(str, star_rating))
        
        try:
            return await self.request(
                "taobao.xhotel.search",
                api_params
            )
        except TaobaoAPIError as e:
            return {
                "success": False,
                "error": str(e),
                "hotels": []
            }


class FliggyHotelProductClient(TaobaoAPIClient):
    """
    飞猪酒店商品API客户端
    用于查询酒店、房型、价格等信息
    
    所有接口免费，但需要商家授权
    """
    
    async def get_hotel(
        self,
        hid: Optional[str] = None,
        outer_id: Optional[str] = None,
        shid: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        酒店查询接口 (taobao.xhotel.get)
        
        Args:
            hid: 酒店ID
            outer_id: 外部酒店ID
            shid: 标准酒店ID
        
        Returns:
            酒店信息
        """
        api_params = {}
        if hid:
            api_params["hid"] = hid
        if outer_id:
            api_params["outer_id"] = outer_id
        if shid:
            api_params["shid"] = shid
        
        return await self.request("taobao.xhotel.get", api_params)
    
    async def get_hotel_baseinfo(
        self,
        hid: Optional[str] = None,
        outer_id: Optional[str] = None,
        shid: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        酒店基础信息查询接口 (taobao.xhotel.baseinfo.get)
        
        Args:
            hid: 酒店ID
            outer_id: 外部酒店ID
            shid: 标准酒店ID
        
        Returns:
            酒店基础信息
        """
        api_params = {}
        if hid:
            api_params["hid"] = hid
        if outer_id:
            api_params["outer_id"] = outer_id
        if shid:
            api_params["shid"] = shid
        
        return await self.request("taobao.xhotel.baseinfo.get", api_params)
    
    async def get_roomtype(
        self,
        rid: Optional[str] = None,
        outer_id: Optional[str] = None,
        hid: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        房型查询接口 (taobao.xhotel.roomtype.get)
        
        Args:
            rid: 房型ID
            outer_id: 外部房型ID
            hid: 酒店ID
        
        Returns:
            房型信息
        """
        api_params = {}
        if rid:
            api_params["rid"] = rid
        if outer_id:
            api_params["outer_id"] = outer_id
        if hid:
            api_params["hid"] = hid
        
        return await self.request("taobao.xhotel.roomtype.get", api_params)
    
    async def get_room(
        self,
        rid: Optional[str] = None,
        outer_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        room实体查询 (taobao.xhotel.room.get)
        
        Args:
            rid: room ID
            outer_id: 外部ID
        
        Returns:
            room信息
        """
        api_params = {}
        if rid:
            api_params["rid"] = rid
        if outer_id:
            api_params["outer_id"] = outer_id
        
        return await self.request("taobao.xhotel.room.get", api_params)
    
    async def get_rateplan(
        self,
        rpid: Optional[str] = None,
        outer_id: Optional[str] = None,
        hid: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        价格计划rateplan查询 (taobao.xhotel.rateplan.get)
        
        Args:
            rpid: rateplan ID
            outer_id: 外部ID
            hid: 酒店ID
        
        Returns:
            rateplan信息
        """
        api_params = {}
        if rpid:
            api_params["rpid"] = rpid
        if outer_id:
            api_params["outer_id"] = outer_id
        if hid:
            api_params["hid"] = hid
        
        return await self.request("taobao.xhotel.rateplan.get", api_params)
    
    async def get_rate(
        self,
        rid: Optional[str] = None,
        outer_id: Optional[str] = None,
        hid: Optional[str] = None,
        rpid: Optional[str] = None,
        date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        酒店产品库rate查询 (taobao.xhotel.rate.get)
        
        Args:
            rid: rate ID
            outer_id: 外部ID
            hid: 酒店ID
            rpid: rateplan ID
            date: 日期
        
        Returns:
            rate信息
        """
        api_params = {}
        if rid:
            api_params["rid"] = rid
        if outer_id:
            api_params["outer_id"] = outer_id
        if hid:
            api_params["hid"] = hid
        if rpid:
            api_params["rpid"] = rpid
        if date:
            api_params["date"] = date
        
        return await self.request("taobao.xhotel.rate.get", api_params)
    
    async def get_baseinfo_room(
        self,
        hid: Optional[str] = None,
        outer_id: Optional[str] = None,
        shid: Optional[str] = None,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        酒店房型与房价查询 (taobao.xhotel.baseinfo.room.get)
        
        Args:
            hid: 酒店ID
            outer_id: 外部酒店ID
            shid: 标准酒店ID
            check_in: 入住日期
            check_out: 离店日期
        
        Returns:
            酒店房型与房价信息
        """
        api_params = {}
        if hid:
            api_params["hid"] = hid
        if outer_id:
            api_params["outer_id"] = outer_id
        if shid:
            api_params["shid"] = shid
        if check_in:
            api_params["check_in"] = check_in
        if check_out:
            api_params["check_out"] = check_out
        
        return await self.request("taobao.xhotel.baseinfo.room.get", api_params)
    
    async def get_multiplerate(
        self,
        hid: Optional[str] = None,
        outer_id: Optional[str] = None,
        rpid: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        复杂房价查询接口 (taobao.xhotel.multiplerate.get)
        
        Args:
            hid: 酒店ID
            outer_id: 外部ID
            rpid: rateplan ID
            start_date: 开始日期
            end_date: 结束日期
        
        Returns:
            复杂房价信息
        """
        api_params = {}
        if hid:
            api_params["hid"] = hid
        if outer_id:
            api_params["outer_id"] = outer_id
        if rpid:
            api_params["rpid"] = rpid
        if start_date:
            api_params["start_date"] = start_date
        if end_date:
            api_params["end_date"] = end_date
        
        return await self.request("taobao.xhotel.multiplerate.get", api_params)
    
    async def get_increment_info(
        self,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        page_no: int = 1,
        page_size: int = 50
    ) -> Dict[str, Any]:
        """
        酒店状态增量查询接口 (taobao.xhotel.increment.info.get)
        
        Args:
            start_time: 开始时间
            end_time: 结束时间
            page_no: 页码
            page_size: 每页数量
        
        Returns:
            增量信息
        """
        api_params = {
            "page_no": page_no,
            "page_size": page_size
        }
        if start_time:
            api_params["start_time"] = start_time
        if end_time:
            api_params["end_time"] = end_time
        
        return await self.request("taobao.xhotel.increment.info.get", api_params)
