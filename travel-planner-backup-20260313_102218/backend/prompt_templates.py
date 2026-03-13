"""
Prompt模板管理模块
实现Prompt与业务代码的解耦，支持模板化管理和动态渲染
"""
from typing import Dict, List, Optional, Any
from string import Template
import json
from pathlib import Path
import os


class PromptTemplate:
    """Prompt模板类"""
    
    def __init__(self, name: str, template: str, description: str = "", variables: List[str] = None):
        self.name = name
        self.template = template
        self.description = description
        self.variables = variables or []
    
    def render(self, **kwargs) -> str:
        """渲染模板"""
        try:
            return self.template.format(**kwargs)
        except KeyError as e:
            raise ValueError(f"模板变量缺失: {e}")
    
    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "template": self.template,
            "description": self.description,
            "variables": self.variables
        }


class PromptTemplateManager:
    """Prompt模板管理器"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._templates = {}
            cls._instance._load_default_templates()
        return cls._instance
    
    def _load_default_templates(self):
        """加载默认模板"""
        self._templates["system_base"] = PromptTemplate(
            name="system_base",
            template="""你是一个面向江浙沪地区的智能旅游行程规划系统，具备以下能力：

【系统角色】
1. 需求理解：将自然语言需求转化为结构化用户画像
2. 行程优化：基于多目标（时间、费用、体验、疲劳度）和约束条件，生成合理的行程安排
3. 内容生成：为每一天生成详细行程，包含景点、餐饮、住宿、交通和注意事项
4. 风险提示：结合季节、节假日、人流、天气等因素给出提醒
5. 方案对比：在必要时提供多个可选方案供用户选择

【目标】
- 保证行程在时间、费用、体力上的可行性
- 提升体验：避免走回头路、避免景点过于集中或分散
- 提供可落地的预订建议和实时风险提示

请严格按照JSON格式输出行程规划。""",
            description="系统基础提示词",
            variables=[]
        )
        
        self._templates["intent_parser"] = PromptTemplate(
            name="intent_parser",
            template="""你是一个旅游参数提取引擎。请从用户的输入中提取以下参数，并以 JSON 格式输出。
如果用户未提及，请根据"江浙沪"默认常识进行推测或设为 null。

输出格式：
{
  "departure": "出发城市",
  "destinations": ["目的地城市列表"],
  "days": 出行天数(整数),
  "budget": 预算上限(数字，单位元),
  "budget_level": "预算等级(low/medium/high)",
  "pace": "行程节奏(relaxed/normal/tight)",
  "companions": "出行类型(solo/couple/family_with_kids/friends/elderly)",
  "interests": ["兴趣标签列表"],
  "constraints": ["约束条件列表"],
  "special_needs": ["特殊需求列表"],
  "age_group": "年龄段",
  "travel_mode": "交通方式偏好"
}

仅输出 JSON，不要包含其他解释。""",
            description="意图解析提示词",
            variables=[]
        )
        
        self._templates["itinerary_generation"] = PromptTemplate(
            name="itinerary_generation",
            template="""【用户需求 JSON】
{user_request_json}

【可用景点数据】
{attractions_data}

【交通信息】
{transport_data}

【业务规则约束】
{business_rules}

【核心任务】
根据上述用户需求和数据，生成一份"江浙沪旅游行程规划方案"。

【多目标优化要求】
目标：在满足用户约束的前提下，尽量：
a) 最小化总时间和总花费
b) 最大化景点满意度（按兴趣标签匹配和景点评分）
c) 最小化疲劳度（避免连续多天高强度行程）

【约束条件】
- 总天数：<= {days}天
- 每天游玩时长：建议不超过8小时（含景点间交通），节奏偏好为"{pace}"
- 预算：尽量控制在{budget}元以内，若接近上限请提前预警
- 交通：根据"{travel_mode}"选择合适交通方式，并计算交通时间
- 体力：考虑"{age_group}"和"{companion_type}"合理安排步行强度和休息时间
- 区域划分：优先减少跨城市奔波，优先安排同一区域的景点在同一天游玩

【输出格式要求】
请严格按照以下JSON结构输出：

{output_format}

【数据与真实性要求】
1. 请使用提供的真实景点数据
2. 严格遵守业务规则约束
3. 门票价格、餐厅人均请使用提供的数据
4. 经纬度坐标请使用提供的数据""",
            description="行程生成提示词",
            variables=["user_request_json", "attractions_data", "transport_data", "business_rules", 
                      "days", "pace", "budget", "travel_mode", "age_group", "companion_type", "output_format"]
        )
        
        self._templates["multi_plan_generation"] = PromptTemplate(
            name="multi_plan_generation",
            template="""【用户需求 JSON】
{user_request_json}

【可用景点数据】
{attractions_data}

