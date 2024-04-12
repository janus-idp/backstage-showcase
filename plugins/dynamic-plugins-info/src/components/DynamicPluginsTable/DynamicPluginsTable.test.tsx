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
    expect(await findByText('Installed Plugins (6)')).toBeInTheDocument();
    expect(await findByText('some-plugin-five')).toBeInTheDocument();
    const nameCells = Array.from(
      container.querySelectorAll('tbody tr > td:first-child'),
    );
    const versionCells = Array.from(
      container.querySelectorAll('tbody tr > td:nth-child(2)'),
    );
    expect(nameCells.length).toBe(5);
    expect(nameCells[0].textContent).toBe('some-plugin-five');
    expect(nameCells[4].textContent).toBe('some-plugin-three');
    expect(versionCells[0].textContent).toBe('1.2.0');
    expect(versionCells[4].textContent).toBe('0.1.2');
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
    expect(nameCells[0].textContent).toBe('some-plugin-five');
    expect(nameCells[1].textContent).toBe('some-plugin-four');
  });

  it('supports sorting by name and version columns', async () => {
    const { findByText, container } = await renderWithEffects(
      <DynamicPluginsTable />,
    );
    // descending by name
    let nameCells = Array.from(
      container.querySelectorAll('tbody tr > td:first-child'),
    );
    let versionCells = Array.from(
      container.querySelectorAll('tbody tr > td:nth-child(2)'),
    );
    expect(nameCells.length).toBe(5);
    expect(nameCells[0].textContent).toBe('some-plugin-five');
    expect(nameCells[4].textContent).toBe('some-plugin-three');
    expect(versionCells[0].textContent).toBe('1.2.0');
    expect(versionCells[4].textContent).toBe('0.1.2');
    await act(() => findByText('Name').then(el => el.click()));
    // ascending by name
    nameCells = Array.from(
      container.querySelectorAll('tbody tr > td:first-child'),
    );
    versionCells = Array.from(
      container.querySelectorAll('tbody tr > td:nth-child(2)'),
    );
    expect(nameCells.length).toBe(5);
    expect(nameCells[0].textContent).toBe('some-plugin-two');
    expect(nameCells[4].textContent).toBe('some-plugin-four');
    expect(versionCells[0].textContent).toBe('1.1.0');
    expect(versionCells[4].textContent).toBe('1.1.0');
    // ascending by version
    await act(() => findByText('Version').then(el => el.click()));
    nameCells = Array.from(
      container.querySelectorAll('tbody tr > td:first-child'),
    );
    versionCells = Array.from(
      container.querySelectorAll('tbody tr > td:nth-child(2)'),
    );
    expect(nameCells.length).toBe(5);
    expect(nameCells[0].textContent).toBe('some-plugin-five');
    expect(nameCells[4].textContent).toBe('some-plugin-three');
    expect(versionCells[0].textContent).toBe('1.2.0');
    expect(versionCells[4].textContent).toBe('0.1.2');
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
    expect(nameCells.length).toBe(6);
  });
});
