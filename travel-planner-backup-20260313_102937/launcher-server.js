const { exec } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 8080;
const PROJECT_DIR = __dirname;

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api/start') {
        const startScript = path.join(PROJECT_DIR, 'start-no-docker.bat');
        
        exec(`start "" "${startScript}"`, { cwd: PROJECT_DIR }, (error) => {
            if (error) {
                console.error('启动失败:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            } else {
                console.log('启动命令已发送');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            }
        });
    } else if (req.method === 'POST' && req.url === '/api/stop') {
        const stopScript = path.join(PROJECT_DIR, 'stop.bat');
        
        exec(`start "" "${stopScript}"`, { cwd: PROJECT_DIR }, (error) => {
            if (error) {
                console.error('停止失败:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            } else {
                console.log('停止命令已发送');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(PORT, () => {
    console.log(`Launcher server running at http://localhost:${PORT}`);
    console.log(`Open launcher.html in your browser`);
});
