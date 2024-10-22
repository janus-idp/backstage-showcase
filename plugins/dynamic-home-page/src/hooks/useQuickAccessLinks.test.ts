import { useApi } from '@backstage/core-plugin-api';

import { renderHook, waitFor } from '@testing-library/react';

import { useQuickAccessLinks } from './useQuickAccessLinks';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

describe('useQuickAccessLinks', () => {
  const quickAccessData = [
    {
      title: 'Community',
      isExpanded: false,
      links: [
        {
          iconUrl: '/homepage/icons/icons8/web.png',
          label: 'Website',
          url: 'https://janus-idp.io/community',
        },
      ],
    },
  ];
  beforeEach(() => {
    (useApi as jest.Mock).mockReturnValue({
      getQuickAccessLinks: jest.fn(() => Promise.resolve(quickAccessData)),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return homepage data if no prop is provided', async () => {
    const { result } = renderHook(() => useQuickAccessLinks());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data).toStrictEqual(quickAccessData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  it('should return homepage data if prop is provided', async () => {
    const { result } = renderHook(() => useQuickAccessLinks());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data).toStrictEqual(quickAccessData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  it('handles API error properly', async () => {
    (useApi as jest.Mock).mockReturnValue({
      getQuickAccessLinks: jest.fn(() =>
        Promise.reject(new Error('API Error')),
      ),
    });

    jest
      .spyOn(global, 'fetch')
      .mockImplementationOnce(() =>
        Promise.reject(new Error('Fallback data fetch Error')),
      );

    const { result } = renderHook(() => useQuickAccessLinks());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toEqual(
        new Error('Fallback data fetch Error'),
      );
    });
  });

  it('fetches home page data from fallback if API fails', async () => {
    const homePageDataFallback = [
      {
        title: 'Community Link',
        isExpanded: false,
        links: [
          {
            iconUrl: '/homepage/icons/icons8/web.png',
            label: 'Website',
            url: 'https://janus-idp.io/community',
          },
        ],
      },
    ];
    (useApi as jest.Mock).mockReturnValue({
      getQuickAccessLinks: jest.fn(() =>
        Promise.reject(new Error('API Error')),
      ),
    });

    jest
      .spyOn(global, 'fetch')
      .mockImplementationOnce(() =>
        Promise.resolve(new Response(JSON.stringify(homePageDataFallback))),
      );

    const { result } = renderHook(() => useQuickAccessLinks());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data).toStrictEqual(homePageDataFallback);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
