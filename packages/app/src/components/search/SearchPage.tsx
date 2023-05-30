import { Grid, Paper } from '@mui/material';
import React from 'react';

import { CatalogSearchResultListItem } from '@backstage/plugin-catalog';
import {
  CATALOG_FILTER_EXISTS,
  catalogApiRef,
} from '@backstage/plugin-catalog-react';
import { TechDocsSearchResultListItem } from '@backstage/plugin-techdocs';

import {
  CatalogIcon,
  Content,
  DocsIcon,
  Header,
  Page,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { SearchType } from '@backstage/plugin-search';
import {
  SearchBar,
  SearchFilter,
  SearchPagination,
  SearchResult,
  useSearch,
} from '@backstage/plugin-search-react';
import { css } from '@emotion/css';

export const SearchPage = () => {
  const { types } = useSearch();
  const catalogApi = useApi(catalogApiRef);

  return (
    <Page themeId="home">
      <Header title="Search" />
      <Content>
        <Grid container direction="row">
          <Grid item xs={12}>
            <SearchBar
              className={css`
                border-radius: 50px;
                margin: auto;
                box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2),
                  0px 1px 1px 0px rgba(0, 0, 0, 0.14),
                  0px 1px 3px 0px rgba(0, 0, 0, 0.12);
              `}
            />
          </Grid>
          <Grid item xs={3}>
            <SearchType.Accordion
              name="Result Type"
              defaultValue="software-catalog"
              types={[
                {
                  value: 'software-catalog',
                  name: 'Software Catalog',
                  icon: <CatalogIcon />,
                },
                {
                  value: 'techdocs',
                  name: 'Documentation',
                  icon: <DocsIcon />,
                },
              ]}
            />
            <Paper
              className={css`
                margin-top: 0.75rem;
                padding: 0.75rem;
              `}
            >
              {types.includes('techdocs') && (
                <SearchFilter.Select
                  className={css`
                    margin-top: 0.75rem;
                  `}
                  label="Entity"
                  name="name"
                  values={async () => {
                    // Return a list of entities which are documented.
                    const { items } = await catalogApi.getEntities({
                      fields: ['metadata.name'],
                      filter: {
                        'metadata.annotations.backstage.io/techdocs-ref':
                          CATALOG_FILTER_EXISTS,
                      },
                    });

                    const names = items.map(entity => entity.metadata.name);
                    names.sort();
                    return names;
                  }}
                />
              )}
              <SearchFilter.Select
                className={css`
                  margin-top: 0.75rem;
                `}
                label="Kind"
                name="kind"
                values={['Component', 'Template']}
              />
              <SearchFilter.Checkbox
                className={css`
                  margin-top: 0.75rem;
                `}
                label="Lifecycle"
                name="lifecycle"
                values={['experimental', 'production']}
              />
            </Paper>
          </Grid>
          <Grid item xs={9}>
            <SearchPagination />
            <SearchResult>
              <CatalogSearchResultListItem icon={<CatalogIcon />} />
              <TechDocsSearchResultListItem icon={<DocsIcon />} />
            </SearchResult>
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
