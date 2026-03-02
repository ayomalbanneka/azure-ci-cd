const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { requestHandler } = require('./app');

function makeRequest(server, path) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    http.get(`http://localhost:${port}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', reject);
  });
}

describe('App', () => {
  let server;

  before(() => {
    return new Promise((resolve) => {
      server = http.createServer(requestHandler);
      server.listen(0, resolve); // random available port
    });
  });

  after(() => {
    return new Promise((resolve) => {
      server.close(resolve);
    });
  });

  it('GET / should return 200 with HTML', async () => {
    const res = await makeRequest(server, '/');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.headers['content-type'], /text\/html/);
    assert.match(res.body, /Azure CI\/CD App/);
  });

  it('GET /health should return 200 with ok status', async () => {
    const res = await makeRequest(server, '/health');
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.status, 'ok');
  });

  it('GET /api/status should return status info', async () => {
    const res = await makeRequest(server, '/api/status');
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.status, 'ok');
    assert.ok(body.environment);
    assert.ok(body.timestamp);
  });

  it('GET /unknown should return 404', async () => {
    const res = await makeRequest(server, '/unknown');
    assert.strictEqual(res.statusCode, 404);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error, 'Not Found');
  });
});
