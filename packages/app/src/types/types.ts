import { Tool } from '@backstage/plugin-home';

export type QuickAccessLinks = {
  title: string;
  isExpanded?: boolean;
  links: (Tool & { iconUrl: string })[];
};

export type LearningPathLinks = {
  label: string;
  url: string;
  description?: string;
  hours?: number;
  minutes?: number;
  paths?: number;
};

export type CustomzationDataLinks = QuickAccessLinks[] | LearningPathLinks[];

export type ThemeColors = {
  primaryColor?: string;
  headerColor1?: string;
  headerColor2?: string;
  navigationIndicatorColor?: string;
};
