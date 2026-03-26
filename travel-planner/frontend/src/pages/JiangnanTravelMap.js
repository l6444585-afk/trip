/**
 * 江浙沪旅游地图规划页面
 * 功能：景点浏览、城市筛选、分类筛选、搜索、多点路线规划、自定义标记、localStorage 持久化
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { message } from 'antd';
import AmapContainer from '../components/AmapContainer';
import { JIANGNAN_LOCATIONS } from '../data/jiangnanLocations';
import './JiangnanTravelMap.css';

/* ── 常量 ── */
const MAP_CENTER = [120.5, 30.8];
const MAP_ZOOM = 8;

const CITY_COLORS = {
  '杭州': '#22c55e', '苏州': '#6366f1', '上海': '#f59e0b',
  '南京': '#ef4444', '无锡': '#ec4899', '宁波': '#14b8a6',
  '嘉兴': '#f97316', '绍兴': '#8b5cf6', '湖州': '#06b6d4',
  '常州': '#84cc16', '南通': '#a855f7', '扬州': '#0ea5e9',
  '温州': '#f43f5e', '金华': '#d946ef', '台州': '#0284c7',
  '舟山': '#059669',
};
const CITY_TABS = [
  '全部', '上海', '杭州', '苏州', '南京', '无锡', '扬州',
  '宁波', '嘉兴', '绍兴', '湖州', '舟山', '金华', '常州',
  '镇江', '温州', '南通', '台州',
];
const CATEGORIES = ['全部', '自然景观', '人文历史', '主题乐园', '都市休闲'];
const STORAGE_KEY = 'mp-route-ids';
const PHOTO_CACHE_KEY = 'mp-spot-photos';
const getCityColor = (city) => CITY_COLORS[city] || '#6b7280';

const loadPhotoCache = () => {
  try { return JSON.parse(localStorage.getItem(PHOTO_CACHE_KEY) || '{}'); }
  catch { return {}; }
};
const savePhotoCache = (cache) => {
  try { localStorage.setItem(PHOTO_CACHE_KEY, JSON.stringify(cache)); }
  catch { /* ignore */ }
};

const CITY_IMAGES = {
  '上海': '/images/cities/shanghai.jpg',
  '杭州': '/images/cities/hangzhou.jpg',
  '苏州': '/images/cities/suzhou.jpg',
  '南京': '/images/cities/nanjing.jpg',
  '无锡': '/images/cities/wuxi.jpg',
  '嘉兴': '/images/cities/jiaxing.jpg',
  '宁波': '/images/cities/ningbo.jpg',
  '舟山': '/images/cities/zhoushan.jpg',
  '扬州': '/images/cities/nanjing.jpg',
  '绍兴': '/images/cities/hangzhou.jpg',
  '湖州': '/images/cities/hangzhou.jpg',
  '金华': '/images/cities/hangzhou.jpg',
  '常州': '/images/cities/wuxi.jpg',
  '镇江': '/images/cities/nanjing.jpg',
  '温州': '/images/cities/ningbo.jpg',
  '南通': '/images/cities/shanghai.jpg',
  '台州': '/images/cities/ningbo.jpg',
};
const getSpotImage = (spot) => spot.image_url || CITY_IMAGES[spot.city] || null;

