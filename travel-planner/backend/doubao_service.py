from typing import Dict, List, Optional
from logger_config import logger
from cache_manager import cache_manager, cached
import httpx
import os

class DoubaoImageService:
    def __init__(self):
        self.api_key = os.getenv("DOUBAO_API_KEY")
        self.base_url = "https://ark.cn-beijing.volces.com/api/v3"
        self.timeout = 30
        self.max_retries = 3
    
    async def generate_image(
        self,
        prompt: str,
        style: str = "realistic",
        size: str = "1024x1024"
    ) -> Dict:
        cache_key = cache_manager.generate_key("image", prompt, style, size)
        cached_result = cache_manager.get(cache_key)
        
        if cached_result:
            logger.info(f"Using cached image for prompt: {prompt[:50]}...")
            return cached_result
        
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Generating image, attempt {attempt + 1}/{self.max_retries}")
                
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(
                        f"{self.base_url}/images/generations",
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "doubao-v1",
                            "prompt": prompt,
                            "n": 1,
                            "size": size,
                            "style": style
                        }
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        image_url = result.get("data", [{}])[0].get("url")
                        
                        if image_url:
                            result_dict = {
                                "image_url": image_url,
                                "prompt": prompt,
                                "style": style,
                                "size": size
                            }
                            cache_manager.set(cache_key, result_dict, ttl=86400)
                            
                            logger.info("Image generated successfully")
                            return result_dict
                    
                    logger.error(f"Image generation failed: {response.text}")
                    
            except Exception as e:
                logger.error(f"Image generation error on attempt {attempt + 1}: {str(e)}")
                if attempt == self.max_retries - 1:
                    raise Exception(f"豆包AI图像生成失败: {str(e)}")
        
        raise Exception("图像生成失败：超过最大重试次数")
    
    async def generate_itinerary_cover(
        self,
        destination: str,
        theme: str,
        style: str = "ink"
    ) -> Dict:
        style_prompts = {
            "ink": f"中国水墨画风格，{destination}风景，{theme}主题，意境深远，留白艺术，传统美学",
            "realistic": f"写实摄影风格，{destination}美景，{theme}主题，高清摄影，自然光线，专业构图",
            "artistic": f"艺术插画风格，{destination}风光，{theme}主题，色彩鲜艳，现代感强，设计精美",
            "vintage": f"复古胶片风格，{destination}怀旧，{theme}主题，温暖色调，怀旧氛围，文艺气息"
        }
        
        prompt = style_prompts.get(style, style_prompts["ink"])
        
        return await self.generate_image(
            prompt=prompt,
            style=style,
            size="1024x1024"
        )
    
    async def generate_attraction_image(
        self,
        attraction_name: str,
        location: str,
        category: str,
        style: str = "realistic"
    ) -> Dict:
        prompt = f"{attraction_name}位于{location}，{category}类别，江浙沪地区特色景点"
        
        return await self.generate_image(
            prompt=prompt,
            style=style,
            size="1024x1024"
        )
    
    def validate_api_key(self) -> bool:
        return bool(self.api_key and self.api_key != "your_doubao_api_key_here")

doubao_service = DoubaoImageService()
