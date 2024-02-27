import React from 'react';
import { render, screen } from '@testing-library/react';
import * as pluginPermission from '@backstage/plugin-permission-react';
import { AdminTabs } from './AdminTabs';
import { AdminPage } from './AdminPage';
import Loader from '../DynamicRoot/Loader';

jest.mock('@backstage/plugin-permission-react', () => ({
  __esModule: true,
  ...jest.requireActual('@backstage/plugin-permission-react'),
}));

jest.mock('./AdminTabs', () => ({
  AdminTabs: jest.fn().mockImplementation(({ tabs }) => (
    <div data-testid="mockAdminTabs">
      {tabs.map((tab: { id: string; label: string }) => (
        <div key={tab.id}>{tab.label}</div>
      ))}
    </div>
  )),
}));

jest.mock('../DynamicRoot/Loader', () =>
  jest
    .fn()
    .mockImplementation(() => <div data-testid="mockLoader">Loading</div>),
);

const mockedAdminTabs = AdminTabs as jest.MockedFunction<typeof AdminTabs>;
const mockedLoader = Loader as jest.MockedFunction<typeof Loader>;

describe('AdminPage', () => {
  const mockUsePermission = jest.spyOn(pluginPermission, 'usePermission');

  it('should display loader while loading permissions', () => {
    mockUsePermission.mockReturnValue({ loading: true, allowed: false });

    render(<AdminPage />);

    expect(mockedLoader).toHaveBeenCalled();
    expect(mockedAdminTabs).not.toHaveBeenCalled();

    expect(screen.queryByText('RBAC')).not.toBeInTheDocument();
    expect(screen.queryByText('Plugins')).not.toBeInTheDocument();
  });

  it('should display only plugins tab when RBAC is not allowed', async () => {
    mockUsePermission.mockReturnValue({ loading: false, allowed: false });

    render(<AdminPage />);
    expect(mockedAdminTabs).toHaveBeenCalledWith(
      expect.objectContaining({
        tabs: expect.arrayContaining([
          expect.objectContaining({ id: 'plugins' }),
        ]),
      }),
      expect.anything(),
    );

    expect(screen.queryByText('Plugins')).toBeInTheDocument();
    expect(screen.queryByText('RBAC')).not.toBeInTheDocument();
  });

  it('should display both RBAC and plugins tabs when RBAC is allowed', async () => {
    mockUsePermission.mockReturnValue({ loading: false, allowed: true });

    render(<AdminPage />);

    expect(mockedAdminTabs).toHaveBeenCalledWith(
      expect.objectContaining({
        tabs: expect.arrayContaining([
          expect.objectContaining({ id: 'plugins' }),
          expect.objectContaining({ id: 'rbac' }),
        ]),
      }),
      expect.anything(),
    );

    expect(screen.queryByText('Plugins')).toBeInTheDocument();
    expect(screen.queryByText('RBAC')).toBeInTheDocument();
  });
});
