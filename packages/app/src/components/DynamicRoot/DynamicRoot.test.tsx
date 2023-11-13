import React, { useContext } from 'react';
import { renderWithEffects } from '@backstage/test-utils';
import { removeScalprum } from '@scalprum/core';
import { waitFor, within } from '@testing-library/dom';
import initializeRemotePlugins from '../../utils/dynamicUI/initializeRemotePlugins';
import * as useAsync from 'react-use/lib/useAsync';
import DynamicRootContext from './DynamicRootContext';
import { useApp } from '@backstage/core-plugin-api';
import { Entity } from '@backstage/catalog-model';

const DynamicRoot = React.lazy(() => import('./DynamicRoot'));

const InnerPage = () => {
  const app = useApp();

  return <>{Object.keys(app.getSystemIcons()).join(',')}</>;
};

const MockPage = () => {
  const { AppProvider, dynamicRoutes, mountPoints } =
    useContext(DynamicRootContext);

  return (
    <AppProvider>
      <div data-testid="isLoadingFinished" />
      <div data-testid="dynamicRoutes">
        {dynamicRoutes
          .filter(r => Boolean(r.Component))
          .map(r => r.path)
          .join(', ')}
      </div>
      <div data-testid="mountPoints">
        {Object.entries(mountPoints)
          .map(([k, v]) => `${k}: ${v.length}`)
          .join(', ')}
      </div>
      <div data-testid="mountPointsIfs">
        {Object.entries(mountPoints)
          .map(
            ([k, v]) =>
              `${k}: ${v.map(c => c.config?.if({} as Entity)).join('_')}`,
          )
          .join(', ')}
      </div>
      <div data-testid="appIcons">
        <InnerPage />
      </div>
    </AppProvider>
  );
};

const MockApp = () => (
  <React.Suspense fallback={null}>
    <DynamicRoot
      apis={[]}
      afterInit={async () =>
        Promise.resolve({
          default: () => {
            return <MockPage />;
          },
        })
      }
    />
  </React.Suspense>
);

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

const mockInitializeRemotePlugins = jest.fn() as jest.MockedFunction<
  typeof initializeRemotePlugins
>;
jest.mock('../../utils/dynamicUI/initializeRemotePlugins', () => ({
  default: mockInitializeRemotePlugins,
  __esModule: true,
}));

const mockProcessEnv = (dynamicPluginsConfig: { [key: string]: any }) => ({
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
        dynamicPlugins: {
          frontend: dynamicPluginsConfig,
        },
      },
      context: 'test',
    },
  ] as any,
});

const consoleSpy = jest.spyOn(console, 'warn');

