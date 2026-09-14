import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { HealthResponse } from '../src/types/index.js';

type ErrorBody = { error: string };
import type { Server } from 'node:http';
import { createApp } from '../src/app.js';

async function withTestServer<T>(fn: (baseUrl: string) => Promise<T>): Promise<T> {
  const app = createApp();
  const server: Server = app.listen(0);
  await once(server, 'listening');

  try {
    const { port } = server.address() as AddressInfo;
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe('/health', () => {
  it('responds with status 200 and { status: "ok" }', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/health`);
      assert.equal(res.status, 200);
      const body = (await res.json()) as HealthResponse;
      assert.deepEqual(body, { status: 'ok' });
    });
  });

  it('returns 404 JSON for unknown routes', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/does-not-exist`);
      assert.equal(res.status, 404);
      const body = (await res.json()) as ErrorBody;
      assert.equal(typeof body.error, 'string');
    });
  });
});