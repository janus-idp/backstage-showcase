import React from 'react';

import type { Tool } from '@backstage/plugin-home';

export enum Breakpoint {
  xl = 'xl',
  lg = 'lg',
  md = 'md',
  sm = 'sm',
  xs = 'xs',
  xxs = 'xxs',
}

export interface Layout {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

export interface HomePageCardMountPointConfig {
  priority?: number;
  layouts?: Record<Breakpoint, Layout>;
}

export interface HomePageCardMountPoint {
  Component: React.ComponentType;
  config?: HomePageCardMountPointConfig & {
    props?: Record<string, any>;
  };
  enabled?: boolean;
}

export type QuickAccessLink = {
  title: string;
  isExpanded?: boolean;
  links: (Tool & { iconUrl: string })[];
};
