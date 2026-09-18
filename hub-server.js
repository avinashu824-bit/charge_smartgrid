const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const HUB_FILE = path.join(__dirname, 'hub.html');

const server = http.createServer((req, res) => {
  fs.readFile(HUB_FILE, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading hub.html: ' + err.message);
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  ChargeSmart 3-in-1 Unified Hub is LIVE!`);
  console.log(`  Open ONE link: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
