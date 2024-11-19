import React from 'react';

import {
  FeaturedDocsCardProps,
  FeaturedDocsCard as PluginHomeFeaturedDocsCard,
} from '@backstage/plugin-home';

/**
 * Overrides `FeaturedDocsCard` from the home plugin, but overrides the
 * `subLinkText` prop to be " Learn more" instead of "LEARN MORE".
 *
 * 1. To fix the all uppercase that is used in home plugin
 * 2. To add a small missing gap between the title and the button
 */
export const FeaturedDocsCard = (props: FeaturedDocsCardProps) => {
  return <PluginHomeFeaturedDocsCard subLinkText=" Learn more" {...props} />;
};
