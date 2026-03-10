/**
 * 应用主入口组件
 * 配置路由、主题和全局布局
 * @module App
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

import { setupAxiosDefaults } from './utils/axios';

import Layout from './components/Layout';

import Home from './pages/Home';
import ItineraryForm from './pages/ItineraryForm';
import ItineraryDetail from './pages/ItineraryDetail';
import ItineraryList from './pages/ItineraryList';
import ItineraryDetailJiangnan from './pages/ItineraryDetailJiangnan';
import Auth from './pages/Auth';
import AIPlanningNew from './pages/AIPlanningNew';
import AITravelPlanner from './pages/AITravelPlanner';
import AIAccountingPage from './pages/AIAccountingPage';
import PrototypeCreatePage from './pages/PrototypeCreatePage';
import PrototypeListPage from './pages/PrototypeListPage';
import JiangnanTravelMap from './pages/JiangnanTravelMap';
import HotelSearchPage from './pages/HotelSearchPage';
import AdminApp from './pages/admin';

import './styles/design-system.css';
import './styles/responsive.css';
import './styles/cross-browser.css';
import './styles/performance.css';
import './styles/accessibility.css';

setupAxiosDefaults();

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<PrototypeCreatePage />} />
            <Route path="/create-react" element={<ItineraryForm />} />
            <Route path="/itineraries" element={<PrototypeListPage />} />
            <Route path="/itineraries-react" element={<ItineraryList />} />
            <Route path="/itinerary/:id" element={<ItineraryDetail />} />
            <Route path="/itinerary-jiangnan/:id" element={<ItineraryDetailJiangnan />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/ai-planning" element={<AITravelPlanner />} />
            <Route path="/ai-planning-legacy" element={<AIPlanningNew />} />
            <Route path="/ai-accounting" element={<AIAccountingPage />} />
            <Route path="/jiangnan-map" element={<JiangnanTravelMap />} />
            <Route path="/hotels" element={<HotelSearchPage />} />
            <Route path="/admin/*" element={<AdminApp />} />
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
