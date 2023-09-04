import { createRouteRef } from '@backstage/core-plugin-api';
import { Entity } from '@backstage/catalog-model';

export const TEAMCITY_ANNOTATION = 'teamcity/project-id';

export const isTeamcityAvailable = (entity: Entity) =>
  Boolean(entity.metadata.annotations?.[TEAMCITY_ANNOTATION]);

export const rootRouteRef = createRouteRef({
  id: 'teamcity',
});
