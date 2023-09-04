import React from 'react';
import { ThemeProvider } from '@material-ui/core';
import { lightTheme } from '@backstage/theme';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  setupRequestMockHandlers,
  renderInTestApp,
} from '@backstage/test-utils';
import { TeamcityLogPage } from './TeamcityLogPage';

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

describe('TeamcityLogPage', () => {
  const server = setupServer();
  // Enable sane handlers for network requests
  setupRequestMockHandlers(server);

  // setup mock response
  beforeEach(() => {
    server.use(
      rest.get('/*', (_, res, ctx) => res(ctx.status(200), ctx.json({}))),
    );
  });

  it('should render with missing config error', async () => {
    const rendered = await renderInTestApp(
      <ThemeProvider theme={lightTheme}>
        <TeamcityLogPage />
      </ThemeProvider>,
    );
    expect(
      rendered.getByText("Missing required config value at 'backend.baseUrl'"),
    ).toBeInTheDocument();
  });
});
