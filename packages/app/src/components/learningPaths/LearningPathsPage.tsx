import React from 'react';
import { SearchContextProvider } from '@backstage/plugin-search-react';
import { Content, Page, InfoCard, Header } from '@backstage/core-components';
import {
  CircularProgress,
  Grid,
  Link,
  makeStyles,
  Typography,
} from '@material-ui/core';

import useSWR from 'swr';
import { fetcher, ErrorReport } from '../../common';

type Path = {
  label: string;
  url: string;
  description?: string;
  hours?: number;
  paths?: number;
};

const useCatalogStyles = makeStyles({
  root: {
    height: '100%',
    transition: 'all .25s linear',
    textAlign: 'left',
    '&:hover': {
      boxShadow: '0px 0px 16px 0px rgba(0,0,0,0.8)',
    },
    '& svg': {
      fontSize: 80,
    },
  },
  subheader: {
    display: 'block',
    width: '100%',
  },
  link: {
    '&:hover': {
      textDecoration: 'none',
    },
  },
});

const LearningPathCards = () => {
  const classes = useCatalogStyles();

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
            <Link href={p.url} className={classes.link}>
              <InfoCard
                className={classes.root}
                title={p.label}
                subheader={
                  <div className={classes.subheader}>
                    {p.hours} {p.hours === 1 ? 'hour' : 'hours'} | {p.paths}{' '}
                    learning paths
                  </div>
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
