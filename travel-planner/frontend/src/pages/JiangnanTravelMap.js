/**
 * 江浙沪旅游地图页面
 * 简化版本 - 仅显示地图
 */

import React, { useRef, useCallback } from 'react';
import AmapContainer from '../components/AmapContainer';
import './JiangnanTravelMap.css';

const JiangnanTravelMap = () => {
  const mapRef = useRef(null);

  const handleMapReady = useCallback((map, AMap) => {
    console.log('地图准备就绪');
  }, []);

  return (
    <div className="jiangnan-travel-map-page">
      <div className="map-section">
        <AmapContainer
          ref={mapRef}
          center={[120.15, 30.24]}
          zoom={10}
          onMapReady={handleMapReady}
          showControls={true}
          className="travel-map-container"
        />
      </div>
    </div>
  );
};

export default JiangnanTravelMap;
