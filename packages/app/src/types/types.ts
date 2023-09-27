import { Tool } from '@backstage/plugin-home';

export type QuickAccessLinks = {
  title: string;
  isExpanded?: boolean;
  links: (Tool & { iconUrl: string })[];
};

export type ThemeColors = {
  primaryColor?: string | undefined;
  headerColor1?: string | undefined;
  headerColor2?: string | undefined;
  navigationIndicatorColor?: string | undefined;
};
