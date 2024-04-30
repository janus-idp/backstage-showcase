import { Content, Header, InfoCard, Page } from '@backstage/core-components';
import { SearchContextProvider } from '@backstage/plugin-search-react';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { ErrorReport } from '../../common';
import { LearningPathLinks } from '../../types/types';
import {
  learningPathPage,
  useCustomizationData,
} from '../../hooks/useCustomizationData';

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

const learningPathLengthInfo = (path: LearningPathLinks) => {
  const hoursText = path.hours === 1 ? 'hour' : 'hours';
  const minutesText = path.minutes === 1 ? 'minute' : 'minutes';

  const hours = path.hours ? `${path.hours} ${hoursText}` : '';
  const minutes = path.minutes ? `${path.minutes} ${minutesText}` : '';

  return `${hours} ${minutes} | ${path.paths} learning paths`;
};

const LearningPathCards = () => {
  const { classes } = useStyles();

  const { data, error, isLoading } = useCustomizationData(learningPathPage) as {
    data: LearningPathLinks[] | undefined;
    error: Error | undefined;
    isLoading: boolean;
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (!data) {
    return (
      <ErrorReport title="Could not fetch data." errorText="Unknown error" />
    );
  }

  if (!isLoading && !data && error) {
    return (
      <ErrorReport title="Could not fetch data." errorText={error.toString()} />
    );
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
