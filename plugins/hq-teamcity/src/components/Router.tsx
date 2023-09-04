import { MissingAnnotationEmptyState } from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
import React from 'react';
import { Route, Routes } from 'react-router';
import { buildRouteRef, buildLogsRouteRef } from '../plugin';
import { isTeamcityAvailable, TEAMCITY_ANNOTATION } from '../routes';
import { TeamcityBuildPage } from './TeamcityBuildPage/TeamcityBuildPage';
import { TeamcityLogPage } from './TeamcityLogPage/TeamcityLogPage';
import { TeamcityTableComponent } from './TeamcityTableComponent/TeamcityTableComponent';

export const Router = () => {
  const { entity } = useEntity();

  if (!isTeamcityAvailable(entity)) {
    return <MissingAnnotationEmptyState annotation={TEAMCITY_ANNOTATION} />;
  }

  return (
    <Routes>
      <Route path="/" element={<TeamcityTableComponent />} />
      <Route path={`/${buildRouteRef.path}`} element={<TeamcityBuildPage />} />
      <Route
        path={`/${buildLogsRouteRef.path}`}
        element={<TeamcityLogPage />}
      />
    </Routes>
  );
};
