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
import { ErrorReport, fetcher } from '../../common';
import LogoFull from '../Root/LogoFull';

type QuickAccessLinks = {
  title: string;
  isExpanded?: boolean;
  links: (Tool & { iconUrl: string })[];
};

const QuickAccess = () => {
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
                className={css`
                  height: 40px;
                  width: auto;
                `}
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
              className={css`
                margin: 5px 0px 1px 0px;
              `}
              logo={
                <LogoFull
                  className={css`
                    height: 80px;
                  `}
                />
              }
            />
            <HomePageSearchBar
              classes={{
                root: css`
                  display: flex;
                  max-width: 60vw;
                  box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2),
                    0px 1px 1px 0px rgba(0, 0, 0, 0.14),
                    0px 1px 3px 0px rgba(0, 0, 0, 0.12);
                  border-radius: 50px;
                  margin: auto;
                `,
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
