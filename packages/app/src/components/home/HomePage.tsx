import {
  Content,
  Header,
  InfoCard,
  Link,
  Page,
} from '@backstage/core-components';
import {
  ComponentAccordion,
  HomePageStarredEntities,
  HomePageToolkit,
} from '@backstage/plugin-home';
import { HomePageSearchBar } from '@backstage/plugin-search';
import { SearchContextProvider } from '@backstage/plugin-search-react';
import { css } from '@emotion/css';
import MuiAlert from '@mui/lab/Alert';
import { Box, CircularProgress, Grid } from '@mui/material';
import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { ErrorReport } from '../../common';
import { useQuickAccess } from '../../hooks/useQuickAccess';

const useStyles = makeStyles()(theme => ({
  img: {
    height: '40px',
    width: 'auto',
  },
  searchBar: {
    display: 'flex',
    maxWidth: '60vw',
    boxShadow: theme.shadows.at(1),
    borderRadius: '50px',
    margin: 'auto',
  },
}));

const QuickAccess = () => {
  const { classes } = useStyles();
  const { data, error, isLoading } = useQuickAccess();

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
    <InfoCard title="Quick Access" noPadding>
      {data.map(item => (
        <HomePageToolkit
          key={item.title}
          title={item.title}
          tools={item.links.map(link => ({
            ...link,
            icon: (
              <img
                className={classes.img}
                src={link.iconUrl}
                alt={link.label}
              />
            ),
          }))}
          Renderer={
            item.isExpanded
              ? props => <ComponentAccordion expanded {...props} />
              : props => <ComponentAccordion {...props} />
          }
        />
      ))}
    </InfoCard>
  );
};

export const HomePage = () => {
  const { classes } = useStyles();

  return (
    <SearchContextProvider>
      <Page themeId="home">
        <Header title="Welcome back!" />
        <Content>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {window.location.origin.startsWith(
              'https://janus-idp.apps.smaug.na.operate-first.cloud',
            ) && (
              <MuiAlert severity="warning">
                The Janus showcase URL has changed! Please, use this new link
                instead{' '}
                <Link to="https://showcase.janus-idp.io">
                  showcase.janus-idp.io
                </Link>
              </MuiAlert>
            )}
            {/* useStyles has a lower precedence over mui styles hence why we need use use css */}
            <HomePageSearchBar
              classes={{
                root: classes.searchBar,
              }}
              InputProps={{
                classes: {
                  notchedOutline: css`
                    border-style: none;
                  `,
                },
              }}
              placeholder="Search"
            />
            <Grid container xs={12}>
              <Grid item xs={12} md={7}>
                <QuickAccess />
              </Grid>
              <Grid item xs={12} md={5}>
                <HomePageStarredEntities />
              </Grid>
            </Grid>
          </Box>
        </Content>
      </Page>
    </SearchContextProvider>
  );
};
