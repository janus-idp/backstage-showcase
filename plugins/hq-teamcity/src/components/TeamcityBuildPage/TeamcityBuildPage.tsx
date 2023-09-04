import { Box, Typography } from '@material-ui/core';
import React from 'react';
import { buildRouteRef } from '../../plugin';
import {
  Breadcrumbs,
  Content,
  Link,
  Progress,
} from '@backstage/core-components';
import { TeamcityHistoryTableComponent } from '../TeamcityHistoryTableComponent';
import Alert from '@material-ui/lab/Alert';
import {
  useApi,
  configApiRef,
  useRouteRefParams,
} from '@backstage/core-plugin-api';
import useAsync from 'react-use/lib/useAsync';
import { Build } from '../types';

const TeamcityBuildPage = () => {
  const { buildName, buildId } = useRouteRefParams(buildRouteRef);

  const config = useApi(configApiRef);
  const { value, loading, error } = useAsync(async (): Promise<Build[]> => {
    const backendUrl = config.getString('backend.baseUrl');
    const fieldsQuery =
      'build(id,number,status,statusText,branchName,webUrl,revisions(revision(version,vcsBranchName,vcs-root-instance)),startDate,finishDate)';
    const response = await fetch(
      `${backendUrl}/api/proxy/teamcity-proxy/app/rest/buildTypes/id:${buildId}/builds?fields=${fieldsQuery}`,
    );
    const data = await response.json();

    return data.build;
  }, []);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  return (
    <div>
      <Breadcrumbs aria-label="breadcrumb">
        <Link to="../../..">Builds</Link>
        <Typography>
          {buildName} ({buildId})
        </Typography>
      </Breadcrumbs>
      <Box m={1} />
      <TeamcityHistoryTableComponent builds={value || []} />
    </div>
  );
};
const Page = () => (
  <Content>
    <TeamcityBuildPage />
  </Content>
);

export default Page;
export { TeamcityBuildPage };
