import React from 'react';
import { GitHubCommitLink } from './GitHubCommitLink';
import { ThemeProvider } from '@material-ui/core';
import { lightTheme } from '@backstage/theme';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  setupRequestMockHandlers,
  renderInTestApp,
} from '@backstage/test-utils';

describe('GitHubCommitLink', () => {
  const server = setupServer();
  // Enable sane handlers for network requests
  setupRequestMockHandlers(server);

  // setup mock response
  beforeEach(() => {
    server.use(
      rest.get('/*', (_, res, ctx) => res(ctx.status(200), ctx.json({}))),
    );
  });

  it('should render with empty params', async () => {
    const rendered = await renderInTestApp(
      <ThemeProvider theme={lightTheme}>
        <GitHubCommitLink />
      </ThemeProvider>,
    );
    expect(rendered.getByText('')).toBeInTheDocument();
  });

  it('should render with revision without link', async () => {
    const rendered = await renderInTestApp(
      <ThemeProvider theme={lightTheme}>
        <GitHubCommitLink revision="1234567890" />
      </ThemeProvider>,
    );
    expect(rendered.getByText('(12345678)')).toBeInTheDocument();
  });

  it('should render with revision with link', async () => {
    const rendered = await renderInTestApp(
      <ThemeProvider theme={lightTheme}>
        <GitHubCommitLink
          revision="1234567890"
          repoUrl="https://github.com/Weyn/backstage-teamcity"
        />
      </ThemeProvider>,
    );
    expect(rendered.getByText('(12345678)').closest('a')).toHaveAttribute(
      'href',
      'https://github.com/Weyn/backstage-teamcity/commit/1234567890',
    );
  });

  it('should render with revision with no link when its not github', async () => {
    const rendered = await renderInTestApp(
      <ThemeProvider theme={lightTheme}>
        <GitHubCommitLink revision="1234567890" repoUrl="https://git.com" />
      </ThemeProvider>,
    );
    expect(rendered.getByText('(12345678)').closest('a')).toHaveAttribute(
      'href',
      'https://git.com/commit/1234567890',
    );
  });

  it('should render revision with link (removing ref)', async () => {
    const rendered = await renderInTestApp(
      <ThemeProvider theme={lightTheme}>
        <GitHubCommitLink
          revision="1234567890"
          repoUrl="https://github.com/Weyn/backstage-teamcity#refs/heads/master"
        />
      </ThemeProvider>,
    );
    expect(rendered.getByText('(12345678)').closest('a')).toHaveAttribute(
      'href',
      'https://github.com/Weyn/backstage-teamcity/commit/1234567890',
    );
  });
});