/* ── 纯工具函数 ── */
const fmtDist = (m) => {
  if (!m) return '--';
  return m >= 1000 ? `${(m / 1000).toFixed(1)} 公里` : `${m} 米`;
};
const fmtTime = (s) => {
  if (!s) return '--';
  const h = Math.floor(s / 3600);
  const min = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${min}min` : `${min} 分钟`;
};
const fmtPrice = (p) => {
  if (p === null || p === undefined) return '--';
  if (typeof p === 'string') return p;
  return p === 0 ? '免费' : `¥${p}`;
};

const buildIWContent = (spot) => {
  const c = getCityColor(spot.city);
  const img = getSpotImage(spot);
  const imgHtml = img
    ? `<div class="mp-iw-img"><img src="${img}" alt="" onerror="this.parentElement.style.display='none'" /></div>`
    : '';
  const desc = spot.description
    ? `<div class="mp-iw-desc">${spot.description.substring(0, 120)}${spot.description.length > 120 ? '...' : ''}</div>`
    : '';
  const addr = spot.address ? `<div class="mp-iw-addr">${spot.address}</div>` : '';
  return `<div class="mp-iw">
    ${imgHtml}
    <div class="mp-iw-title">${spot.name}</div>
    <div class="mp-iw-meta">
      <span style="color:${c};font-weight:600">${spot.city}</span>
      <span>${spot.rating || '--'}</span>
      <span>${fmtPrice(spot.ticket_price)}</span>
    </div>
    ${desc}${addr}
  </div>`;
};

/* ══════════════════════════════════════════ */
const JiangnanTravelMap = () => {
  /* ── state ── */
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [activeCity, setActiveCity] = useState('全部');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('browse');
  const [routeSpots, setRouteSpots] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  /* ── refs ── */
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const amapRef = useRef(null);
  const markersRef = useRef([]);
  const iwRef = useRef(null);
  const drivingRef = useRef(null);
  const shouldFitRef = useRef(true);
  const photoFetchedRef = useRef(false);

  /* ═══════════ 数据加载 ═══════════ */
  const fetchSpots = useCallback(async () => {
    const cache = loadPhotoCache();
    const applyCache = (list) => list.map(s => ({
      ...s,
      image_url: s.image_url || cache[s.name] || CITY_IMAGES[s.city] || null,
    }));

    try {
      setLoading(true);
      const res = await axios.get('/api/scenic-spots/', {
        params: { page_size: 200, sort_by: 'rating', sort_order: 'desc' }
      });
      if (res.data?.success && res.data.data?.length > 0) {
        setSpots(applyCache(res.data.data));
      } else {
        throw new Error('empty');
      }
    } catch {
      setSpots(applyCache(JIANGNAN_LOCATIONS.map((loc, i) => ({
        id: `s${i}`, name: loc.name, city: loc.city,
        description: loc.description, longitude: loc.longitude,
        latitude: loc.latitude, address: loc.address,
        category: loc.category || '景点', rating: loc.rating,
        ticket_price: loc.ticket_price ?? 0, tags: loc.tips || [],
      }))));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSpots(); }, [fetchSpots]);

  /* ═══════════ 高德 PlaceSearch 拉取官方照片 ═══════════ */
  useEffect(() => {
    if (!mapReady || spots.length === 0 || photoFetchedRef.current) return;
    photoFetchedRef.current = true;

    const AMap = amapRef.current;
    if (!AMap) return;

    const cache = loadPhotoCache();
    const need = spots.filter(s => !cache[s.name]);
    if (need.length === 0) return;

    AMap.plugin('AMap.PlaceSearch', () => {
      const ps = new AMap.PlaceSearch({ pageSize: 1, extensions: 'all' });

      const run = async () => {
        const fresh = {};
        for (let i = 0; i < need.length; i++) {
          const spot = need[i];
          await new Promise(resolve => {
            ps.search(`${spot.city} ${spot.name}`, (status, result) => {
              if (status === 'complete' && result.poiList?.pois?.length > 0) {
                const photos = result.poiList.pois[0].photos;
                if (photos?.length > 0) {
                  fresh[spot.name] = photos[0].url;
                }
              }
              resolve();
            });
          });
          if (i % 5 === 4) await new Promise(r => setTimeout(r, 200));
        }

        if (Object.keys(fresh).length === 0) return;
        const merged = { ...cache, ...fresh };
        savePhotoCache(merged);

        setSpots(prev => prev.map(s => ({
          ...s,
          image_url: fresh[s.name] || s.image_url,
        })));
      };

      run();
    });
  }, [mapReady, spots]);

  /* ═══════════ localStorage 持久化 ═══════════ */
  useEffect(() => {
    if (spots.length === 0) return;
    try {
      const ids = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(ids) || ids.length === 0) return;
      const restored = ids
        .map(id => spots.find(s => String(s.id) === String(id)))
        .filter(Boolean);
      if (restored.length > 0) setRouteSpots(restored);
    } catch { /* ignore */ }
  }, [spots]);

  useEffect(() => {
    if (loading) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(routeSpots.map(s => s.id)));
    } catch { /* ignore */ }
  }, [routeSpots, loading]);

  /* ═══════════ 筛选 ═══════════ */
  const filteredSpots = useMemo(() => spots.filter(s => {
    if (activeCity !== '全部' && s.city !== activeCity) return false;
    if (activeCategory !== '全部' && s.category !== activeCategory) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      return [s.name, s.city, s.address, s.description]
        .some(v => (v || '').toLowerCase().includes(q));
    }
    return true;
  }), [spots, activeCity, activeCategory, searchText]);

  const cityStats = useMemo(() => {
    const m = {};
    spots.forEach(s => { m[s.city] = (m[s.city] || 0) + 1; });
    return m;
  }, [spots]);

  const categoryStats = useMemo(() => {
    const m = {};
    const base = activeCity === '全部' ? spots : spots.filter(s => s.city === activeCity);
    base.forEach(s => { if (s.category) m[s.category] = (m[s.category] || 0) + 1; });
    return m;
  }, [spots, activeCity]);

  const totalTicket = useMemo(() => {
    return routeSpots.reduce((sum, s) => {
      const p = typeof s.ticket_price === 'number' ? s.ticket_price : 0;
      return sum + p;
    }, 0);
  }, [routeSpots]);

  /* ═══════════ 地图标记 ═══════════ */
  const openIW = useCallback((spot, map, AMap, yOff = -10) => {
    if (iwRef.current) iwRef.current.close();
    const iw = new AMap.InfoWindow({
      content: buildIWContent(spot),
      offset: new AMap.Pixel(0, yOff),
      closeWhenClickMap: true,
    });
    iw.open(map, [spot.longitude, spot.latitude]);
    iwRef.current = iw;
  }, []);

  const updateMarkers = useCallback(() => {
    const map = mapInst.current;
    const AMap = amapRef.current;
    if (!map || !AMap) return;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    filteredSpots.forEach(spot => {
      if (!spot.longitude || !spot.latitude) return;
      const color = getCityColor(spot.city);
      const rIdx = routeSpots.findIndex(r => r.id === spot.id);
      const inRoute = rIdx >= 0;

      const img = getSpotImage(spot);
      const bgStyle = img ? `background-image:url('${img}')` : '';
      const content = inRoute
        ? `<div class="mp-marker mp-marker-route" style="--mc:${color}">
             <div class="mp-marker-photo" style="${bgStyle}">
               <span class="mp-marker-badge">${rIdx + 1}</span>
             </div>
             <div class="mp-marker-label mp-label-show">${spot.name}</div>
           </div>`
        : `<div class="mp-marker" style="--mc:${color}">
             <div class="mp-marker-photo" style="${bgStyle}"></div>
             <div class="mp-marker-label">${spot.name}</div>
           </div>`;

      const marker = new AMap.Marker({
        position: [spot.longitude, spot.latitude],
        content,
        offset: new AMap.Pixel(-26, -34),
        zIndex: inRoute ? 150 : 100,
      });

      marker.on('click', () => {
        setSelectedId(spot.id);
        map.setZoomAndCenter(14, [spot.longitude, spot.latitude]);
        openIW(spot, map, AMap, inRoute ? -16 : -10);
      });

      marker.setMap(map);
      markersRef.current.push(marker);
    });

    if (shouldFitRef.current && markersRef.current.length > 0) {
      if (activeCity === '全部') {
        map.setZoomAndCenter(MAP_ZOOM, MAP_CENTER);
      } else {
        map.setFitView(markersRef.current, false, [60, 60, 60, 60]);
      }
      shouldFitRef.current = false;
    }
  }, [filteredSpots, routeSpots, openIW, activeCity]);

  useEffect(() => {
    if (mapReady) updateMarkers();
  }, [mapReady, updateMarkers]);

  const handleMapReady = useCallback((map, AMap) => {
    mapInst.current = map;
    amapRef.current = AMap;
    setMapReady(true);
  }, []);

  /* ═══════════ 景点交互 ═══════════ */
  const handleSpotClick = useCallback((spot) => {
    setSelectedId(spot.id);
    const map = mapInst.current;
    const AMap = amapRef.current;
    if (!map || !AMap || !spot.longitude || !spot.latitude) return;
    map.setZoomAndCenter(14, [spot.longitude, spot.latitude]);
    openIW(spot, map, AMap);
  }, [openIW]);

  const handleCityChange = useCallback((city) => {
    setActiveCity(city);
    setSelectedId(null);
    shouldFitRef.current = true;
    if (iwRef.current) { iwRef.current.close(); iwRef.current = null; }
  }, []);

  const handleCategoryChange = useCallback((cat) => {
    setActiveCategory(cat);
    shouldFitRef.current = true;
    if (iwRef.current) { iwRef.current.close(); iwRef.current = null; }
  }, []);

  /* ═══════════ 路线管理 ═══════════ */
  const clearDriving = useCallback(() => {
    if (drivingRef.current) { drivingRef.current.clear(); drivingRef.current = null; }
    setRouteInfo(null);
  }, []);

  const addToRoute = useCallback((spot) => {
    setRouteSpots(prev => {
      if (prev.some(s => s.id === spot.id)) {
        message.warning('该景点已在路线中');
        return prev;
      }
      message.success(`已添加「${spot.name}」`);
      return [...prev, spot];
    });
    clearDriving();
  }, [clearDriving]);

  const removeFromRoute = useCallback((id) => {
    setRouteSpots(prev => prev.filter(s => s.id !== id));
    clearDriving();
  }, [clearDriving]);

  const moveInRoute = useCallback((idx, dir) => {
    setRouteSpots(prev => {
      const a = [...prev];
      const t = idx + dir;
      if (t < 0 || t >= a.length) return prev;
      [a[idx], a[t]] = [a[t], a[idx]];
      return a;
    });
    clearDriving();
  }, [clearDriving]);

  const clearAllRoute = useCallback(() => {
    setRouteSpots([]);
    clearDriving();
  }, [clearDriving]);

  const planRoute = useCallback(() => {
    const map = mapInst.current;
    const AMap = amapRef.current;
    if (!map || !AMap) return;
    if (routeSpots.length < 2) {
      message.warning('至少需要 2 个景点才能规划路线');
      return;
    }
    setRouteLoading(true);
    clearDriving();

    const driving = new AMap.Driving({
      map,
      policy: AMap.DrivingPolicy.LEAST_TIME,
      hideMarkers: true,
      autoFitView: true,
      showTraffic: false,
      isOutline: true,
      outlineColor: '#e0e7ff',
      strokeColor: '#6366f1',
      strokeOpacity: 0.85,
      strokeWeight: 6,
    });
    drivingRef.current = driving;

    const origin = new AMap.LngLat(routeSpots[0].longitude, routeSpots[0].latitude);
    const dest = new AMap.LngLat(
      routeSpots[routeSpots.length - 1].longitude,
      routeSpots[routeSpots.length - 1].latitude
    );
    const waypoints = routeSpots.slice(1, -1).map(
      s => new AMap.LngLat(s.longitude, s.latitude)
    );

    driving.search(origin, dest, { waypoints }, (status, result) => {
      setRouteLoading(false);
      if (status === 'complete' && result.routes?.[0]) {
        const r = result.routes[0];
        setRouteInfo({ distance: r.distance, duration: r.time });
        message.success('路线规划完成');
      } else {
        message.error('路线规划失败，请稍后重试');
      }
    });
  }, [routeSpots, clearDriving]);

  /* ═══════════ 渲染 ═══════════ */
  return (
    <div className="map-planning">
      {/* ── 侧边栏 ── */}
      <aside className="mp-sidebar">
        <div className="mp-header">
          <h2 className="mp-title">地图规划</h2>
          <span className="mp-badge">{filteredSpots.length}/{spots.length}</span>
        </div>

        <div className="mp-search">
          <span className="mp-search-icon">&#128269;</span>
          <input
            className="mp-search-input"
            placeholder="搜索景点、城市..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          {searchText && (
            <button className="mp-search-clear" onClick={() => setSearchText('')}>
              &times;
            </button>
          )}
        </div>

        <div className="mp-tab-nav">
          <button
            className={`mp-tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            景点浏览
          </button>
          <button
            className={`mp-tab-btn ${activeTab === 'route' ? 'active' : ''}`}
            onClick={() => setActiveTab('route')}
          >
            路线规划
            {routeSpots.length > 0 && (
              <span className="mp-tab-count">{routeSpots.length}</span>
            )}
          </button>
        </div>

        {/* ─── 景点浏览 Tab ─── */}
        {activeTab === 'browse' && (
          <>
            {/* 城市横向滚动 */}
            <div className="mp-city-filter">
              <div className="mp-city-scroll">
                {CITY_TABS.map(city => (
                  <button
                    key={city}
                    className={`mp-city-btn ${activeCity === city ? 'active' : ''}`}
                    style={activeCity === city && city !== '全部'
                      ? { '--btn-c': getCityColor(city) } : undefined}
                    onClick={() => handleCityChange(city)}
                  >
                    {city}
                    {city !== '全部' && cityStats[city] && (
                      <span className="mp-city-num">{cityStats[city]}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 分类筛选 */}
            <div className="mp-cat-filter">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`mp-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat}
                  {cat !== '全部' && categoryStats[cat] && (
                    <span className="mp-cat-num">{categoryStats[cat]}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="mp-spot-list">
              {loading ? (
                <div className="mp-empty">
                  <div className="mp-spinner" />
                  <span>加载景点数据...</span>
                </div>
              ) : filteredSpots.length === 0 ? (
                <div className="mp-empty">
                  <span style={{ fontSize: 32 }}>&#128270;</span>
                  <span>未找到匹配的景点</span>
                </div>
              ) : (
                filteredSpots.map(spot => {
                  const inRoute = routeSpots.some(s => s.id === spot.id);
                  return (
                    <div
                      key={spot.id}
                      className={`mp-spot-card ${selectedId === spot.id ? 'active' : ''} ${inRoute ? 'in-route' : ''}`}
                      onClick={() => handleSpotClick(spot)}
                    >
                      <div className="mp-spot-img" style={{ '--mc': getCityColor(spot.city) }}>
                        {getSpotImage(spot) && (
                          <img
                            src={getSpotImage(spot)}
                            alt=""
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        )}
                      </div>
                      <div className="mp-spot-content">
                        <div className="mp-spot-top">
                          <span className="mp-spot-name">{spot.name}</span>
                          <span className="mp-spot-rating">{spot.rating ? `${spot.rating}` : '--'}</span>
                        </div>
                        <div className="mp-spot-meta">
                          <span className="mp-spot-city">{spot.city}</span>
                          {spot.category && <span className="mp-spot-cat">{spot.category}</span>}
                          <span className="mp-spot-price">{fmtPrice(spot.ticket_price)}</span>
                        </div>
                        <button
                          className={`mp-add-btn ${inRoute ? 'added' : ''}`}
                          onClick={e => {
                            e.stopPropagation();
                            inRoute ? removeFromRoute(spot.id) : addToRoute(spot);
                          }}
                        >
                          {inRoute ? '✓ 已加入' : '+ 加入路线'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ─── 路线规划 Tab ─── */}
        {activeTab === 'route' && (
          <div className="mp-route-panel">
            {routeSpots.length === 0 ? (
              <div className="mp-empty">
                <span style={{ fontSize: 40 }}>&#128663;</span>
                <span>还没有添加景点</span>
                <span className="mp-empty-hint">切换到「景点浏览」添加</span>
              </div>
            ) : (
              <>
                <div className="mp-route-list">
                  {routeSpots.map((spot, idx) => (
                    <div key={spot.id} className="mp-route-item">
                      <div className="mp-route-tl">
                        <div className="mp-route-num" style={{ background: getCityColor(spot.city) }}>
                          {idx + 1}
                        </div>
                        {idx < routeSpots.length - 1 && <div className="mp-route-line" />}
                      </div>
                      <div className="mp-route-body" onClick={() => handleSpotClick(spot)}>
                        <span className="mp-route-name">{spot.name}</span>
                        <span className="mp-route-city">
                          {spot.city}
                          {typeof spot.ticket_price === 'number' && spot.ticket_price > 0 &&
                            ` · ¥${spot.ticket_price}`}
                        </span>
                      </div>
                      <div className="mp-route-ctrls">
                        <button className="mp-ctrl-btn" disabled={idx === 0} onClick={() => moveInRoute(idx, -1)}>&#8593;</button>
                        <button className="mp-ctrl-btn" disabled={idx === routeSpots.length - 1} onClick={() => moveInRoute(idx, 1)}>&#8595;</button>
                        <button className="mp-ctrl-btn mp-ctrl-del" onClick={() => removeFromRoute(spot.id)}>&times;</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mp-route-actions">
                  <button
                    className="mp-plan-btn"
                    disabled={routeSpots.length < 2 || routeLoading}
                    onClick={planRoute}
                  >
                    {routeLoading ? '规划中...' : '开始规划路线'}
                  </button>
                  <button className="mp-clear-btn" onClick={clearAllRoute}>清空路线</button>
                </div>

                {routeInfo && (
                  <div className="mp-route-summary">
                    <div className="mp-summary-title">路线概览</div>
                    <div className="mp-summary-grid">
                      <div className="mp-stat">
                        <span className="mp-stat-val">{fmtDist(routeInfo.distance)}</span>
                        <span className="mp-stat-lbl">总距离</span>
                      </div>
                      <div className="mp-stat">
                        <span className="mp-stat-val">{fmtTime(routeInfo.duration)}</span>
                        <span className="mp-stat-lbl">预计时间</span>
                      </div>
                      <div className="mp-stat">
                        <span className="mp-stat-val">{routeSpots.length} 个</span>
                        <span className="mp-stat-lbl">途经景点</span>
                      </div>
                      <div className="mp-stat">
                        <span className="mp-stat-val">{totalTicket > 0 ? `¥${totalTicket}` : '免费'}</span>
                        <span className="mp-stat-lbl">预计门票</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </aside>

      {/* ── 地图区域 ── */}
      <main className="mp-map-area">
        <AmapContainer
          ref={mapRef}
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          onMapReady={handleMapReady}
          showControls={false}
          className="mp-map"
        />
        {routeSpots.length > 0 && activeTab !== 'route' && (
          <button className="mp-float-route" onClick={() => setActiveTab('route')}>
            &#128663; {routeSpots.length} 个景点已选 &rarr; 规划路线
          </button>
        )}
      </main>
    </div>
  );
};

export default JiangnanTravelMap;
