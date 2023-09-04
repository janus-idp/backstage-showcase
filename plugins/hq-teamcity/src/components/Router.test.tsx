import React from 'react';
import { Router } from './Router';
import { ThemeProvider } from '@material-ui/core';
import { lightTheme } from '@backstage/theme';
import { setupServer } from 'msw/node';
import {
  setupRequestMockHandlers,
  renderInTestApp,
} from '@backstage/test-utils';

jest.mock('@backstage/plugin-catalog-react', () => {
  return {
    useEntity: jest.fn(() => ({
      metadata: {
        annotations: {
          'teamcity/project-id': 'test',
        },
      },
    })),
  };
});

jest.mock('../routes', () => {
  return {
    isTeamcityAvailable: jest.fn(() => {
      return false;
    }),
  };
});

jest.mock('../plugin', () => {
  return {
    buildRouteRef: {
      path: '/',
    },
    buildLogsRouteRef: {
      path: '/',
    },
  };
});

describe('Router', () => {
  const server = setupServer();
  setupRequestMockHandlers(server);

  it('should render with missing annotation error message', async () => {
    const rendered = await renderInTestApp(
      <ThemeProvider theme={lightTheme}>
        <Router />
      </ThemeProvider>,
    );
    expect(rendered.getByText('Missing Annotation')).toBeInTheDocument();
  });
});
