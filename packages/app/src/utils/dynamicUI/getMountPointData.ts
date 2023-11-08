import { getScalprum } from '@scalprum/core';
import { ScalprumMountPointConfig } from '../../components/DynamicRoot/DynamicRootContext';

function getMountPointData<T = any>(
  mountPoint: string,
): { config: ScalprumMountPointConfig; component: T }[] {
  return getScalprum().api.mountPoints?.[mountPoint] ?? [];
}

export default getMountPointData;
