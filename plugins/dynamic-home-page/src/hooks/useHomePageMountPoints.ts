import { useScalprum } from '@scalprum/react-core';

import { HomePageCardMountPoint } from '../types';

interface ScalprumState {
  api?: {
    dynamicRootConfig?: {
      mountPoints?: {
        'home.page/cards'?: HomePageCardMountPoint[];
      };
    };
  };
}

export const useHomePageMountPoints = ():
  | HomePageCardMountPoint[]
  | undefined => {
  const scalprum = useScalprum<ScalprumState>();

  const homePageMountPoints =
    scalprum?.api?.dynamicRootConfig?.mountPoints?.['home.page/cards'];

  return homePageMountPoints;
};
