import { Server } from 'http';
import { setupServer } from 'msw/node';
import {
  mockServices,
  registerMswTestHooks,
  startTestBackend,
} from '@backstage/backend-test-utils';
import request from 'supertest';
import { authModuleRhaapProvider } from './module';
import { rest } from 'msw';
import { decodeOAuthState } from '@backstage/plugin-auth-node';
import { exportJWK, generateKeyPair, JWK, SignJWT } from 'jose';

describe('authModuleRHAAPProvider', () => {
  let backstageServer: Server;
  let appUrl: string;
  let idToken: string;
  let publicKey: JWK;

  const mswServer = setupServer();
  registerMswTestHooks(mswServer);

  beforeAll(async () => {
    const keyPair = await generateKeyPair('RS256');
    const privateKey = await exportJWK(keyPair.privateKey);
    publicKey = await exportJWK(keyPair.publicKey);
    publicKey.alg = privateKey.alg = 'RS256';

    idToken = await new SignJWT({
      sub: 'test',
      iss: 'https://rhaap.test',
      iat: Date.now(),
      aud: 'clientId',
      exp: Date.now() + 10000,
    })
      .setProtectedHeader({ alg: privateKey.alg, kid: privateKey.kid })
      .sign(keyPair.privateKey);
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    mswServer.use(
      rest.get('https://rhaap.test/o/authorize/', async (req, res, ctx) => {
        const callbackUrl = new URL(req.url.searchParams.get('redirect_uri')!);
        callbackUrl.searchParams.set('code', 'authorization_code');
        callbackUrl.searchParams.set(
          'state',
          req.url.searchParams.get('state')!,
        );
        callbackUrl.searchParams.set('scope', 'test-scope');
        return res(
          ctx.status(302),
          ctx.set('Location', callbackUrl.toString()),
        );
      }),
      rest.post('https://rhaap.test/o/token', async (req, res, ctx) => {
        return res(
          req.headers.get('Authorization')
            ? ctx.json({
                access_token: 'accessToken',
                id_token: idToken,
                refresh_token: 'refreshToken',
                scope: 'testScope',
                token_type: '',
                expires_in: 3600,
              })
            : ctx.status(401),
        );
      }),
    );

    const backend = await startTestBackend({
      features: [
        authModuleRhaapProvider,
        import('@backstage/plugin-auth-backend'),
        mockServices.rootConfig.factory({
          data: {
            app: { baseUrl: 'http://localhost' },
            enableExperimentalRedirectFlow: true,
            auth: {
              session: { secret: 'test' },
              providers: {
                rhaap: {
                  development: {
                    host: 'https://rhaap.test',
                    clientId: 'clientId',
                    clientSecret: 'clientSecret',
                  },
                },
              },
            },
          },
        }),
      ],
    });
    backstageServer = backend.server;
    const port = backend.server.port();
    appUrl = `http://localhost:${port}`;
    mswServer.use(rest.all(`http://*:${port}/*`, req => req.passthrough()));
  });

  afterEach(() => {
    backstageServer.close();
  });

  it('should start', async () => {
    const agent = request.agent(backstageServer);
    const startResponse = await agent.get(
      `/api/auth/rhaap/start?env=development`,
    );
    expect(startResponse.status).toEqual(302);

    const nonceCookie = agent.jar.getCookie('rhaap-nonce', {
      domain: 'localhost',
      path: '/api/auth/rhaap/handler',
      script: false,
      secure: false,
    });

    const startUrl = new URL(startResponse.get('location') ?? '');
    expect(startUrl.origin).toBe('https://rhaap.test');
    expect(startUrl.pathname).toBe('/o/authorize/');
    expect(Object.fromEntries(startUrl.searchParams)).toEqual({
      response_type: 'code',
      client_id: 'clientId',
      redirect_uri: `${appUrl}/api/auth/rhaap/handler/frame`,
      state: expect.any(String),
      approval_prompt: 'auto',
    });
    expect(decodeOAuthState(startUrl.searchParams.get('state')!)).toEqual({
      env: 'development',
      nonce: decodeURIComponent(nonceCookie!.value),
      scope: '',
    });
  });
});
