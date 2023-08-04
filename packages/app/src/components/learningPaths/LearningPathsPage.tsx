import { Content, Header, InfoCard, Page } from '@backstage/core-components';
import { SearchContextProvider } from '@backstage/plugin-search-react';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import React from 'react';
import useSWR from 'swr';
import { makeStyles } from 'tss-react/mui';
import { ErrorReport, fetcher } from '../../common';

const useStyles = makeStyles()({
  link: {
    textDecoration: 'none',
  },
  infoCard: {
    height: '100%',
    transition: 'all 0.25s linear',
    textAlign: 'left',
    '&:hover': {
      boxShadow: '0px 0px 16px 0px rgba(0, 0, 0, 0.8)',
    },
    '& svg': {
      fontSize: '80px',
    },
  },
});

type Path = {
  label: string;
  url: string;
  description?: string;
  hours?: number;
  minutes?: number;
  paths?: number;
};

const learningPathLengthInfo = (path: Path) => {
  const hoursText = path.hours === 1 ? 'hour' : 'hours';
  const minutesText = path.minutes === 1 ? 'minute' : 'minutes';

  const hours = path.hours ? `${path.hours} ${hoursText}` : '';
  const minutes = path.minutes ? `${path.minutes} ${minutesText}` : '';

  return `${hours} ${minutes} | ${path.paths} learning paths`;
};

const LearningPathCards = () => {
  const { classes } = useStyles();
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
            <Link href={p.url} className={classes.link} target="_blank">
              <InfoCard
                className={classes.infoCard}
                title={p.label}
                subheader={learningPathLengthInfo(p)}
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
