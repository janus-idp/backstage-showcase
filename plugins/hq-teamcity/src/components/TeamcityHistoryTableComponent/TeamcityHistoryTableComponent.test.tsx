import React from 'react';
import { ThemeProvider } from '@material-ui/core';
import { lightTheme } from '@backstage/theme';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  setupRequestMockHandlers,
  renderInTestApp,
} from '@backstage/test-utils';
import { TeamcityHistoryTableComponent } from './TeamcityHistoryTableComponent';

describe('TeamcityHistoryTableComponent', () => {
  const server = setupServer();
  // Enable sane handlers for network requests
  setupRequestMockHandlers(server);

  // setup mock response
  beforeEach(() => {
    server.use(
      rest.get('/*', (_, res, ctx) => res(ctx.status(200), ctx.json({}))),
    );
  });

  it('should render with empty table', async () => {
    const rendered = await renderInTestApp(
      <ThemeProvider theme={lightTheme}>
        <TeamcityHistoryTableComponent builds={[]} />
      </ThemeProvider>,
    );
    expect(rendered.getByText('Source')).toBeInTheDocument();
    expect(rendered.getByText('Status')).toBeInTheDocument();
    expect(rendered.getByText('Finished At')).toBeInTheDocument();
    expect(rendered.getByText('Url')).toBeInTheDocument();
    expect(rendered.getByText('No records to display')).toBeInTheDocument();
  });
});
