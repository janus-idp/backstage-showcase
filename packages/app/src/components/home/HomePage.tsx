import React from 'react';
import {
  Content,
  Header,
  InfoCard,
  Link,
  Page,
} from '@backstage/core-components';
import MuiAlert from '@material-ui/lab/Alert';
import { Grid, makeStyles } from '@material-ui/core';
import {
  ComponentAccordion,
  HomePageToolkit,
  HomePageCompanyLogo,
  HomePageStarredEntities,
  type Tool,
} from '@backstage/plugin-home';
import { HomePageSearchBar } from '@backstage/plugin-search';
import { SearchContextProvider } from '@backstage/plugin-search-react';
import useSWR from 'swr';
import LogoFull from '../Root/LogoFull';
import { configApiRef, useApi } from '@backstage/core-plugin-api';

type QuickAccessLinks = {
  title: string;
  isExpanded?: boolean;
  links: (Tool & { iconUrl: string })[];
};

const useQuickAccessStyles = makeStyles({
  img: {
    height: '40px',
    width: 'auto',
  },
});

const fetcher = async (urls: Parameters<typeof fetch>[]) => {
  const responses = await Promise.all(urls.map(args => fetch(...args)));

  const result = responses.find(response => response.ok);

  if (!result) {
    throw new Error('Could not fetch quick access links');
  }

  return result.json() as Promise<QuickAccessLinks[]>;
};

const useGetBaseURL = () => {
  const config = useApi(configApiRef);
  return config.getString('backend.baseUrl');
};

const QuickAccess = () => {
  const classes = useQuickAccessStyles();
  const baseUrl = useGetBaseURL();
  const { data, error, isLoading } = useSWR(
    [[`${baseUrl}/api/s3/homepage/data.json`], ['/homepage/data.json']],
    fetcher,
  );

  if (error) return <div>failed to load</div>;
  if (isLoading) return <div>loading...</div>;
  if (!data) return <div>data could not be found</div>;

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

const useStyles = makeStyles(theme => ({
  searchBar: {
    display: 'flex',
    maxWidth: '60vw',
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[1],
    padding: '8px 10px',
    borderRadius: '50px',
    margin: 'auto',
  },
  imageIcon: {
    height: '40px',
  },
}));

const useLogoStyles = makeStyles(theme => ({
  container: {
    margin: theme.spacing(5, 0, 1, 0),
  },
  svg: {
    width: 'auto',
    height: 80,
  },
}));

export const HomePage = () => {
  const classes = useStyles();
  const { svg, container } = useLogoStyles();

  return (
    <SearchContextProvider>
      <Page themeId="home">
        <Header title="Welcome back!" />
        <Content>
          <Grid container justifyContent="center" spacing={6}>
            {window.location.origin.startsWith(
              'https://janus-idp.apps.smaug.na.operate-first.cloud',
            ) && (
              <Grid item xs={12} md={12}>
                <MuiAlert severity="warning">
                  The Janus showcase URL has changed! Please, use this new link
                  instead{' '}
                  <Link to="https://showcase.janus-idp.io">
                    showcase.janus-idp.io
                  </Link>
                </MuiAlert>
              </Grid>
            )}
            <HomePageCompanyLogo
              className={container}
              logo={<LogoFull classes={{ svg }} />}
            />
            <Grid item xs={12} alignItems="center" direction="row">
              <HomePageSearchBar
                classes={{ root: classes.searchBar }}
                placeholder="Search"
              />
            </Grid>
            <Grid container item xs={12}>
              <Grid item xs={12} md={7}>
                <QuickAccess />
              </Grid>
              <Grid item xs={12} md={5}>
                <HomePageStarredEntities />
              </Grid>
            </Grid>
          </Grid>
        </Content>
      </Page>
    </SearchContextProvider>
  );
};