【核心任务】
请为用户生成3个不同侧重点的行程方案，供用户对比选择：
- 方案A：省钱版（预算优先，性价比最高）
- 方案B：轻松版（体力优先，节奏舒适）
- 方案C：深度体验版（体验优先，文化深度）

【输出格式要求】
请严格按照以下JSON结构输出：

{output_format}

【数据与真实性要求】
1. 请使用真实存在的景点、餐厅
2. 门票价格、餐厅人均请尽量准确
3. 经纬度坐标请尽量准确""",
            description="多方案生成提示词",
            variables=["user_request_json", "attractions_data", "output_format"]
        )
        
        self._templates["content_enhancement"] = PromptTemplate(
            name="content_enhancement",
            template="""你是一位资深的江浙沪旅游规划师。请根据以下精确的时间安排，为每一天的行程添加生动的描述和实用建议。

要求：
1. 保持时间节点不变
2. 为每个景点增加游玩亮点和拍照建议
3. 添加餐饮推荐的具体菜品
4. 在每天结束时添加"今日总结"和"明日预告"
5. 语气要亲切、专业，像一位老朋友在介绍
6. 输出 JSON 格式，保持原有结构，只添加 content 和 tips 字段

用户原始需求：{user_input}

行程数据：
{itinerary_data}

请为这个行程添加内容润色，输出完整的 JSON。""",
            description="内容润色提示词",
            variables=["user_input", "itinerary_data"]
        )
        
        self._templates["chat_context"] = PromptTemplate(
            name="chat_context",
            template="""你是一位专业的旅游顾问，基于以下行程上下文回答用户的问题：

行程上下文：
{context}

请提供准确、实用的建议。如果问题与当前行程无关，请礼貌地引导用户回到行程相关话题。""",
            description="对话上下文提示词",
            variables=["context"]
        )
        
        self._templates["modification_parser"] = PromptTemplate(
            name="modification_parser",
            template="""你是一个行程修改助手。用户想要修改已有的行程，请理解用户的修改意图并输出修改指令。

输出格式：
{
  "action": "add/remove/replace/adjust_time",
  "target": "要操作的对象",
  "details": "具体修改内容"
}

支持的修改类型：
- add: 添加新景点或活动
- remove: 删除某个景点或活动
- replace: 替换某个景点
- adjust_time: 调整时间安排

原行程：{original_itinerary}

修改请求：{modification_request}""",
            description="修改意图解析提示词",
            variables=["original_itinerary", "modification_request"]
        )
        
        self._templates["recommendation"] = PromptTemplate(
            name="recommendation",
            template="""基于用户画像和偏好，推荐最适合的景点。

用户画像：
{user_profile}

候选景点：
{candidate_attractions}

推荐要求：
1. 根据用户兴趣标签匹配景点
2. 考虑用户预算偏好
3. 考虑用户出行类型（{companion_type}）
4. 输出最多 {limit} 个推荐景点

