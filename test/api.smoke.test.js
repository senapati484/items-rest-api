const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';

const app = require('../src/app');
const {
  __setDbStatusForTests,
  __clearDbStatusForTests,
} = require('../src/config/db');
const {
  createItemSchema,
  itemQuerySchema,
  updateItemSchema,
} = require('../src/schemas/item.schema');

const startServer = () =>
  new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${port}`,
      });
    });

    server.on('error', reject);
  });

const stopServer = (server) =>
  new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

test.afterEach(() => {
  __clearDbStatusForTests();
});

test('health and docs stay available while DB-backed routes return 503', async () => {
  __setDbStatusForTests({
    connected: false,
    state: 'disconnected',
    lastError: 'Atlas IP access is blocked.',
  });

  const { server, baseUrl } = await startServer();

  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    assert.equal(healthResponse.status, 200);
    const healthBody = await healthResponse.json();
    assert.equal(healthBody.success, true);
    assert.deepEqual(healthBody.database, {
      connected: false,
      state: 'disconnected',
      lastError: 'Atlas IP access is blocked.',
    });

    const docsResponse = await fetch(`${baseUrl}/api-docs`);
    assert.equal(docsResponse.status, 200);
    const docsHtml = await docsResponse.text();
    assert.match(docsHtml, /Items REST API - Documentation/);

    const swaggerResponse = await fetch(`${baseUrl}/api-docs/swagger.json`);
    assert.equal(swaggerResponse.status, 200);
    const swaggerBody = await swaggerResponse.json();
    assert.equal(swaggerBody.openapi, '3.0.3');

    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
      }),
    });
    assert.equal(registerResponse.status, 503);
    assert.deepEqual(await registerResponse.json(), {
      success: false,
      message: 'Database unavailable. Please try again later.',
    });

    const itemsResponse = await fetch(`${baseUrl}/api/items`);
    assert.equal(itemsResponse.status, 503);
    assert.deepEqual(await itemsResponse.json(), {
      success: false,
      message: 'Database unavailable. Please try again later.',
    });
  } finally {
    await stopServer(server);
  }
});

test('item schemas preserve false boolean filters and allow zero-price items', () => {
  const queryResult = itemQuerySchema.safeParse({ inStock: 'false' });
  assert.equal(queryResult.success, true);
  assert.equal(queryResult.data.inStock, false);

  const trueQueryResult = itemQuerySchema.safeParse({ inStock: 'true' });
  assert.equal(trueQueryResult.success, true);
  assert.equal(trueQueryResult.data.inStock, true);

  assert.equal(
    createItemSchema.safeParse({
      name: 'Free Sample',
      price: 0,
    }).success,
    true
  );

  assert.equal(
    updateItemSchema.safeParse({
      price: 0,
    }).success,
    true
  );
});
