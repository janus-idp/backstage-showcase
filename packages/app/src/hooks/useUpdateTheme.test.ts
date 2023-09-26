import { renderHook } from '@testing-library/react-hooks';
import { useApi } from '@backstage/core-plugin-api';
import { useUpdateTheme } from './useUpdateTheme';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

describe('useUpdateTheme', () => {
  it('returns the primaryColor when config is available', () => {
    (useApi as any).mockReturnValue({
      getOptionalString: jest.fn().mockReturnValue('blue'),
    });

    const { result } = renderHook(() => useUpdateTheme('someTheme'));
    expect(result.current.primaryColor).toBe('blue');
  });

  it('returns undefined when config is unavailable', () => {
    // Mock the useApi function to throw an error (simulate unavailable config)
    (useApi as any).mockImplementation(
      jest.fn(() => {
        throw new Error('Custom hook error');
      }),
    );

    const { result } = renderHook(() => useUpdateTheme('someTheme'));
    expect(result.current.primaryColor).toBeUndefined();
  });
});
