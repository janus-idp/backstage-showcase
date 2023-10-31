import { getScalprum } from '@scalprum/core';

function getMountPointData<T = any>(mountPoint: string): T[] {
  return getScalprum().api.mountPoints?.[mountPoint] ?? [];
}

export default getMountPointData;
