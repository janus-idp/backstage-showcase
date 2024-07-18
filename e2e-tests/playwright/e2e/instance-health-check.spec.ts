import { test, expect } from '@playwright/test';

test('Application health check', async ({ request }) => {
  //Test e2e.
  const healthCheckEndpoint = '/healthcheck';

  const response = await request.get(healthCheckEndpoint);

  const responseBody = await response.json();

  expect(response.status()).toBe(200);

  expect(responseBody).toHaveProperty('status', 'ok');
});
