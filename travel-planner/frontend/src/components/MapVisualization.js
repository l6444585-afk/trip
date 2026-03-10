/**
 * ============================================
 * 代码保护声明 | Code Protection Notice
 * ============================================
 * 本组件为受保护的核心资产，未经授权不得修改、复制或分发。
 * This component is a protected core asset. Unauthorized modification,
 * copying, or distribution is prohibited.
 * 
 * 版权所有 © 2024 Trae AI
 * Copyright © 2024 Trae AI. All rights reserved.
 * ============================================
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, Button, message, Spin, Select, Alert, Space, Tooltip, Badge, Tag, Switch } from 'antd';
import { EnvironmentOutlined, ZoomInOutlined, ZoomOutOutlined, ReloadOutlined, ApartmentOutlined } from '@ant-design/icons';

import { initAmapSecurity, getAmapKey, validateAmapConfig } from '../utils/amapSecurity';

initAmapSecurity();

const MapVisualization = ({ itinerary }) => {
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [mapProvider, setMapProvider] = useState('amap');
  const [mapInstance, setMapInstance] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showRoute, setShowRoute] = useState(true);

  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  const groupedSchedules = useMemo(() => {
    const grouped = {};
    itinerary?.schedules?.forEach(schedule => {
      if (!grouped[schedule.day]) {
        grouped[schedule.day] = [];
      }
      grouped[schedule.day].push(schedule);
    });
    return grouped;
  }, [itinerary]);

  const days = useMemo(() => {
    return Object.keys(groupedSchedules).sort((a, b) => a - b);
  }, [groupedSchedules]);

  const configValidation = useMemo(() => validateAmapConfig(), []);

  const loadAmapScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.AMap) {
        resolve(window.AMap);
        return;
      }

      const key = getAmapKey();
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Scale,AMap.ToolBar,AMap.ControlBar,AMap.Geocoder,AMap.Geolocation`;
      
      script.onload = () => {
        console.log('高德地图 API 加载成功');
        resolve(window.AMap);
      };
      
      script.onerror = (error) => {
        console.error('高德地图加载失败:', error);
        reject(error);
      };
      
      document.head.appendChild(script);
    });
  }, []);

  const initializeMap = useCallback(async () => {
    try {
      if (!configValidation.valid) {
        setMapError(configValidation.message);
        setLoading(false);
        return;
      }

      const AMap = await loadAmapScript();

      if (!mapRef.current) {
        console.error('地图容器未找到');
        return;
      }

      const map = new AMap.Map(mapRef.current, {
        zoom: 12,
        center: [121.473701, 31.230416],
        viewMode: '2D',
        pitch: 0,
        rotation: 0,
        showLabel: true,
        showBuildingBlock: true,
        showIndoorMap: false,
        resizeEnable: true,
        dragEnable: true,
        keyboardEnable: true,
        doubleClickZoom: true,
        scrollWheel: true,
        mapStyle: 'amap://styles/whitesmoke',
        features: ['bg', 'road', 'building', 'point']
      });

      map.addControl(new AMap.Scale());
      map.addControl(new AMap.ToolBar({
        position: {
          top: '110px',
          right: '40px'
        }
      }));

      map.addControl(new AMap.ControlBar({
        position: {
          top: '110px',
          right: '10px'
        },
        showZoomBar: true,
        showControlButton: true,
        zoomBar: {
          position: 'right'
        }
      }));

      map.on('complete', () => {
        console.log('地图初始化完成');
        setMapLoaded(true);
        setLoading(false);
        setMapError(null);
      });

      map.on('click', (e) => {
        console.log('地图点击位置:', e.lnglat);
      });

      setMapInstance(map);

    } catch (error) {
      console.error('地图初始化失败:', error);
      setMapError('地图初始化失败：' + (error.message || '未知错误'));
      message.error('地图初始化失败：' + (error.message || '未知错误'));
      setLoading(false);
    }
  }, [configValidation, loadAmapScript]);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];
  }, []);

  const createMarker = useCallback((schedule, index, AMap) => {
    const periodMap = {
      morning: '上午',
      afternoon: '下午',
      evening: '晚上'
    };
    const period = periodMap[schedule.period];
    const colorMap = {
      morning: '#52c41a',
      afternoon: '#1890ff',
      evening: '#722ed1'
    };

    const marker = new AMap.Marker({
      position: [schedule.longitude || 121.473701, schedule.latitude || 31.230416],
      title: schedule.activity,
      content: `
        <div style="
          background: ${colorMap[schedule.period]};
          color: #fff;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.3s ease;
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          ${index + 1}. ${period}
        </div>
      `,
      offset: new AMap.Pixel(-12, -12),
      zIndex: 100 + index
    });

    marker.on('click', () => {
      setSelectedStation({
        ...schedule,
        period,
        color: colorMap[schedule.period],
        index: index + 1
      });
      mapInstance?.setFitView();
    });

    marker.on('mouseover', () => {
      marker.setAnimation('AMAP_ANIMATION_BOUNCE');
    });

    marker.on('mouseout', () => {
      marker.setAnimation('AMAP_ANIMATION_NONE');
    });

    return marker;
  }, [mapInstance]);

  const createPolyline = useCallback((schedules, AMap) => {
    if (schedules.length < 2) {
      return null;
    }

    const path = schedules.map(s => [
      s.longitude || 121.473701,
      s.latitude || 31.230416
    ]);

    const line = new AMap.Polyline({
      path: path,
      strokeColor: '#1890ff',
      strokeWeight: 4,
      strokeOpacity: 0.8,
      strokeStyle: 'solid',
      lineJoin: 'round',
      lineCap: 'round',
      showDir: true,
      zIndex: 50
    });

    return line;
  }, []);

  const updateMapMarkers = useCallback(async () => {
    if (!mapInstance || !selectedDay || !groupedSchedules[selectedDay]) {
      clearMarkers();
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }

    const daySchedules = groupedSchedules[selectedDay];
    const AMap = window.AMap;

    clearMarkers();

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (showRoute) {
      const route = createPolyline(daySchedules, AMap);
      if (route) {
        route.setMap(mapInstance);
        polylineRef.current = route;
      }
    }

    if (showMarkers) {
      daySchedules.map((schedule, index) => {
        const marker = createMarker(schedule, index, AMap);
        marker.setMap(mapInstance);
        markersRef.current.push(marker);
        return marker;
      });
    }

    if (daySchedules.length > 0) {
      const bounds = new AMap.Bounds();
      daySchedules.forEach(schedule => {
        const lng = schedule.longitude || 121.473701;
        const lat = schedule.latitude || 31.230416;
        bounds.extend([lng, lat]);
      });
      mapInstance.setFitView([bounds]);
    }
  }, [mapInstance, selectedDay, groupedSchedules, showMarkers, showRoute, clearMarkers, createMarker, createPolyline]);

  const handleZoomIn = useCallback(() => {
    if (mapInstance) {
      mapInstance.zoomIn();
    }
  }, [mapInstance]);

  const handleZoomOut = useCallback(() => {
    if (mapInstance) {
      mapInstance.zoomOut();
    }
  }, [mapInstance]);

  const handleReset = useCallback(() => {
    if (mapInstance) {
      mapInstance.setZoomAndCenter(12, [121.473701, 31.230416]);
    }
    setSelectedStation(null);
  }, [mapInstance]);

  const handleDayChange = useCallback((day) => {
    setSelectedDay(day);
    setSelectedStation(null);
  }, []);

  const handleProviderChange = useCallback((provider) => {
    setMapProvider(provider);
    if (provider === 'amap' && !mapLoaded) {
      initializeMap();
    }
  }, [mapLoaded, initializeMap]);

  useEffect(() => {
    if (mapProvider === 'amap' && !mapLoaded) {
      initializeMap();
    }
  }, [mapProvider, mapLoaded, initializeMap]);

  useEffect(() => {
    if (mapLoaded && mapProvider === 'amap') {
      updateMapMarkers();
    }
  }, [mapLoaded, mapProvider, selectedDay, showMarkers, showRoute, updateMapMarkers]);

  useEffect(() => {
    if (days.length > 0 && !selectedDay) {
      setSelectedDay(parseInt(days[0]));
    }
  }, [days, selectedDay]);

  const periodMap = {
    morning: '上午',
    afternoon: '下午',
    evening: '晚上'
  };

  const colorMap = {
    morning: '#52c41a',
    afternoon: '#1890ff',
    evening: '#722ed1'
  };

  const bgMap = {
    morning: '#f6ffed',
    afternoon: '#e6f7ff',
    evening: '#f9f0ff'
  };

  if (mapProvider === 'static') {
    return (
      <Card
        title={
          <Space>
            <EnvironmentOutlined style={{ color: '#1890ff' }} />
            <span>静态地图模式</span>
          </Space>
        }
        extra={
          <Space size="small">
            <Select
              defaultValue="static"
              style={{ width: 150 }}
              onChange={handleProviderChange}
            >
              <Select.Option value="static">静态地图</Select.Option>
              <Select.Option value="amap">高德地图</Select.Option>
            </Select>
          </Space>
        }
        style={{
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
        }}
      >
        <div style={{ textAlign: 'center', padding: 100, color: '#999' }}>
          <ApartmentOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div style={{ fontSize: 16, marginBottom: 8 }}>静态地图模式</div>
          <div style={{ fontSize: 14 }}>请切换到高德地图以获得更好的体验</div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <EnvironmentOutlined style={{ color: '#1890ff' }} />
          <span>行程地图可视化</span>
        </Space>
      }
      extra={
        <Space size="small">
          <Select
            defaultValue="amap"
            style={{ width: 150 }}
            onChange={handleProviderChange}
            value={mapProvider}
          >
            <Select.Option value="static">静态地图</Select.Option>
            <Select.Option value="amap">高德地图</Select.Option>
          </Select>
          <Tooltip title="显示标记点">
            <Switch
              checked={showMarkers}
              onChange={setShowMarkers}
              checkedChildren="标记"
              unCheckedChildren="标记"
            />
          </Tooltip>
          <Tooltip title="显示路线">
            <Switch
              checked={showRoute}
              onChange={setShowRoute}
              checkedChildren="路线"
              unCheckedChildren="路线"
            />
          </Tooltip>
          <Tooltip title="放大">
            <Button
              size="small"
              icon={<ZoomInOutlined />}
              onClick={handleZoomIn}
            />
          </Tooltip>
          <Tooltip title="缩小">
            <Button
              size="small"
              icon={<ZoomOutOutlined />}
              onClick={handleZoomOut}
            />
          </Tooltip>
          <Tooltip title="重置视图">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={handleReset}
            />
          </Tooltip>
        </Space>
      }
      style={{
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden'
      }}
    >
      {mapError && (
        <Alert
          message="地图加载错误"
          description={mapError}
          type="error"
          showIcon
          action={
            <Button type="primary" size="small" onClick={initializeMap}>
              重新加载
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="选择查看的日期"
          style={{ width: 200 }}
          onChange={handleDayChange}
          value={selectedDay}
          size="large"
        >
          {days.map(day => (
            <Select.Option key={day} value={day}>
              第 {day} 天
            </Select.Option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" tip="正在加载地图..." />
        </div>
      ) : (
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: 600,
            borderRadius: 12,
            overflow: 'hidden',
            background: '#f5f5f5'
          }}
        />
      )}

      {selectedStation && (
        <Card
          style={{
            marginTop: 16,
            borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            border: '2px solid #1890ff'
          }}
          styles={{ body: { padding: '16px 24px' } }}
        >
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#1890ff' }}>
                {selectedStation.index}. {selectedStation.activity}
              </h3>
              <Button
                size="small"
                onClick={() => setSelectedStation(null)}
              >
                关闭
              </Button>
            </div>
            <div>
              <Tag color={selectedStation.color}>{selectedStation.period}</Tag>
            </div>
            {selectedStation.location && (
              <div style={{ color: '#666' }}>
                📍 {selectedStation.location}
              </div>
            )}
            {selectedStation.notes && (
              <div style={{ 
                padding: 12, 
                background: '#f0f9ff', 
                borderRadius: 8,
                border: '1px solid #bae7ff'
              }}>
                <div style={{ fontSize: 12, color: '#666' }}>
                  💡 {selectedStation.notes}
                </div>
              </div>
            )}
          </Space>
        </Card>
      )}

      {selectedDay && groupedSchedules[selectedDay] && (
        <Card
          title={
            <Space>
              <Badge count={groupedSchedules[selectedDay].length} showZero>
                <span style={{ fontSize: 16, fontWeight: 600 }}>
                  第 {selectedDay} 天行程详情
                </span>
              </Badge>
            </Space>
          }
          style={{
            marginTop: 16,
            borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
          }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {groupedSchedules[selectedDay].map((schedule, index) => {
              const period = periodMap[schedule.period];

              return (
                <div
                  key={index}
                  style={{
                    padding: 16,
                    background: bgMap[schedule.period],
                    borderRadius: 12,
                    border: `2px solid ${colorMap[schedule.period]}33`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setSelectedStation({
                      ...schedule,
                      period,
                      color: colorMap[schedule.period],
                      index: index + 1
                    });
                    if (mapInstance) {
                      mapInstance.setCenter([
                        schedule.longitude || 121.473701,
                        schedule.latitude || 31.230416
                      ]);
                      mapInstance.setZoom(15);
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: colorMap[schedule.period],
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}
                    >
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <Tag color={colorMap[schedule.period]}>{period}</Tag>
                          <span style={{ fontSize: 16, fontWeight: 600, color: '#2C3E50', marginLeft: 8 }}>
                            {schedule.activity}
                          </span>
                        </div>
                      </div>
                      <div style={{ color: '#666', marginBottom: 8 }}>
                        📍 {schedule.location}
                      </div>
                      {schedule.notes && (
                        <div style={{ 
                          padding: 8, 
                          background: 'rgba(255,255,255,0.6)', 
                          borderRadius: 6,
                          fontSize: 13,
                          color: '#666'
                        }}>
                          💡 {schedule.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </Space>
        </Card>
      )}
    </Card>
  );
};

export default MapVisualization;
