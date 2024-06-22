import React, { Fragment } from 'react';

import { createPlugin, createRouteRef } from '@backstage/core-plugin-api';
import { removeScalprum } from '@scalprum/core';
import { renderWithEffects } from '@backstage/test-utils';
import AppBase from '../AppBase/AppBase';
import { act } from 'react-dom/test-utils';
import * as useAsync from 'react-use/lib/useAsync';
import initializeRemotePlugins from '../../utils/dynamicUI/initializeRemotePlugins';
import { defaultConfigLoader } from '@backstage/core-app-api';

const DynamicRoot = React.lazy(() => import('../DynamicRoot/DynamicRoot'));
const mockAppInner = () => <AppBase />;
const MockApp = ({ dynamicPlugins }: { dynamicPlugins: any }) => (
  <React.Suspense fallback={null}>
    <DynamicRoot
      apis={[]}
      afterInit={async () =>
        Promise.resolve({
          default: mockAppInner,
        })
      }
      dynamicPlugins={dynamicPlugins}
      scalprumConfig={{}}
    />
  </React.Suspense>
);

// Swap out the app's BrowserRouter and provide tests a
// means to set the initial history
let initialEntries = ['/'];

const reactRouter = require('react-router-dom');

const { MemoryRouter } = reactRouter;

const MockRouter = ({ children }: any) => (
  <MemoryRouter initialEntries={[...initialEntries]}>{children}</MemoryRouter>
);
MockRouter.propTypes = { ...MemoryRouter.propTypes };
reactRouter.BrowserRouter = MockRouter;

jest.mock('@scalprum/core', () => ({
  ...jest.requireActual('@scalprum/core'),
  getScalprum: jest.fn().mockReturnValue({ api: {} }),
}));

jest.mock('@scalprum/react-core', () => ({
  ...jest.requireActual('@scalprum/react-core'),
  ScalprumProvider: jest
    .fn()
    .mockImplementation(({ children }) => <>{children}</>),
  useScalprum: jest
    .fn()
    .mockReturnValue({ initialized: true, pluginStore: [] }),
}));

jest.mock('react-use/lib/useAsync', () => ({
  default: () => ({}),
  __esModule: true,
}));

jest.mock('@backstage/app-defaults', () => ({
  ...jest.requireActual('@backstage/app-defaults'),
  __esModule: true,
}));

// Remove the sign-in page
jest.mock('../DynamicRoot/defaultAppComponents', () => ({
  default: {},
  __esModule: true,
}));

// Simplify the home page
jest.mock('../home/HomePage', () => ({
  HomePage: () => <></>,
  __esModule: true,
}));

const mockInitializeRemotePlugins = jest.fn() as jest.MockedFunction<
  typeof initializeRemotePlugins
>;
jest.mock('../../utils/dynamicUI/initializeRemotePlugins', () => ({
  default: mockInitializeRemotePlugins,
  __esModule: true,
}));

const loadTestConfig = async (dynamicPlugins: any) => {
  process.env = {
    NODE_ENV: 'test',
    APP_CONFIG: [
      {
        data: {
          app: { title: 'Test' },
          backend: { baseUrl: 'http://localhost:7007' },
          techdocs: {
            storageUrl: 'http://localhost:7007/api/techdocs/static/docs',
          },
          auth: { environment: 'development' },
          dynamicPlugins,
        },
        context: 'test',
      },
    ] as any,
  };
  await defaultConfigLoader();
};

const consoleSpy = jest.spyOn(console, 'warn');