describe('DynamicRoot', () => {
  beforeEach(() => {
    removeScalprum();
    mockInitializeRemotePlugins.mockResolvedValue({
      'foo.bar': {
        PluginRoot: {
          default: React.Fragment,
          FooComponent: React.Fragment,
          isFooConditionTrue: () => true,
          isFooConditionFalse: () => false,
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

  it('should render with one dynamicRoute', async () => {
    process.env = mockProcessEnv({
      'foo.bar': { dynamicRoutes: [{ path: '/foo' }] },
    });
    const rendered = await renderWithEffects(<MockApp />);
    await waitFor(async () => {
      expect(rendered.baseElement).toBeInTheDocument();
      expect(rendered.getByTestId('isLoadingFinished')).toBeInTheDocument();
      expect(
        within(rendered.getByTestId('dynamicRoutes')).getByText('/foo'),
      ).toBeInTheDocument();
    });
  });

  it('should render with two dynamicRoutes', async () => {
    process.env = mockProcessEnv({
      'foo.bar': { dynamicRoutes: [{ path: '/foo' }, { path: '/bar' }] },
    });
    const rendered = await renderWithEffects(<MockApp />);
    await waitFor(async () => {
      expect(rendered.baseElement).toBeInTheDocument();
      expect(rendered.getByTestId('isLoadingFinished')).toBeInTheDocument();
      expect(
        within(rendered.getByTestId('dynamicRoutes')).getByText('/foo, /bar'),
      ).toBeInTheDocument();
    });
  });

  it('should render with one dynamicRoute from nonexistent plugin', async () => {
    process.env = mockProcessEnv({
      'doesnt.exist': { dynamicRoutes: [{ path: '/foo' }] },
    });
    const rendered = await renderWithEffects(<MockApp />);
    await waitFor(async () => {
      expect(rendered.baseElement).toBeInTheDocument();
      expect(rendered.getByTestId('isLoadingFinished')).toBeInTheDocument();
      expect(() =>
        within(rendered.getByTestId('dynamicRoutes')).getByText('/foo'),
      ).toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Plugin doesnt.exist is not configured properly: PluginRoot.default not found, ignoring dynamicRoute: "/foo"',
      );
    });
  });

  it('should render with one dynamicRoute with nonexistent importName', async () => {
    process.env = mockProcessEnv({
      'foo.bar': {
        dynamicRoutes: [{ path: '/foo', importName: 'BarComponent' }],
      },
    });
    const rendered = await renderWithEffects(<MockApp />);
    await waitFor(async () => {
      expect(rendered.baseElement).toBeInTheDocument();
      expect(rendered.getByTestId('isLoadingFinished')).toBeInTheDocument();
      expect(() =>
        within(rendered.getByTestId('dynamicRoutes')).getByText('/foo'),
      ).toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Plugin foo.bar is not configured properly: PluginRoot.BarComponent not found, ignoring dynamicRoute: "/foo"',
      );
    });
  });

  it('should render with one dynamicRoute with nonexistent module', async () => {
    process.env = mockProcessEnv({
      'foo.bar': { dynamicRoutes: [{ path: '/foo', module: 'BarPlugin' }] },
    });
    const rendered = await renderWithEffects(<MockApp />);
    await waitFor(async () => {
      expect(rendered.baseElement).toBeInTheDocument();
      expect(rendered.getByTestId('isLoadingFinished')).toBeInTheDocument();
      expect(() =>
        within(rendered.getByTestId('dynamicRoutes')).getByText('/foo'),
      ).toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Plugin foo.bar is not configured properly: BarPlugin.default not found, ignoring dynamicRoute: "/foo"',
      );
    });
  });

  it('should render with one mountPoint with single component', async () => {
    process.env = mockProcessEnv({
      'foo.bar': { mountPoints: [{ mountPoint: 'a.b.c/cards' }] },
    });
    const rendered = await renderWithEffects(<MockApp />);
    await waitFor(async () => {
      expect(rendered.baseElement).toBeInTheDocument();
      expect(rendered.getByTestId('isLoadingFinished')).toBeInTheDocument();
      expect(
        within(rendered.getByTestId('mountPoints')).getByText('a.b.c/cards: 1'),
      ).toBeInTheDocument();
    });
  });

  it('should render with one mountPoint with two components', async () => {
    process.env = mockProcessEnv({
      'foo.bar': {
        mountPoints: [
          { mountPoint: 'a.b.c/cards' },
          { mountPoint: 'a.b.c/cards' },
        ],
      },
    });
    const rendered = await renderWithEffects(<MockApp />);
    await waitFor(async () => {
      expect(rendered.baseElement).toBeInTheDocument();
      expect(rendered.getByTestId('isLoadingFinished')).toBeInTheDocument();
      expect(
        within(rendered.getByTestId('mountPoints')).getByText('a.b.c/cards: 2'),
      ).toBeInTheDocument();
    });
  });

  it("should render with one mountPoint with two components where one importName doesn't exist", async () => {
    process.env = mockProcessEnv({
      'foo.bar': {
        mountPoints: [
          { mountPoint: 'a.b.c/cards' },
          { mountPoint: 'a.b.c/cards', importName: 'BarComponent' },
        ],
      },
    });
    const rendered = await renderWithEffects(<MockApp />);
    await waitFor(async () => {
      expect(rendered.baseElement).toBeInTheDocument();
      expect(rendered.getByTestId('isLoadingFinished')).toBeInTheDocument();
      expect(
        within(rendered.getByTestId('mountPoints')).getByText('a.b.c/cards: 1'),
      ).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Plugin foo.bar is not configured properly: PluginRoot.BarComponent not found, ignoring mountPoint: "a.b.c/cards"',
      );
    });
  });

  it('should render with one mountPoint with config.if === true', async () => {
    process.env = mockProcessEnv({
      'foo.bar': {
        mountPoints: [
          {
            mountPoint: 'a.b.c/cards',
            config: { if: { allOf: ['isFooConditionTrue'] } },
          },
        ],
      },
    });
    const rendered = await renderWithEffects(<MockApp />);
    await waitFor(async () => {
      expect(rendered.baseElement).toBeInTheDocument();
      expect(rendered.getByTestId('isLoadingFinished')).toBeInTheDocument();
      expect(
        within(rendered.getByTestId('mountPointsIfs')).getByText(
          'a.b.c/cards: true',
        ),
      ).toBeInTheDocument();
    });
  });

  it('should render with one mountPoint with config.if === false', async () => {
    process.env = mockProcessEnv({
      'foo.bar': {
        mountPoints: [
          {
            mountPoint: 'a.b.c/cards',
            config: { if: { allOf: ['isFooConditionFalse'] } },
          },
        ],
      },
    });
    const rendered = await renderWithEffects(<MockApp />);
    await waitFor(async () => {
      expect(rendered.baseElement).toBeInTheDocument();
      expect(rendered.getByTestId('isLoadingFinished')).toBeInTheDocument();
      expect(
        within(rendered.getByTestId('mountPointsIfs')).getByText(
          'a.b.c/cards: false',
        ),
      ).toBeInTheDocument();
    });
  });

  it("should render with one mountPoint with config.if where importName doesn't exist", async () => {
    process.env = mockProcessEnv({
      'foo.bar': {
        mountPoints: [
          {
            mountPoint: 'a.b.c/cards',
            config: { if: { allOf: ['isBarConditionTrue'] } },
          },
        ],
      },
    });
    const rendered = await renderWithEffects(<MockApp />);
    await waitFor(async () => {
      expect(rendered.baseElement).toBeInTheDocument();
      expect(rendered.getByTestId('isLoadingFinished')).toBeInTheDocument();
      expect(
        within(rendered.getByTestId('mountPointsIfs')).getByText(
          'a.b.c/cards: false',
        ),
      ).toBeInTheDocument();
    });
  });

  it('should render with two mountPoints with one component each', async () => {
    process.env = mockProcessEnv({
      'foo.bar': {
        mountPoints: [
          { mountPoint: 'a.b.c/cards' },
          { mountPoint: 'x.y.z/cards' },
        ],
      },
    });
    const rendered = await renderWithEffects(<MockApp />);
    await waitFor(async () => {
      expect(rendered.baseElement).toBeInTheDocument();
      expect(rendered.getByTestId('isLoadingFinished')).toBeInTheDocument();
      expect(
        within(rendered.getByTestId('mountPoints')).getByText(
          'a.b.c/cards: 1, x.y.z/cards: 1',
        ),
      ).toBeInTheDocument();
    });
  });

  it('should render with one mountPoint from nonexistent plugin', async () => {
    process.env = mockProcessEnv({
      'doesnt.exist': { mountPoints: [{ mountPoint: 'a.b.c/cards' }] },
    });
    const rendered = await renderWithEffects(<MockApp />);
    await waitFor(async () => {
      expect(rendered.baseElement).toBeInTheDocument();
      expect(rendered.getByTestId('isLoadingFinished')).toBeInTheDocument();
      expect(() =>
        within(rendered.getByTestId('mountPoints')).getByText('a.b.c/cards: 1'),
      ).toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Plugin doesnt.exist is not configured properly: PluginRoot.default not found, ignoring mountPoint: "a.b.c/cards"',
      );
    });
  });

  it('should render with one mountPoint with nonexistent importName', async () => {
    process.env = mockProcessEnv({
      'doesnt.exist': {
        mountPoints: [
          { mountPoint: 'a.b.c/cards', importName: 'BarComponent' },
        ],
      },
    });
    const rendered = await renderWithEffects(<MockApp />);
    await waitFor(async () => {
      expect(rendered.baseElement).toBeInTheDocument();
      expect(rendered.getByTestId('isLoadingFinished')).toBeInTheDocument();
      expect(() =>
        within(rendered.getByTestId('mountPoints')).getByText('a.b.c/cards: 1'),
      ).toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Plugin doesnt.exist is not configured properly: PluginRoot.BarComponent not found, ignoring mountPoint: "a.b.c/cards"',
      );
    });
  });

  it('should render with one mountPoint with nonexistent module', async () => {
    process.env = mockProcessEnv({
      'doesnt.exist': {
        mountPoints: [{ mountPoint: 'a.b.c/cards', module: 'BarPlugin' }],
      },
    });
    const rendered = await renderWithEffects(<MockApp />);
    await waitFor(async () => {
      expect(rendered.baseElement).toBeInTheDocument();
      expect(rendered.getByTestId('isLoadingFinished')).toBeInTheDocument();
      expect(() =>
        within(rendered.getByTestId('mountPoints')).getByText('a.b.c/cards: 1'),
      ).toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Plugin doesnt.exist is not configured properly: BarPlugin.default not found, ignoring mountPoint: "a.b.c/cards"',
      );
    });
  });

  it('should render with one appIcon', async () => {
    process.env = mockProcessEnv({
      'foo.bar': { appIcons: [{ name: 'fooIcon' }] },
    });
    const rendered = await renderWithEffects(<MockApp />);
    await waitFor(async () => {
      expect(rendered.baseElement).toBeInTheDocument();
      expect(rendered.getByTestId('isLoadingFinished')).toBeInTheDocument();
      expect(
        within(rendered.getByTestId('appIcons')).getByText(/fooIcon/),
      ).toBeInTheDocument();
    });
  });

  it('should render with two appIcons', async () => {
    process.env = mockProcessEnv({
      'foo.bar': { appIcons: [{ name: 'fooIcon' }, { name: 'foo2Icon' }] },
    });
    const rendered = await renderWithEffects(<MockApp />);
    await waitFor(async () => {
      expect(rendered.baseElement).toBeInTheDocument();
      expect(rendered.getByTestId('isLoadingFinished')).toBeInTheDocument();
      expect(
        within(rendered.getByTestId('appIcons')).getByText(/fooIcon/),
      ).toBeInTheDocument();
      expect(
        within(rendered.getByTestId('appIcons')).getByText(/foo2Icon/),
      ).toBeInTheDocument();
    });
  });

  it('should render with one appIcon from nonexistent plugin', async () => {
    process.env = mockProcessEnv({
      'doesnt.exist': { appIcons: [{ name: 'fooIcon' }] },
    });
    const rendered = await renderWithEffects(<MockApp />);
    await waitFor(async () => {
      expect(rendered.baseElement).toBeInTheDocument();
      expect(rendered.getByTestId('isLoadingFinished')).toBeInTheDocument();
      expect(() =>
        within(rendered.getByTestId('appIcons')).getByText(/fooIcon/),
      ).toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Plugin doesnt.exist is not configured properly: PluginRoot.default not found, ignoring appIcon: fooIcon',
      );
    });
  });
});
