/**
 * serve.js - Zero-dependency local dev server for Automation Arena
 * Runs out-of-the-box with Node.js standard library.
 * Auto-detects open port and opens default browser.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

const INITIAL_PORT = 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.pdf': 'application/pdf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8'
};

function getNetworkIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

function openBrowser(url) {
    const platform = process.platform;
    let cmd = '';
    if (platform === 'win32') {
        cmd = `start "" "${url}"`;
    } else if (platform === 'darwin') {
        cmd = `open "${url}"`;
    } else {
        cmd = `xdg-open "${url}"`;
    }
    exec(cmd, (err) => {
        if (err) {
            // Silently ignore browser launch errors
        }
    });
}

function createServer(port) {
    const server = http.createServer((req, res) => {
        // Parse URL
        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        let pathname = decodeURIComponent(parsedUrl.pathname);

        // Routing shortcuts
        if (pathname === '/' || pathname === '') {
            pathname = '/index.html';
        } else if (pathname === '/tests') {
            pathname = '/tests.html';
        } else if (pathname === '/invite') {
            pathname = '/invite.html';
        }

        // Prevent directory traversal
        const safePath = path.normalize(path.join(ROOT_DIR, pathname));
        if (!safePath.startsWith(ROOT_DIR)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('403 Forbidden');
            return;
        }

        fs.stat(safePath, (err, stats) => {
            if (err || !stats.isFile()) {
                // If it's a directory, try index.html inside it
                if (stats && stats.isDirectory()) {
                    const indexPath = path.join(safePath, 'index.html');
                    if (fs.existsSync(indexPath)) {
                        serveFile(indexPath, res);
                        return;
                    }
                }
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head><title>404 Not Found</title><style>body{font-family:system-ui;padding:40px;text-align:center;background:#0d1117;color:#c9d1d9}a{color:#58a6ff}</style></head>
                    <body>
                        <h1>404 - File Not Found</h1>
                        <p>Could not find <code>${pathname}</code></p>
                        <p><a href="/">Return to Arena Home</a></p>
                    </body>
                    </html>
                `);
                return;
            }

            serveFile(safePath, res);
        });
    });

    function serveFile(filePath, res) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        // Add permissive CORS for local development
        const headers = {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        };

        res.writeHead(200, headers);
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
        readStream.on('error', (streamErr) => {
            console.error('Stream error:', streamErr);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
            }
            res.end('500 Internal Server Error');
        });
    }

    server.listen(port, () => {
        const localUrl = `http://localhost:${port}`;
        const networkIp = getNetworkIp();
        const networkUrl = `http://${networkIp}:${port}`;

        console.log('');
        console.log('  ======================================================');
        console.log('   ⚡  Automation Arena - Local Development Server');
        console.log('  ======================================================');
        console.log('');
        console.log(`   > Local:   \x1b[36m${localUrl}\x1b[0m`);
        console.log(`   > Network: \x1b[36m${networkUrl}\x1b[0m`);
        console.log(`   > Tests:   \x1b[36m${localUrl}/tests.html\x1b[0m`);
        console.log(`   > Invites: \x1b[36m${localUrl}/invite.html\x1b[0m`);
        console.log('');
        console.log('   Serving from: ' + ROOT_DIR);
        console.log('   Press \x1b[33mCtrl + C\x1b[0m to stop.');
        console.log('  ======================================================');
        console.log('');

        // Automatically launch browser
        openBrowser(localUrl);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} in use, trying port ${port + 1}...`);
            createServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
}

// Start
createServer(INITIAL_PORT);