请以JSON格式输出推荐结果：
{{
  "recommendations": [
    {{
      "attraction_id": 1,
      "name": "景点名称",
      "match_score": 0.95,
      "match_reasons": ["匹配原因1", "匹配原因2"]
    }}
  ]
}}""",
            description="景点推荐提示词",
            variables=["user_profile", "candidate_attractions", "companion_type", "limit"]
        )
    
    def get_template(self, name: str) -> Optional[PromptTemplate]:
        """获取模板"""
        return self._templates.get(name)
    
    def add_template(self, template: PromptTemplate):
        """添加模板"""
        self._templates[template.name] = template
    
    def list_templates(self) -> List[str]:
        """列出所有模板名称"""
        return list(self._templates.keys())
    
    def render_template(self, name: str, **kwargs) -> str:
        """渲染指定模板"""
        template = self.get_template(name)
        if template is None:
            raise ValueError(f"模板不存在: {name}")
        return template.render(**kwargs)
    
    def load_from_file(self, file_path: str):
        """从文件加载模板"""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"模板文件不存在: {file_path}")
        
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for item in data:
            template = PromptTemplate(
                name=item["name"],
                template=item["template"],
                description=item.get("description", ""),
                variables=item.get("variables", [])
            )
            self.add_template(template)
    
    def save_to_file(self, file_path: str):
        """保存模板到文件"""
        data = [t.to_dict() for t in self._templates.values()]
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)


class PromptBuilder:
    """Prompt构建器，用于动态构建复杂的Prompt"""
    
    def __init__(self):
        self.manager = PromptTemplateManager()
        self.sections = []
    
    def add_system_prompt(self) -> "PromptBuilder":
        """添加系统提示词"""
        self.sections.append({
            "role": "system",
            "content": self.manager.render_template("system_base")
        })
        return self
    
    def add_user_request(self, request_data: Dict) -> "PromptBuilder":
        """添加用户请求数据"""
        request_json = json.dumps(request_data, ensure_ascii=False, indent=2)
        self.sections.append({
            "role": "user",
            "content": f"用户需求：\n{request_json}"
        })
        return self
    
    def add_attractions_data(self, attractions: List[Dict]) -> "PromptBuilder":
        """添加景点数据"""
        attractions_json = json.dumps(attractions, ensure_ascii=False, indent=2)
        self.sections.append({
            "role": "user",
            "content": f"可用景点数据：\n{attractions_json}"
        })
        return self
    
    def add_transport_data(self, transport: List[Dict]) -> "PromptBuilder":
        """添加交通数据"""
        transport_json = json.dumps(transport, ensure_ascii=False, indent=2)
        self.sections.append({
            "role": "user",
            "content": f"交通信息：\n{transport_json}"
        })
        return self
    
    def add_business_rules(self, rules: List[Dict]) -> "PromptBuilder":
        """添加业务规则"""
        rules_json = json.dumps(rules, ensure_ascii=False, indent=2)
        self.sections.append({
            "role": "user",
            "content": f"业务规则约束：\n{rules_json}"
        })
        return self
    
    def add_custom_section(self, role: str, content: str) -> "PromptBuilder":
        """添加自定义段落"""
        self.sections.append({
            "role": role,
            "content": content
        })
        return self
    
    def build(self) -> List[Dict]:
        """构建最终的Prompt消息列表"""
        return self.sections.copy()
    
    def build_single_prompt(self) -> str:
        """构建单个Prompt字符串"""
        return "\n\n".join([s["content"] for s in self.sections])


OUTPUT_FORMAT_SINGLE = """{
  "itinerary": {
    "title": "行程标题",
    "summary": "行程概述（包含总预算估算、主要城市、交通方式概要）",
    "total_budget_estimate": {
      "transport": 0,
      "tickets": 0,
      "dining": 0,
      "accommodation": 0,
      "total": 0
    },
    "daily_plans": [
      {
        "day": 1,
        "date": "日期",
        "theme": "当日主题",
        "city": "所在城市",
        "morning": {
          "time": "08:00-12:00",
          "activities": [
            {
              "type": "景点",
              "name": "名称",
              "description": "描述",
              "location": "详细地址",
              "latitude": 0.0,
              "longitude": 0.0,
              "duration_minutes": 120,
              "cost": 0,
              "tips": "温馨提示",
              "reservation_required": false,
              "reservation_note": "预约说明"
            }
          ]
        },
        "lunch": {
          "time": "12:00-13:30",
          "recommendation": {
            "name": "餐厅名称",
            "cuisine": "菜系",
            "average_cost": 80,
            "location": "地址"
          }
        },
        "afternoon": {
          "time": "14:00-17:00",
          "activities": []
        },
        "dinner": {
          "time": "18:00-20:00",
          "recommendation": {
            "name": "餐厅名称",
            "cuisine": "菜系",
            "average_cost": 100
          }
        },
        "accommodation": {
          "recommended_area": "推荐住宿区域",
          "hotel_type": "经济型/舒适型/高档",
          "price_range": "200-400元/晚"
        },
        "daily_budget": {
          "transport": 0,
          "tickets": 0,
          "dining": 0,
          "total": 0
        }
      }
    ],
    "risk_alerts": {
      "weather": ["天气相关提醒"],
      "reservation": ["需要提前预约的景点/餐厅"],
      "holiday_notes": ["节假日注意事项"]
    }
  }
}"""

OUTPUT_FORMAT_MULTI = """{
  "plans_comparison": {
    "summary_table": [
      {
        "plan": "方案A：省钱版",
        "total_cost": 0,
        "daily_intensity": "紧凑/适中/轻松",
        "highlights": ["亮点1", "亮点2"],
        "best_for": "适合预算有限、想多看景点的游客"
      }
    ]
  },
  "plans": {
    "plan_a": {
      "title": "省钱版行程",
      "focus": "预算优先",
      "total_budget_estimate": {},
      "daily_plans": []
    },
    "plan_b": {
      "title": "轻松版行程",
      "focus": "体力优先",
      "total_budget_estimate": {},
      "daily_plans": []
    },
    "plan_c": {
      "title": "深度体验版行程",
      "focus": "体验优先",
      "total_budget_estimate": {},
      "daily_plans": []
    }
  },
  "recommendation": {
    "default_choice": "方案B",
    "reason": "根据您的需求分析，推荐方案B因为..."
  }
}"""


def get_output_format(format_type: str) -> str:
    """获取输出格式模板"""
    if format_type == "single":
        return OUTPUT_FORMAT_SINGLE
    elif format_type == "multi":
        return OUTPUT_FORMAT_MULTI
    else:
        raise ValueError(f"未知的输出格式类型: {format_type}")


prompt_manager = PromptTemplateManager()
