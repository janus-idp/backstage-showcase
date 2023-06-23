import { Content, Header, InfoCard, Page } from '@backstage/core-components';
import {
  ComponentAccordion,
  HomePageStarredEntities,
  HomePageToolkit,
  type Tool,
} from '@backstage/plugin-home';
import { HomePageSearchBar } from '@backstage/plugin-search';
import { SearchContextProvider } from '@backstage/plugin-search-react';
import { css } from '@emotion/css';
import { Box, CircularProgress, Grid } from '@mui/material';
import React from 'react';
import useSWR from 'swr';
import { makeStyles } from 'tss-react/mui';
import { ErrorReport, fetcher } from '../../common';

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
            {/* useStyles has a lower precedence over mui styles hence why we need to use css */}
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
