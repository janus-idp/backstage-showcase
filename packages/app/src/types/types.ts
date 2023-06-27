import { Tool } from '@backstage/plugin-home';

export type QuickAccessLinks = {
  title: string;
  isExpanded?: boolean;
  links: (Tool & { iconUrl: string })[];
};
