import { Content, Header, InfoCard, Page } from '@backstage/core-components';
import {
  ComponentAccordion,
  HomePageStarredEntities,
  HomePageToolkit,
} from '@backstage/plugin-home';
import { HomePageSearchBar } from '@backstage/plugin-search';
import { SearchContextProvider } from '@backstage/plugin-search-react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
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
  title: {
    'div > div > div > div > p': {
      textTransform: 'uppercase',
    },
  },
  notchedOutline: {
    borderStyle: 'none!important',
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
    <InfoCard title="Quick Access" noPadding className={classes.title}>
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
                  notchedOutline: classes.notchedOutline,
                },
              }}
              placeholder="Search"
            />
            <Grid container>
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
