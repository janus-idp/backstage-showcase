import {
  Content,
  Header,
  InfoCard,
  Link,
  Page,
} from '@backstage/core-components';
import {
  ComponentAccordion,
  HomePageCompanyLogo,
  HomePageStarredEntities,
  HomePageToolkit,
  type Tool,
} from '@backstage/plugin-home';
import { HomePageSearchBar } from '@backstage/plugin-search';
import { SearchContextProvider } from '@backstage/plugin-search-react';
import { css } from '@emotion/css';
import MuiAlert from '@mui/lab/Alert';
import { Box, CircularProgress, Grid } from '@mui/material';
import React from 'react';
import useSWR from 'swr';
import { makeStyles } from 'tss-react/mui';
import { ErrorReport, fetcher } from '../../common';
import LogoFull from '../Root/LogoFull';

const useStyles = makeStyles()(theme => ({
  img: {
    height: '40px',
    width: 'auto',
  },
  janusLogo: {
    height: '80px',
    width: 'auto',
  },
  janusLogoContainer: {
    margin: theme.spacing(5, 0, 1, 0),
  },
  searchBar: {
    display: 'flex',
    maxWidth: '60vw',
    boxShadow: theme.shadows.at(1),
    borderRadius: '50px',
    margin: 'auto',
  },
}));

type QuickAccessLinks = {
  title: string;
  isExpanded?: boolean;
  links: (Tool & { iconUrl: string })[];
};

const QuickAccess = () => {
  const { classes } = useStyles();
  const { data, error, isLoading } = useSWR(
    '/homepage/data.json',
    fetcher<QuickAccessLinks>,
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
            <HomePageCompanyLogo
              className={classes.janusLogoContainer}
              logo={<LogoFull className={classes.janusLogo} />}
            />
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
