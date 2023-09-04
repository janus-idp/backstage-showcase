import React from 'react';
import { DenseTable, TeamcityTableComponent } from './TeamcityTableComponent';
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

describe('TeamcityTableComponent', () => {
  const server = setupServer();
  setupRequestMockHandlers(server);

  it('should render with missing config error message', async () => {
    const rendered = await renderInTestApp(
      <ThemeProvider theme={lightTheme}>
        <TeamcityTableComponent />
      </ThemeProvider>,
    );
    expect(
      rendered.getByText("Missing required config value at 'backend.baseUrl'"),
    ).toBeInTheDocument();
  });

  it('should render with empty table', async () => {
    const rendered = await renderInTestApp(
      <ThemeProvider theme={lightTheme}>
        <DenseTable builds={[]} />
      </ThemeProvider>,
    );
    expect(rendered.getByText('Name')).toBeInTheDocument();
    expect(rendered.getByText('Source')).toBeInTheDocument();
    expect(rendered.getByText('Status')).toBeInTheDocument();
    expect(rendered.getByText('Finished At')).toBeInTheDocument();
    expect(rendered.getByText('Url')).toBeInTheDocument();
    expect(rendered.getByText('No records to display')).toBeInTheDocument();
  });
});
