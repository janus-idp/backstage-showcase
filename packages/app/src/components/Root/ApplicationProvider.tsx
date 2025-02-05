import { useContext, useMemo } from 'react';

import { ErrorBoundary } from '@backstage/core-components';

import DynamicRootContext from '../DynamicRoot/DynamicRootContext';

export const ApplicationProvider = ({
  children,
}: React.PropsWithChildren<{}>) => {
  const { mountPoints } = useContext(DynamicRootContext);
  const providers = useMemo(
    () => mountPoints['application/provider'] ?? [],
    [mountPoints],
  );
  if (providers.length === 0) {
    return children;
  }
  return providers.reduceRight((acc, { Component }, index) => {
    return (
      <ErrorBoundary
        // eslint-disable-next-line react/no-array-index-key
        key={index}
      >
        <Component>{acc}</Component>
      </ErrorBoundary>
    );
  }, children);
};
