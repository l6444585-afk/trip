const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Docker: REACT_APP_BACKEND_URL=http://backend:8000 (via docker-compose environment)
  // Manual: defaults to http://localhost:8000
  const target = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

  app.use('/api', createProxyMiddleware({
    target,
    changeOrigin: true,
    logLevel: 'warn',
  }));
};
