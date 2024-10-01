import React from 'react';

import { renderWithEffects } from '@backstage/test-utils';

import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { listLoadedPluginsResult } from '../../__fixtures__/listLoadedPluginsResult';
import { DynamicPluginsTable } from './DynamicPluginsTable';

jest.mock('@backstage/core-plugin-api', () => {
  const actual = jest.requireActual('@backstage/core-plugin-api');
  return {
    ...actual,
    useApi: () => {
      return {
        listLoadedPlugins: async () => {
          return Promise.resolve(listLoadedPluginsResult);
        },
      };
    },
  };
});

describe('DynamicPluginsTable', () => {
  it('should render a list of plugins sorted by name', async () => {
    const { findByText, container } = await renderWithEffects(
      <DynamicPluginsTable />,
    );
    // 6 mockapi returned external(enabled) + 53 internal(not enabled)
    // mockapi returns enabled plugins
    // keys from InternalPluginsMap are internal plugins

    expect(await findByText('Plugins (61)')).toBeInTheDocument();
    expect(
      await findByText('@janus-idp/backstage-plugin-aap-backend-dynamic'),
    ).toBeInTheDocument();
    const nameCells = Array.from(
      container.querySelectorAll('tbody tr > td:first-child'),
    );
    const versionCells = Array.from(
      container.querySelectorAll('tbody tr > td:nth-child(2)'),
    );
    const enabledCells = Array.from(
      container.querySelectorAll('tbody tr > td:nth-child(3)'),
    );
    const internalCells = Array.from(
      container.querySelectorAll('tbody tr > td:nth-child(4)'),
    );
    expect(nameCells.length).toBe(5);
    expect(nameCells[0].textContent).toBe(
      '@janus-idp/backstage-plugin-aap-backend-dynamic',
    );
    expect(nameCells[2].textContent).toBe(
      '@janus-idp/backstage-plugin-bulk-import',
    );
    expect(versionCells[0].textContent).toBe('');
    expect(versionCells[2].textContent).toBe('');
    expect(enabledCells[0].textContent).toBe('No');
    expect(enabledCells[2].textContent).toBe('No');
    expect(internalCells[0].textContent).toBe('Yes');
    expect(internalCells[2].textContent).toBe('Yes');
  });

  it('supports filtering by a simple text search', async () => {
    const user = userEvent.setup({ delay: 300 });
    const { container } = await renderWithEffects(<DynamicPluginsTable />);
    const filterInput = container.querySelector('input[placeholder="Filter"]')!;
    expect(filterInput).toBeDefined();
    await act(() => user.type(filterInput, 'plugin-f\n'));
    const nameCells = Array.from(
      container.querySelectorAll('tbody tr > td:first-child'),
    );
    expect(nameCells.length).toBe(2);
    expect(nameCells[0].textContent).toBe('api-returned-some-plugin-five');
    expect(nameCells[1].textContent).toBe('api-returned-some-plugin-four');
  });

  it('supports sorting by name, version and rhdh embedded columns', async () => {
    const { findByText, container } = await renderWithEffects(
      <DynamicPluginsTable />,
    );
    // descending by name
    let nameCells = Array.from(
      container.querySelectorAll('tbody tr > td:first-child'),
    );
    expect(nameCells.length).toBe(5);
    expect(nameCells[0].textContent).toBe(
      '@janus-idp/backstage-plugin-aap-backend-dynamic',
    );
    expect(nameCells[2].textContent).toBe(
      '@janus-idp/backstage-plugin-bulk-import',
    );
    await act(() => findByText('Name').then(el => el.click()));
    // ascending by name
    nameCells = Array.from(
      container.querySelectorAll('tbody tr > td:first-child'),
    );
    expect(nameCells.length).toBe(5);
    expect(nameCells[0].textContent).toBe(
      'roadiehq-scaffolder-backend-module-utils-dynamic',
    );
    expect(nameCells[4].textContent).toBe('roadiehq-backstage-plugin-jira');
    // ascending by version
    await act(() => findByText('Version').then(el => el.click()));
    nameCells = Array.from(
      container.querySelectorAll('tbody tr > td:first-child'),
    );
    expect(nameCells.length).toBe(5);
    expect(nameCells[0].textContent).toBe('api-returned-some-plugin-five');
    expect(nameCells[4].textContent).toBe('api-returned-some-plugin-three');

    // ascending by enabled
    await act(() => findByText('Enabled').then(el => el.click()));
    nameCells = Array.from(
      container.querySelectorAll('tbody tr > td:first-child'),
    );
    expect(nameCells.length).toBe(5);
    expect(nameCells[0].textContent).toBe('api-returned-some-plugin-six');
    expect(nameCells[4].textContent).toBe('api-returned-some-plugin-two');

    // ascending by Preinstalled
    await act(() => findByText('Preinstalled').then(el => el.click()));
    nameCells = Array.from(
      container.querySelectorAll('tbody tr > td:first-child'),
    );
    expect(nameCells.length).toBe(5);
    expect(nameCells[0].textContent).toBe(
      '@janus-idp/backstage-plugin-analytics-provider-segment',
    );
    expect(nameCells[4].textContent).toBe(
      '@janus-idp/backstage-plugin-jfrog-artifactory',
    );
  });

  it('supports changing the number of items per page', async () => {
    const { findByText, container } = await renderWithEffects(
      <DynamicPluginsTable />,
    );
    let nameCells = Array.from(
      container.querySelectorAll('tbody tr > td:first-child'),
    );
    expect(nameCells.length).toBe(5);
    await act(async () => {
      const select = await findByText('5 rows');
      fireEvent.mouseDown(select);
    });
    await act(() => screen.findByText('10').then(el => el.click()));
    nameCells = Array.from(
      container.querySelectorAll('tbody tr > td:first-child'),
    );
    expect(nameCells.length).toBe(10);
  });
});
