import React, { useEffect, useState } from 'react';
import { Content, Header, InfoCard, Page } from '@backstage/core-components';
import { Grid, makeStyles } from '@material-ui/core';
import Icon from '@material-ui/core/Icon';
import { ComponentAccordion, HomePageToolkit } from '@backstage/plugin-home';
import { HomePageSearchBar } from '@backstage/plugin-search';
import { SearchContextProvider } from '@backstage/plugin-search-react';

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
  logoIcon: {
    display: 'flex',
    height: '80px',
    width: 'auto',
  },
  iconRoot: {
    textAlign: 'center',
    height: '90px',
    width: 'auto',
    marginTop: '30px',
  },
  imageIcon: {
    height: '40px',
  },
}));

export const HomePage = () => {
  const classes = useStyles();
  const [items, setItems] = useState<QuickAccess[]>([]);

  useEffect(() => {
    fetch('/homepage/data.json')
      .then((response: Response) => response.json())
      .then((data: QuickAccess[]) => {
        for (const quickAccess of data) {
          for (const item of quickAccess.links) {
            item.icon = (
              <img
                className={classes.imageIcon}
                src={item.iconUrl}
                alt={item.label}
              />
            );
          }
        }

        setItems(data);
      });
  }, [classes.imageIcon]);

  const ExpandedComponentAccordion = (props: any) => (
    <ComponentAccordion expanded {...props} />
  );

  return (
    <SearchContextProvider>
      <Page themeId="home">
        <Header title="Welcome back!" />
        <Content>
          <Grid container justifyContent="center" spacing={6}>
            <Icon classes={{ root: classes.iconRoot }}>
              <img
                className={classes.logoIcon}
                src="/assets/janus-logo.svg"
                alt="Janus Logo"
              />
            </Icon>
            <Grid item xs={12} alignItems="center" direction="row">
              <HomePageSearchBar
                classes={{ root: classes.searchBar }}
                placeholder="Search"
              />
            </Grid>
            <Grid item xs={12} md={12}>
              <InfoCard title="Quick Access" noPadding>
                <Grid item>
                  {items &&
                    items.map((item: QuickAccess, index: number) => (
                      <HomePageToolkit
                        key={index}
                        title={item.title}
                        tools={item.links}
                        Renderer={
                          index === 0
                            ? ExpandedComponentAccordion
                            : ComponentAccordion
                        }
                      />
                    ))}
                </Grid>
              </InfoCard>
            </Grid>
          </Grid>
        </Content>
      </Page>
    </SearchContextProvider>
  );
};
