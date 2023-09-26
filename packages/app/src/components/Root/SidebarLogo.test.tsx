import React from 'react';
import { render } from '@testing-library/react';
import { useSidebarOpenState } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { BrowserRouter } from 'react-router-dom';
import { SidebarLogo } from './SidebarLogo';

jest.mock('@backstage/core-components', () => ({
  ...jest.requireActual('@backstage/core-components'),
  useSidebarOpenState: jest.fn(),
}));

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

jest.mock('./LogoFull.tsx', () => () => (
  <svg data-testid="default-full-logo" />
));
jest.mock('./LogoIcon.tsx', () => () => (
  <svg data-testid="default-icon-logo" />
));

describe('SidebarLogo', () => {
  it('when sidebar is open renders the component with full logo base64 provided by config', () => {
    (useApi as any).mockReturnValue({
      getOptionalString: jest.fn().mockReturnValue('fullLogoBase64URI'),
    });

    (useSidebarOpenState as any).mockReturnValue({ isOpen: true });
    const { getByTestId } = render(
      <BrowserRouter>
        <SidebarLogo />
      </BrowserRouter>,
    );

    const fullLogo = getByTestId('home-logo');
    expect(fullLogo).toBeInTheDocument();
    expect(fullLogo).toHaveAttribute('src', 'fullLogoBase64URI'); // Check the expected attribute value
  });

  it('when sidebar is open renders the component with default full logo if config is undefined', () => {
    (useApi as any).mockReturnValue({
      getOptionalString: jest.fn().mockReturnValue(undefined),
    });

    (useSidebarOpenState as any).mockReturnValue({ isOpen: true });
    const { getByTestId } = render(
      <BrowserRouter>
        <SidebarLogo />
      </BrowserRouter>,
    );

    expect(getByTestId('default-full-logo')).toBeInTheDocument();
  });

  it('when sidebar is closed renders the component with icon logo base64 provided by config', () => {
    (useApi as any).mockReturnValue({
      getOptionalString: jest.fn().mockReturnValue('iconLogoBase64URI'),
    });

    (useSidebarOpenState as any).mockReturnValue({ isOpen: false });
    const { getByTestId } = render(
      <BrowserRouter>
        <SidebarLogo />
      </BrowserRouter>,
    );

    const fullLogo = getByTestId('home-logo');
    expect(fullLogo).toBeInTheDocument();
    expect(fullLogo).toHaveAttribute('src', 'iconLogoBase64URI');
  });

  it('when sidebar is closed renders the component with icon logo from default if not provided with config', () => {
    (useApi as any).mockReturnValue({
      getOptionalString: jest.fn().mockReturnValue(undefined),
    });

    (useSidebarOpenState as any).mockReturnValue({ isOpen: false });
    const { getByTestId } = render(
      <BrowserRouter>
        <SidebarLogo />
      </BrowserRouter>,
    );

    expect(getByTestId('default-icon-logo')).toBeInTheDocument();
  });
});
