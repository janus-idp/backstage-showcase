import { Box, Card, Paper, Typography } from '@material-ui/core';
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { buildLogsRouteRef } from '../../plugin';
import {
  Breadcrumbs,
  Content,
  Link,
  Progress,
} from '@backstage/core-components';
import Alert from '@material-ui/lab/Alert';
import {
  useApi,
  configApiRef,
  useRouteRefParams,
} from '@backstage/core-plugin-api';
import useAsync from 'react-use/lib/useAsync';

const useStyles = makeStyles({
  paper: {
    maxHeight: 800,
    overflow: 'auto',
    whiteSpace: 'pre',
  },
  card: {
    padding: '10px 20px',
  },
});

const TeamcityLogPage = () => {
  const classes = useStyles();
  const { buildName, buildId, buildRunId } =
    useRouteRefParams(buildLogsRouteRef);
  const config = useApi(configApiRef);
  const { value, loading, error } = useAsync(async (): Promise<string> => {
    const backendUrl = config.getString('backend.baseUrl');
    const response = await fetch(
      `${backendUrl}/api/proxy/teamcity-proxy/downloadBuildLog.html?buildId=${buildRunId}`,
    );
    const data = await response.text();

    return data;
  }, []);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  return (
    <div>
      <Breadcrumbs aria-label="breadcrumb">
        <Link to="../../../../..">Builds</Link>
        <Link to="../..">
          {buildName} ({buildId})
        </Link>
        <Typography>Logs</Typography>
      </Breadcrumbs>
      <Box m={1} />
      <Card className={classes.card}>
        <Paper className={classes.paper}>{value}</Paper>
      </Card>
    </div>
  );
};
const Page = () => (
  <Content>
    <TeamcityLogPage />
  </Content>
);

export default Page;
export { TeamcityLogPage };
