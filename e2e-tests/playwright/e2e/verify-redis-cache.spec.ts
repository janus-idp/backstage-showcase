import { expect, test } from '@playwright/test';
import { UIhelper } from '../utils/UIhelper';
import { Common } from '../utils/Common';
import Redis from 'ioredis';
import { spawn } from 'child_process';

test.describe('Verify Redis Cache DB', () => {
  let common: Common;
  let uiHelper: UIhelper;
  test.beforeEach(async ({ page }) => {
    uiHelper = new UIhelper(page);
    common = new Common(page);
    await common.loginAsGuest();
  });

  test('Open techdoc and verify the cache generated in redis db', async () => {
    await uiHelper.openSidebar('Docs');
    await uiHelper.clickLink('Backstage Showcase');

    const portForward = spawn('/bin/sh', [
      '-c',
      `
      oc login --token="${process.env.K8S_CLUSTER_TOKEN}" --server="${process.env.K8S_CLUSTER_URL}" && 
      kubectl port-forward service/redis 6379:6379 -n ${process.env.NAME_SPACE}
    `,
    ]);

    // Wait for port-forward to be ready
    await new Promise<void>((resolve, reject) => {
      portForward.stdout.on('data', data => {
        if (data.toString().includes('Forwarding from 127.0.0.1:6379')) {
          resolve();
        }
      });

      portForward.stderr.on('data', data => {
        reject(new Error(`Port forwarding failed: ${data.toString()}`));
      });
    });

    const redis = new Redis(
      `redis://${process.env.REDIS_TEMP_USER}:${process.env.REDIS_TEMP_PASS}@localhost:6379`,
    );
    const keys = await redis.keys('*');
    expect(keys).toContainEqual(expect.stringContaining('techdocs'));
    redis.disconnect();
  });
});
