import { useMemo } from 'react';

import { Content, EmptyState, Header, Page } from '@backstage/core-components';

import { useHomePageMountPoints } from '../hooks/useHomePageMountPoints';
import { ReadOnlyGrid } from './ReadOnlyGrid';

export interface DynamicHomePageProps {
  title?: string;
}

export const DynamicHomePage = (props: DynamicHomePageProps) => {
  const allHomePageMountPoints = useHomePageMountPoints();

  const filteredAndSortedHomePageCards = useMemo(() => {
    if (!allHomePageMountPoints) {
      return [];
    }

    const filteredAndSorted = allHomePageMountPoints.filter(
      card =>
        card.enabled !== false &&
        (!card.config?.priority || card.config.priority >= 0),
    );

    // TODO: check if we want have priories with small or big numbers first...
    filteredAndSorted.sort(
      (a, b) => (a.config?.priority ?? 0) - (b.config?.priority ?? 0),
    );

    return filteredAndSorted;
  }, [allHomePageMountPoints]);

  return (
    <Page themeId="home">
      <Header title={props.title ?? 'Welcome back!'} />
      <Content>
        {filteredAndSortedHomePageCards.length === 0 ? (
          <EmptyState
            title="No home page cards (mount points) configured or found."
            missing="content"
          />
        ) : (
          <ReadOnlyGrid mountPoints={filteredAndSortedHomePageCards} />
        )}
      </Content>
    </Page>
  );
};
