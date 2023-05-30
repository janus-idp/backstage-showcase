import { Content, Header, InfoCard, Page } from '@backstage/core-components';
import { SearchContextProvider } from '@backstage/plugin-search-react';
import { css } from '@emotion/css';
import { CircularProgress, Grid, Link, Typography } from '@mui/material';
import React from 'react';
import useSWR from 'swr';
import { ErrorReport, fetcher } from '../../common';

type Path = {
  label: string;
  url: string;
  description?: string;
  hours?: number;
  paths?: number;
};

const LearningPathCards = () => {
  const { data, error, isLoading } = useSWR(
    '/learning-paths/data.json',
    fetcher<Path>,
  );

  if (!data) {
    return (
      <ErrorReport title="Could not fetch data." errorText="Unknown error" />
    );
  }

  if (error) {
    return (
      <ErrorReport title="Could not fetch data." errorText={error.toString()} />
    );
  }

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <Grid container justifyContent="center" alignContent="center" spacing={2}>
      <Grid item xs={12} container justifyContent="center">
        {data.map(p => (
          <Grid item xs={12} sm={6} md={4} lg={3} xl={3} key={p.label}>
            <Link
              href={p.url}
              className={css`
                text-decoration: none;
              `}
              target="_blank"
            >
              <InfoCard
                className={css`
                  height: 100%;
                  transition: all 0.25s linear;
                  text-align: left;
                  &:hover {
                    box-shadow: 0px 0px 16px 0px rgba(0, 0, 0, 0.8);
                  }
                  & svg {
                    font-size: 80px;
                  }
                `}
                title={p.label}
                subheader={
                  <>
                    {p.hours} {p.hours === 1 ? 'hour' : 'hours'} | {p.paths}{' '}
                    learning paths
                  </>
                }
              >
                <Typography paragraph>{p.description}</Typography>
              </InfoCard>
            </Link>
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
};

export const LearningPaths = () => {
  return (
    <SearchContextProvider>
      <Page themeId="home">
        <Header title="Learning Paths" />
        <Content>
          <Grid container justifyContent="center" spacing={6}>
            <Grid item xs={12}>
              <LearningPathCards />
            </Grid>
          </Grid>
        </Content>
      </Page>
    </SearchContextProvider>
  );
};
