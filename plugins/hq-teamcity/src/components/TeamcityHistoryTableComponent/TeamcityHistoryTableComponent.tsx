import React from 'react';
import { Link, Table, TableColumn } from '@backstage/core-components';
import Launch from '@material-ui/icons/Launch';
import moment from 'moment';
import { BuildCollection } from '../types';
import { TeamcityStatus } from '../TeamcityStatus/TeamcityStatus';
import { TeamcitySource } from '../TeamcitySource/TeamcitySource';
import { useRouteRef, useRouteRefParams } from '@backstage/core-plugin-api';
import { buildLogsRouteRef, buildRouteRef } from '../../plugin';

export const buildLogUrl = (
  buildName?: string,
  buildId?: string,
  buildRunId?: string,
) => {
  const LinkWrapper = () => {
    const routeLink = useRouteRef(buildLogsRouteRef);
    return buildRunId ? (
      <Link
        style={{ float: 'left' }}
        to={routeLink({
          buildName: String(buildName),
          buildId: String(buildId),
          buildRunId: String(buildRunId),
        })}
      >
        (view logs)
      </Link>
    ) : (
      <></>
    );
  };

  return <LinkWrapper />;
};

export const TeamcityHistoryTableComponent = ({ builds }: BuildCollection) => {
  const { buildName, buildId } = useRouteRefParams(buildRouteRef);
  const columns: TableColumn[] = [
    { title: 'Source', field: 'branchName' },
    { title: 'Status', field: 'status' },
    { title: 'Finished At', field: 'finishedAt' },
    { title: 'Url', field: 'webUrl' },
  ];

  const data = builds.map(build => {
    const branchName = build?.branchName;
    const revisions = build?.revisions;
    const revision = revisions?.revision[revisions?.revision.length - 1];
    const finishedAt = build?.finishDate
      ? moment(build?.finishDate).format('MMM Do, HH:mm')
      : '';

    return {
      branchName: (
        <TeamcitySource revision={revision} branchName={branchName} />
      ),
      status: (
        <>
          <TeamcityStatus status={build.status} statusText={build.statusText} />
          {buildLogUrl(buildName, buildId, build.id)}
        </>
      ),
      finishedAt: `${finishedAt}`,
      webUrl: (
        <Link to={build.webUrl || ''} target="_blank">
          <Launch fontSize="small" />
        </Link>
      ),
    };
  });

  return (
    <Table
      title="History"
      options={{ search: false, paging: false }}
      columns={columns}
      data={data}
    />
  );
};
