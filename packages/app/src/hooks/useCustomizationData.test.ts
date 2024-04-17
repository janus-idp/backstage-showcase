import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from '@backstage/core-plugin-api';
import { useCustomizationData } from './useCustomizationData';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

describe('useCustomizationData', () => {
  const learningPathData = [
    {
      paths: 6,
      minutes: 20,
      description:
        'Learn about k8s API fundamentals and the etcd operator, as well as how to use the Operator SDK with Go and Helm, review Ansible basics, and use Ansible to deploy Kubernetes modules.',
      label: 'Building Operators on OpenShift',
      url: 'https://developers.redhat.com/learn/openshift/operators',
    },
    {
      paths: 3,
      minutes: 20,
      description:
        'For the best experience in this learning path, we suggest that you complete the following learning resources in the order shown. When you click on a resource, it will open in a new tab. Keep this page open so you can easily move on to the next resource!',
      label: 'Configure a Jupyter notebook to use GPUs for AI/ML modeling',
      url: 'https://developers.redhat.com/learn/openshift-data-science/configure-jupyter-notebook-use-gpus-aiml-modeling',
    },
  ];
  const homePageData = [
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
      getHomeDataJson: jest.fn(() => Promise.resolve(homePageData)),
      getLearningPathDataJson: jest.fn(() => Promise.resolve(learningPathData)),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return homepage data if no prop is provided', async () => {
    const { result } = renderHook(() => useCustomizationData());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data).toStrictEqual(homePageData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  it('should return homepage data if prop is provided', async () => {
    const { result } = renderHook(() => useCustomizationData());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data).toStrictEqual(homePageData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  it('should return learning path data if prop is provided', async () => {
    const { result } = renderHook(() =>
      useCustomizationData('learningPathPage'),
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data).toStrictEqual(learningPathData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  it('handles API error properly', async () => {
    (useApi as jest.Mock).mockReturnValue({
      getHomeDataJson: jest.fn(() => Promise.reject(new Error('API Error'))),
      getLearningPathDataJson: jest.fn(() =>
        Promise.reject(new Error('API Error')),
      ),
    });

    jest
      .spyOn(global, 'fetch')
      .mockImplementationOnce(() =>
        Promise.reject(new Error('Fallback data fetch Error')),
      );

    const { result } = renderHook(() => useCustomizationData());

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
      getHomeDataJson: jest.fn(() => Promise.reject(new Error('API Error'))),
      getLearningPathDataJson: jest.fn(() =>
        Promise.reject(new Error('API Error')),
      ),
    });

    jest
      .spyOn(global, 'fetch')
      .mockImplementationOnce(() =>
        Promise.resolve(new Response(JSON.stringify(homePageDataFallback))),
      );

    const { result } = renderHook(() => useCustomizationData());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data).toStrictEqual(homePageDataFallback);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('fetches learning page data from fallback if API fails', async () => {
    const learningPathDataFallback = [
      {
        paths: 1,
        minutes: 20,
        description:
          'For the best experience in this learning path, we suggest that you complete the following learning resources in the order shown. When you click on a resource, it will open in a new tab. Keep this page open so you can easily move on to the next resource!',
        label: 'Configure a Jupyter notebook to use GPUs for AI/ML modeling',
        url: 'https://developers.redhat.com/learn/openshift-data-science/configure-jupyter-notebook-use-gpus-aiml-modeling',
      },
    ];
    (useApi as jest.Mock).mockReturnValue({
      getHomeDataJson: jest.fn(() => Promise.reject(new Error('API Error'))),
      getLearningPathDataJson: jest.fn(() =>
        Promise.reject(new Error('API Error')),
      ),
    });

    jest
      .spyOn(global, 'fetch')
      .mockImplementationOnce(() =>
        Promise.resolve(new Response(JSON.stringify(learningPathDataFallback))),
      );

    const { result } = renderHook(() => useCustomizationData());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data).toStrictEqual(learningPathDataFallback);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