describe('AdminTabs', () => {
  beforeEach(() => {
    removeScalprum();
    mockInitializeRemotePlugins.mockResolvedValue({
      'test-plugin': {
        PluginRoot: {
          default: Fragment,
          testPlugin: createPlugin({
            id: 'test-plugin',
            routes: { root: createRouteRef({ id: 'test-plugin' }) },
          }),
          TestComponent: Fragment,
          isTestConditionTrue: () => true,
          isTestConditionFalse: () => false,
          TestComponentWithStaticJSX: {
            element: ({ children }: { children?: React.ReactNode }) => (
              <>{children}</>
            ),
            staticJSXContent: <div />,
          },
        },
      },
    });
    jest
      .spyOn(useAsync, 'default')
      .mockReturnValue({ loading: false, value: {} });
  });

  afterEach(() => {
    consoleSpy.mockReset();
  });

  it('Should not be available when not configured', async () => {
    const dynamicPlugins = {
      frontend: {
        'test-plugin': {
          dynamicRoutes: [],
          mountPoints: [],
        },
      },
    };
    initialEntries = ['/'];
    await loadTestConfig(dynamicPlugins);
    const rendered = await renderWithEffects(
      <MockApp dynamicPlugins={dynamicPlugins} />,
    );
    expect(rendered.baseElement).toBeInTheDocument();
    const home = rendered.queryByText('Home');
    const administration = rendered.queryByText('Administration');
    expect(home).not.toBeNull();
    expect(administration).toBeNull();
  });

  it('Should be available when configured', async () => {
    const dynamicPlugins = {
      frontend: {
        'test-plugin': {
          dynamicRoutes: [{ path: '/admin/plugins' }],
          mountPoints: [{ mountPoint: 'admin.page.plugins/cards' }],
        },
      },
    };
    initialEntries = ['/'];
    await loadTestConfig(dynamicPlugins);
    const rendered = await renderWithEffects(
      <MockApp dynamicPlugins={dynamicPlugins} />,
    );
    expect(rendered.baseElement).toBeInTheDocument();
    const home = rendered.queryByText('Home');
    const administration = rendered.queryByText('Administration');
    expect(home).not.toBeNull();
    expect(administration).not.toBeNull();
  });

  it('Should route to the plugin tab when configured', async () => {
    const dynamicPlugins = {
      frontend: {
        'test-plugin': {
          dynamicRoutes: [{ path: '/admin/plugins' }],
          mountPoints: [{ mountPoint: 'admin.page.plugins/cards' }],
        },
      },
    };
    initialEntries = ['/'];
    await loadTestConfig(dynamicPlugins);
    const rendered = await renderWithEffects(
      <MockApp dynamicPlugins={dynamicPlugins} />,
    );
    expect(rendered.baseElement).toBeInTheDocument();
    await act(() => {
      rendered.getByText('Administration').click();
    });
    const plugins = rendered.queryByText('Plugins');
    expect(plugins).not.toBeNull();
  });

  it('Should route to the rbac tab when configured', async () => {
    const dynamicPlugins = {
      frontend: {
        'test-plugin': {
          dynamicRoutes: [{ path: '/admin/rbac' }],
          mountPoints: [{ mountPoint: 'admin.page.rbac/cards' }],
        },
      },
    };
    initialEntries = ['/'];
    await loadTestConfig(dynamicPlugins);
    const rendered = await renderWithEffects(
      <MockApp dynamicPlugins={dynamicPlugins} />,
    );
    expect(rendered.baseElement).toBeInTheDocument();
    await act(() => {
      rendered.getByText('Administration').click();
    });
    const rbac = rendered.queryByText('RBAC');
    expect(rbac).not.toBeNull();
  });

  it("Should fail back to the default tab if the currently routed tab doesn't match the configuration", async () => {
    const dynamicPlugins = {
      frontend: {
        'test-plugin': {
          dynamicRoutes: [{ path: '/admin/rbac' }],
          mountPoints: [{ mountPoint: 'admin.page.rbac/cards' }],
        },
      },
    };
    initialEntries = ['/admin/plugins'];
    await loadTestConfig(dynamicPlugins);
    const rendered = await renderWithEffects(
      <MockApp dynamicPlugins={dynamicPlugins} />,
    );
    // When debugging this test it can be handy to see the entire rendered output
    // process.stdout.write(`${prettyDOM(rendered.baseElement, 900000)}`);
    expect(rendered.baseElement).toBeInTheDocument();
    expect(rendered.getByText('RBAC')).toBeInTheDocument();
  });

  it('Should fail with an error page if routed to but no configuration is defined', async () => {
    const dynamicPlugins = {
      frontend: {
        'test-plugin': {
          dynamicRoutes: [],
          mountPoints: [],
        },
      },
    };
    initialEntries = ['/admin/plugins'];
    await loadTestConfig(dynamicPlugins);
    const rendered = await renderWithEffects(
      <MockApp dynamicPlugins={dynamicPlugins} />,
    );
    // When debugging this test it can be handy to see the entire rendered output
    // process.stdout.write(`${prettyDOM(rendered.baseElement, 900000)}`);
    expect(rendered.baseElement).toBeInTheDocument();
    const errorComponent = rendered.getByTestId('error');
    expect(
      errorComponent.textContent!.indexOf(
        'No admin mount points are configured',
      ) !== -1,
    ).toBeTruthy();
  });
});
