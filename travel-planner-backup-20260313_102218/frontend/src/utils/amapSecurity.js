/**
 * 高德地图安全配置模块
 * 
 * 重要说明：
 * 高德地图 API 2.0 强制要求配置安全密钥（securityJsCode）
 * 必须在地图加载前注入 window._AMapSecurityConfig
 * 否则会报错：Invalid Security Code
 */

/**
 * 初始化高德地图安全配置
 * 必须在调用 AMapLoader.load() 之前执行
 */
export const initAmapSecurity = () => {
  const securityCode = process.env.REACT_APP_AMAP_SECURITY_CODE;
  
  if (!securityCode) {
    console.warn('警告：未配置高德地图安全密钥（REACT_APP_AMAP_SECURITY_CODE）');
    return;
  }

  // 在 window 对象上注入安全配置
  // 这是高德地图 API 2.0 的强制要求
  window._AMapSecurityConfig = {
    securityJsCode: securityCode
  };

  console.log('高德地图安全配置初始化完成');
};

/**
 * 获取高德地图 API Key
 */
export const getAmapKey = () => {
  const key = process.env.REACT_APP_AMAP_KEY;
  if (!key) {
    throw new Error('未配置高德地图 API Key（REACT_APP_AMAP_KEY）');
  }
  return key;
};

/**
 * 验证高德地图配置是否完整
 */
export const validateAmapConfig = () => {
  const key = process.env.REACT_APP_AMAP_KEY;
  const securityCode = process.env.REACT_APP_AMAP_SECURITY_CODE;

  if (!key) {
    return {
      valid: false,
      message: '未配置 REACT_APP_AMAP_KEY 环境变量'
    };
  }

  if (!securityCode) {
    return {
      valid: false,
      message: '未配置 REACT_APP_AMAP_SECURITY_CODE 环境变量'
    };
  }

  return {
    valid: true,
    message: '高德地图配置完整'
  };
};
