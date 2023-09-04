import React from 'react';
import { TeamcitySource } from './TeamcitySource';
import { ThemeProvider } from '@material-ui/core';
import { lightTheme } from '@backstage/theme';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  setupRequestMockHandlers,
  renderInTestApp,
} from '@backstage/test-utils';

describe('TeamcitySource', () => {
  const server = setupServer();
  // Enable sane handlers for network requests
  setupRequestMockHandlers(server);

  // setup mock response
  beforeEach(() => {
    server.use(
      rest.get('/*', (_, res, ctx) => res(ctx.status(200), ctx.json({}))),
    );
  });

  it('should render with just branch name', async () => {
    const rendered = await renderInTestApp(
      <ThemeProvider theme={lightTheme}>
        <TeamcitySource branchName="main" />
      </ThemeProvider>,
    );
    expect(rendered.getByText('main')).toBeInTheDocument();
  });

  it('should render with link', async () => {
    const rendered = await renderInTestApp(
      <ThemeProvider theme={lightTheme}>
        <TeamcitySource
          branchName="main"
          revision={{
            version: '123456789',
            'vcs-root-instance': {
              name: 'https://github.com/Weyn/backstage-teamcity#refs/heads/master',
            },
          }}
        />
      </ThemeProvider>,
    );
    expect(rendered.getByText('main').closest('a')).toHaveAttribute(
      'href',
      'https://github.com/Weyn/backstage-teamcity#refs/heads/master',
    );
    expect(rendered.getByText('(12345678)').closest('a')).toHaveAttribute(
      'href',
      'https://github.com/Weyn/backstage-teamcity/commit/123456789',
    );
  });

  it('should render without link', async () => {
    const rendered = await renderInTestApp(
      <ThemeProvider theme={lightTheme}>
        <TeamcitySource branchName="main" revision={{ version: '123456789' }} />
      </ThemeProvider>,
    );
    expect(rendered.getByText('main (123456789)')).toBeInTheDocument();
  });
});
