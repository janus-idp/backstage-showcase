import React from 'react';

import { VisitListener as VisitListenerComponent } from '@backstage/plugin-home';

import { useHomePageMountPoints } from '../hooks/useHomePageMountPoints';

export const VisitListener = () => {
  const allHomePageMountPoints = useHomePageMountPoints();

  const shouldLoadVisitListener = React.useMemo<boolean>(() => {
    if (!allHomePageMountPoints) {
      return false;
    }

    const requiresVisitListener = [
      'Extension(RecentlyVisitedCard)',
      'Extension(TopVisitedCard)',
    ];

    return allHomePageMountPoints.some(card =>
      requiresVisitListener.includes(card.Component.displayName!),
    );
  }, [allHomePageMountPoints]);

  return shouldLoadVisitListener ? <VisitListenerComponent /> : null;
};
