/**
 * ============================================
 * 高德地图核心容器组件
 * ============================================
 * 
 * 功能特性：
 * 1. 安全密钥配置 - 在地图加载前注入 window._AMapSecurityConfig
 * 2. 地图基础初始化 - 缩放级别、中心点设为江浙沪中心
 * 3. 支持插槽 - 允许子组件覆盖在地图之上
 * 4. 暴露地图实例 - 给父组件使用
 * 5. 驾车路线规划 - 支持多点路线规划
 * 
 * 使用方法：
 * <AmapContainer 
 *   center={[120.15, 30.24]} 
 *   zoom={12}
 *   onMapReady={(map) => console.log(map)}
 * >
 *   <div>覆盖层内容</div>
 * </AmapContainer>
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo
} from 'react';
import { Spin, message, Button, Space, Tooltip, Alert } from 'antd';
import {
  EnvironmentOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  AimOutlined,
  ReloadOutlined,
  BranchesOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from '@ant-design/icons';
import AMapLoader from '@amap/amap-jsapi-loader';

import { initAmapSecurity, getAmapKey, validateAmapConfig } from '../utils/amapSecurity';
import { JIANGNAN_ROUTE_COLORS } from '../data/jiangnanLocations';
import './AmapContainer.css';

// 在模块加载时立即初始化安全配置
// 这是高德地图 API 2.0 的强制要求，必须在 AMapLoader.load() 之前执行
initAmapSecurity();

const AmapContainer = forwardRef((props, ref) => {
  const {
    center = [120.15, 30.24],
    zoom = 10,
    pitch = 0,
    rotation = 0,
    mapStyle = 'amap://styles/whitesmoke',
    children,
    onMapReady,
    onMapClick,
    showControls = true,
    showRoute = false,
    routeLocations = [],
    className = '',
    style = {}
  } = props;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const AMapRef = useRef(null);
  const markersRef = useRef([]);
  const routeLayerRef = useRef(null);
  const drivingRef = useRef(null);

  const configValidation = useMemo(() => validateAmapConfig(), []);

  const initializeMap = useCallback(async () => {
    if (!configValidation.valid) {
      setError(configValidation.message);
      setLoading(false);
      return;
    }

    if (!mapRef.current) {
      setError('地图容器未找到');
      setLoading(false);
      return;
    }

    try {
      const key = getAmapKey();
      console.log('开始加载高德地图 API, Key:', key ? '已配置' : '未配置');

      AMapLoader.load({
        key: key,
        version: '2.0',
        plugins: [
          'AMap.Scale',
          'AMap.ToolBar',
          'AMap.ControlBar',
          'AMap.Geolocation',
          'AMap.Geocoder',
          'AMap.Driving',
          'AMap.Walking',
          'AMap.Transfer',
          'AMap.AdvancedInfoWindow',
          'AMap.MarkerCluster'
        ]
      })
        .then((AMap) => {
          console.log('高德地图 API 加载成功');
          AMapRef.current = AMap;

          console.log('开始创建地图实例, 容器:', mapRef.current);
          const map = new AMap.Map(mapRef.current, {
            zoom: zoom,
            center: center,
            pitch: pitch,
            rotation: rotation,
            viewMode: '2D',
            showLabel: true,
            showBuildingBlock: true,
            showIndoorMap: false,
            resizeEnable: true,
            dragEnable: true,
            keyboardEnable: true,
            doubleClickZoom: true,
            scrollWheel: true,
            mapStyle: mapStyle,
            features: ['bg', 'road', 'building', 'point']
          });

          map.addControl(new AMap.Scale({
            position: 'LB'
          }));

          map.addControl(new AMap.ToolBar({
            position: 'RT',
            liteStyle: true
          }));

          map.addControl(new AMap.ControlBar({
            position: 'RT',
            showZoomBar: true,
            showControlButton: true
          }));

          map.on('complete', () => {
            console.log('高德地图初始化完成');
            setLoading(false);
            setError(null);
            mapInstanceRef.current = map;

            if (onMapReady) {
              onMapReady(map, AMap);
            }
          });

          map.on('click', (e) => {
            const lnglat = {
              lng: e.lnglat.getLng(),
              lat: e.lnglat.getLat()
            };
            console.log('地图点击位置:', lnglat);
            if (onMapClick) {
              onMapClick(lnglat);
            }
          });

          map.on('error', (e) => {
            console.error('地图错误:', e);
            setError('地图加载错误：' + (e.message || '未知错误'));
          });

        })
        .catch((err) => {
          console.error('高德地图加载失败:', err);
          const errorMsg = err?.message || err?.toString() || '请检查网络连接或API Key配置';
          setError('地图加载失败：' + errorMsg);
          setLoading(false);
        });

    } catch (err) {
      console.error('地图初始化异常:', err);
      const errorMsg = err?.message || err?.toString() || '未知错误';
      setError('地图初始化异常：' + errorMsg);
      setLoading(false);
    }
  }, [center, zoom, pitch, rotation, mapStyle, configValidation, onMapReady, onMapClick]);

  const addMarker = useCallback((options) => {
    const AMap = AMapRef.current;
    const map = mapInstanceRef.current;

    if (!AMap || !map) {
      console.warn('地图未初始化，无法添加标记');
      return null;
    }

    const marker = new AMap.Marker({
      position: options.position,
      title: options.title || '',
      content: options.content,
      offset: new AMap.Pixel(-13, -30)
    });

    if (options.onClick) {
      marker.on('click', options.onClick);
    }

    marker.setMap(map);
    markersRef.current.push(marker);

    return marker;
  }, []);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];
  }, []);

  const drawRoute = useCallback(async (locations) => {
    const AMap = AMapRef.current;
    const map = mapInstanceRef.current;

    if (!AMap || !map) {
      message.warning('地图未初始化');
      return;
    }

    if (locations.length < 2) {
      message.warning('至少需要两个地点才能规划路线');
      return;
    }

    if (drivingRef.current) {
      drivingRef.current.clear();
    }

    const waypoints = locations.map(loc => new AMap.LngLat(loc.longitude, loc.latitude));

    const driving = new AMap.Driving({
      map: map,
      policy: AMap.DrivingPolicy.LEAST_TIME,
      hideMarkers: false,
      autoFitView: true,
      showTraffic: true,
      isOutline: true,
      outlineColor: '#ffeeff',
      strokeColor: '#1890ff',
      strokeOpacity: 0.9,
      strokeWeight: 5,
      strokeStyle: 'solid'
    });

    drivingRef.current = driving;

    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const wayPointsMiddle = waypoints.slice(1, -1);

    return new Promise((resolve, reject) => {
      driving.search(
        origin,
        destination,
        { waypoints: wayPointsMiddle },
        (status, result) => {
          if (status === 'complete') {
            console.log('路线规划成功:', result);

            let totalDistance = 0;
            let totalDuration = 0;

            if (result.routes && result.routes.length > 0) {
              const route = result.routes[0];
              totalDistance = route.distance;
              totalDuration = route.time;

              route.steps.forEach((step, index) => {
                const color = JIANGNAN_ROUTE_COLORS[index % JIANGNAN_ROUTE_COLORS.length];
                
                if (step.path && step.path.length > 0) {
                  const polyline = new AMap.Polyline({
                    path: step.path,
                    strokeColor: color,
                    strokeWeight: 6,
                    strokeOpacity: 0.8,
                    lineJoin: 'round',
                    lineCap: 'round',
                    showDir: true,
                    zIndex: 50
                  });
                  polyline.setMap(map);
                }
              });
            }

            setRouteInfo({
              distance: totalDistance,
              duration: totalDuration,
              policy: '最短时间'
            });

            message.success('路线规划成功');
            resolve();
          } else {
            console.error('路线规划失败:', result);
            message.error('路线规划失败：' + (result.message || '未知错误'));
            reject(new Error('路线规划失败'));
          }
        }
      );
    });
  }, []);

  const clearRoute = useCallback(() => {
    if (drivingRef.current) {
      drivingRef.current.clear();
      drivingRef.current = null;
    }
    if (routeLayerRef.current) {
      routeLayerRef.current.setMap(null);
      routeLayerRef.current = null;
    }
    setRouteInfo(null);
  }, []);

  const setCenter = useCallback((lnglat) => {
    const map = mapInstanceRef.current;
    if (map) {
      map.setCenter(lnglat);
    }
  }, []);

  const setZoom = useCallback((newZoom) => {
    const map = mapInstanceRef.current;
    if (map) {
      map.setZoom(newZoom);
    }
  }, []);

  const fitView = useCallback((bounds) => {
    const map = mapInstanceRef.current;
    if (map) {
      if (bounds) {
        map.setBounds(bounds);
      } else {
        map.setFitView();
      }
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    const map = mapInstanceRef.current;
    if (map) {
      map.zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    const map = mapInstanceRef.current;
    if (map) {
      map.zoomOut();
    }
  }, []);

  const handleReset = useCallback(() => {
    const map = mapInstanceRef.current;
    if (map) {
      map.setZoomAndCenter(zoom, center);
    }
    clearMarkers();
    clearRoute();
  }, [zoom, center, clearMarkers, clearRoute]);

  const handleLocate = useCallback(() => {
    const AMap = AMapRef.current;
    const map = mapInstanceRef.current;

    if (!AMap || !map) return;

    const geolocation = new AMap.Geolocation({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      convert: true,
      showButton: false,
      showMarker: true,
      showCircle: true,
      panToLocation: true,
      zoomToAccuracy: true
    });

    geolocation.getCurrentPosition((status, result) => {
      if (status === 'complete') {
        console.log('定位成功:', result);
        message.success('定位成功：' + result.formattedAddress);
      } else {
        console.error('定位失败:', result);
        message.error('定位失败：' + (result.message || '请检查定位权限'));
      }
    });
  }, []);

  const handleFullscreen = useCallback(() => {
    const container = mapRef.current?.parentElement;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  useImperativeHandle(ref, () => ({
    get map() {
      return mapInstanceRef.current;
    },
    get AMap() {
      return AMapRef.current;
    },
    getMap: () => mapInstanceRef.current,
    getAMap: () => AMapRef.current,
    setCenter,
    setZoom,
    addMarker,
    clearMarkers,
    drawRoute,
    clearRoute,
    fitView
  }), [setCenter, setZoom, addMarker, clearMarkers, drawRoute, clearRoute, fitView]);

  useEffect(() => {
    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
      markersRef.current = [];
      drivingRef.current = null;
    };
  }, [initializeMap]);

  useEffect(() => {
    if (showRoute && routeLocations.length >= 2 && mapInstanceRef.current) {
      drawRoute(routeLocations);
    }
  }, [showRoute, routeLocations, drawRoute]);

  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return (meters / 1000).toFixed(1) + ' 公里';
    }
    return meters + ' 米';
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} 小时 ${minutes} 分钟`;
    }
    return `${minutes} 分钟`;
  };

  return (
    <div 
      className={`amap-container-wrapper ${className}`}
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%',
        minHeight: '500px',
        ...style 
      }}
    >
      {error && (
        <Alert
          message="地图加载错误"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" type="primary" onClick={initializeMap}>
              重新加载
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {loading && (
        <div className="amap-loading-overlay">
          <Spin size="large">
            <div style={{ padding: 50 }}>正在加载地图...</div>
          </Spin>
        </div>
      )}

      <div
        ref={mapRef}
        className="amap-map-container"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '500px',
          borderRadius: 12,
          overflow: 'hidden'
        }}
      />

      {showControls && !loading && !error && (
        <div className="amap-controls-overlay">
          <Space direction="vertical" size="small">
            <Tooltip title="放大">
              <Button
                type="primary"
                ghost
                icon={<ZoomInOutlined />}
                onClick={handleZoomIn}
              />
            </Tooltip>
            <Tooltip title="缩小">
              <Button
                type="primary"
                ghost
                icon={<ZoomOutOutlined />}
                onClick={handleZoomOut}
              />
            </Tooltip>
            <Tooltip title="定位当前位置">
              <Button
                type="primary"
                ghost
                icon={<AimOutlined />}
                onClick={handleLocate}
              />
            </Tooltip>
            <Tooltip title="重置视图">
              <Button
                type="primary"
                ghost
                icon={<ReloadOutlined />}
                onClick={handleReset}
              />
            </Tooltip>
            <Tooltip title={isFullscreen ? "退出全屏" : "全屏显示"}>
              <Button
                type="primary"
                ghost
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={handleFullscreen}
              />
            </Tooltip>
          </Space>
        </div>
      )}

      {routeInfo && (
        <div className="amap-route-info-overlay">
          <div className="route-info-card">
            <div className="route-info-header">
              <BranchesOutlined style={{ marginRight: 8 }} />
              <span>路线规划结果</span>
            </div>
            <div className="route-info-content">
              <div className="route-info-item">
                <span className="label">总距离：</span>
                <span className="value">{formatDistance(routeInfo.distance)}</span>
              </div>
              <div className="route-info-item">
                <span className="label">预计时间：</span>
                <span className="value">{formatDuration(routeInfo.duration)}</span>
              </div>
              <div className="route-info-item">
                <span className="label">规划策略：</span>
                <span className="value">{routeInfo.policy}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {children && (
        <div className="amap-children-overlay">
          {children}
        </div>
      )}
    </div>
  );
});

AmapContainer.displayName = 'AmapContainer';

export default AmapContainer;
