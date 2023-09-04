import React from 'react';
import { TeamcityStatus } from './TeamcityStatus';
import { ThemeProvider } from '@material-ui/core';
import { lightTheme } from '@backstage/theme';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  setupRequestMockHandlers,
  renderInTestApp,
} from '@backstage/test-utils';

describe('TeamcityStatus', () => {
  const server = setupServer();
  // Enable sane handlers for network requests
  setupRequestMockHandlers(server);

  // setup mock response
  beforeEach(() => {
    server.use(
      rest.get('/*', (_, res, ctx) => res(ctx.status(200), ctx.json({}))),
    );
  });

  it('should render with just text', async () => {
    const rendered = await renderInTestApp(
      <ThemeProvider theme={lightTheme}>
        <TeamcityStatus status="" statusText="success" />
      </ThemeProvider>,
    );
    expect(rendered.getByText('success')).toBeInTheDocument();
    expect(rendered.container.querySelector('svg')).toBeNull();
  });

  it('should render with text and success icon', async () => {
    const rendered = await renderInTestApp(
      <ThemeProvider theme={lightTheme}>
        <TeamcityStatus status="SUCCESS" statusText="success" />
      </ThemeProvider>,
    );
    expect(rendered.getByText('success')).toBeInTheDocument();
    expect(rendered.container.querySelector('svg')).toBeInTheDocument();
  });

  it('should render with text and failure icon', async () => {
    const rendered = await renderInTestApp(
      <ThemeProvider theme={lightTheme}>
        <TeamcityStatus status="FAILURE" statusText="success" />
      </ThemeProvider>,
    );
    expect(rendered.getByText('success')).toBeInTheDocument();
    expect(rendered.container.querySelector('svg')).toBeInTheDocument();
  });

  it('should render with text and no icon', async () => {
    const rendered = await renderInTestApp(
      <ThemeProvider theme={lightTheme}>
        <TeamcityStatus status="RANDOM" statusText="success" />
      </ThemeProvider>,
    );
    expect(rendered.getByText('success')).toBeInTheDocument();
    expect(rendered.container.querySelector('svg')).toBeNull();
  });
});
