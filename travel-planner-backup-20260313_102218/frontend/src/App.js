import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';

import { setupAxiosDefaults } from './utils/axios';
import Layout from './components/Layout';
import Auth from './pages/Auth';

import './styles/design-system.css';
import './styles/responsive.css';
import './styles/cross-browser.css';
import './styles/performance.css';
import './styles/accessibility.css';

setupAxiosDefaults();

const Home = lazy(() => import('./pages/Home'));
const ItineraryForm = lazy(() => import('./pages/ItineraryForm'));
const ItineraryList = lazy(() => import('./pages/ItineraryList'));
const ItineraryDetail = lazy(() => import('./pages/ItineraryDetail'));
const ItineraryDetailJiangnan = lazy(() => import('./pages/ItineraryDetailJiangnan'));
const AIPlanningNew = lazy(() => import('./pages/AIPlanningNew'));
const AITravelPlanner = lazy(() => import('./pages/AITravelPlanner'));
const AIAccountingPage = lazy(() => import('./pages/AIAccountingPage'));
const PrototypeCreatePage = lazy(() => import('./pages/PrototypeCreatePage'));
const PrototypeListPage = lazy(() => import('./pages/PrototypeListPage'));
const JiangnanTravelMap = lazy(() => import('./pages/JiangnanTravelMap'));
const HotelSearchPage = lazy(() => import('./pages/HotelSearchPage'));
const AdminApp = lazy(() => import('./pages/admin'));

const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#f0f2f5'
  }}>
    <Spin size="large" tip="加载中..." />
  </div>
);

const LazyRoute = ({ children }) => (
  <Suspense fallback={<PageLoader />}>
    {children}
  </Suspense>
);

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<LazyRoute><Home /></LazyRoute>} />
            <Route path="/create" element={<LazyRoute><PrototypeCreatePage /></LazyRoute>} />
            <Route path="/create-react" element={<LazyRoute><ItineraryForm /></LazyRoute>} />
            <Route path="/itineraries" element={<LazyRoute><PrototypeListPage /></LazyRoute>} />
            <Route path="/itineraries-react" element={<LazyRoute><ItineraryList /></LazyRoute>} />
            <Route path="/itinerary/:id" element={<LazyRoute><ItineraryDetail /></LazyRoute>} />
            <Route path="/itinerary-jiangnan/:id" element={<LazyRoute><ItineraryDetailJiangnan /></LazyRoute>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/ai-planning" element={<LazyRoute><AITravelPlanner /></LazyRoute>} />
            <Route path="/ai-planning-legacy" element={<LazyRoute><AIPlanningNew /></LazyRoute>} />
            <Route path="/ai-accounting" element={<LazyRoute><AIAccountingPage /></LazyRoute>} />
            <Route path="/jiangnan-map" element={<LazyRoute><JiangnanTravelMap /></LazyRoute>} />
            <Route path="/hotels" element={<LazyRoute><HotelSearchPage /></LazyRoute>} />
            <Route path="/admin/*" element={<LazyRoute><AdminApp /></LazyRoute>} />
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
