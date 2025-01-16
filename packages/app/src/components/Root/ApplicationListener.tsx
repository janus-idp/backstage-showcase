import { useContext } from 'react';

import { ErrorBoundary } from '@backstage/core-components';

import DynamicRootContext from '../DynamicRoot/DynamicRootContext';

export const ApplicationListener = () => {
  const { mountPoints } = useContext(DynamicRootContext);
  const listeners = mountPoints['application/listener'] ?? [];
  return listeners.map(({ Component }, index) => {
    return (
      <ErrorBoundary
        // eslint-disable-next-line react/no-array-index-key
        key={index}
      >
        <Component />
      </ErrorBoundary>
    );
  });
};
