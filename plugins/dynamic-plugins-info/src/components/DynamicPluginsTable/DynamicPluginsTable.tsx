import React, { useState } from 'react';

import {
  ResponseErrorPanel,
  Table,
  TableColumn,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';

import { Query, QueryResult } from '@material-table/core';

import { DynamicPluginInfo, dynamicPluginsInfoApiRef } from '../../api/types';

export const DynamicPluginsTable = () => {
  const [error, setError] = useState<Error | undefined>(undefined);
  const [count, setCount] = useState<number>(0);
  const dynamicPluginInfo = useApi(dynamicPluginsInfoApiRef);
  const columns: TableColumn<DynamicPluginInfo>[] = [
    {
      title: 'Name',
      field: 'name',
      defaultSort: 'asc',
    },
    {
      title: 'Version',
      field: 'version',
      width: '30%',
    },
    {
      title: 'Role',
      render: ({ platform, role }) => <>{`${role} (${platform})`}</>,
      sorting: false,
    },
  ];
  const fetchData = async (
    query: Query<DynamicPluginInfo>,
  ): Promise<QueryResult<DynamicPluginInfo>> => {
    const {
      orderBy = { field: 'name' },
      orderDirection = 'asc',
      page = 0,
      pageSize = 5,
      search = '',
    } = query || {};
    try {
      // for now sorting/searching/pagination is handled client-side
      const data = (await dynamicPluginInfo.listLoadedPlugins())
        .sort((a: Record<string, string>, b: Record<string, string>) => {
          const field = orderBy.field!;
          if (!a[field] || !b[field]) {
            return 0;
          }
          return (
            a[field].localeCompare(b[field]) *
            (orderDirection === 'desc' ? -1 : 1)
          );
        })
        .filter(
          value =>
            search.trim() === '' ||
            JSON.stringify(value).indexOf(search.trim()) > 0,
        );
      const totalCount = data.length;
      let start = 0;
      let end = totalCount;
      if (totalCount > pageSize) {
        start = page * pageSize;
        end = start + pageSize;
      }
      setCount(totalCount);
      return { data: data.slice(start, end), page, totalCount };
    } catch (loadingError) {
      setError(loadingError as Error);
      return { data: [], totalCount: 0, page: 0 };
    }
  };
  if (error) {
    return <ResponseErrorPanel error={error} />;
  }
  return (
    <Table
      title={`Installed Plugins (${count})`}
      options={{
        draggable: false,
        filtering: false,
        sorting: true,
        paging: true,
        thirdSortClick: false,
        debounceInterval: 500,
      }}
      columns={columns}
      data={fetchData}
    />
  );
};
