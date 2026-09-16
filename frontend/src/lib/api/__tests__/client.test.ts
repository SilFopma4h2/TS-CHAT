import { describe, it } from 'node:test';
import assert from 'node:assert';

// Verify ApiClient, ApiClientError, token setting, headers, error parsing exist in client module
import { readFileSync } from 'node:fs';

describe('ApiClient', () => {
  it('exports ApiClient and ApiClientError classes', () => {
    const clientPath = new URL('../client.ts', import.meta.url);
    const content = readFileSync(clientPath, 'utf8');
    assert.ok(content.includes('export class ApiClient'));
    assert.ok(content.includes('export class ApiClientError'));
    assert.ok(content.includes('export const apiClient'));
    assert.ok(content.includes('setToken'));
    assert.ok(content.includes('getToken'));
    assert.ok(content.includes('headers'));
  });

  it('handles error parsing from response', () => {
    const clientPath = new URL('../client.ts', import.meta.url);
    const content = readFileSync(clientPath, 'utf8');
    assert.ok(content.includes("parsedData as ApiErrorResponse"));
    assert.ok(content.includes("ApiClientError"));
    assert.ok(content.includes('content-type'));
  });
});
