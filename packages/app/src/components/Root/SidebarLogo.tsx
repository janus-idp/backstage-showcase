import { Link, useSidebarOpenState } from '@backstage/core-components';
import React from 'react';
import { makeStyles } from 'tss-react/mui';
import LogoFull from './LogoFull';
import LogoIcon from './LogoIcon';
import { configApiRef, useApi } from '@backstage/core-plugin-api';

const useStyles = makeStyles()({
  sidebarLogo: {
    margin: '24px 0px 6px 24px',
  },
});

const LogoRender = ({
  base64Logo,
  defaultLogo,
  width,
}: {
  base64Logo: string | undefined;
  defaultLogo: React.JSX.Element;
  width: number;
}) => {
  return base64Logo ? (
    <img
      data-testid="home-logo"
      src={base64Logo}
      alt="Home logo"
      width={width}
    />
  ) : (
    defaultLogo
  );
};

export const SidebarLogo = () => {
  const { classes } = useStyles();
  const { isOpen } = useSidebarOpenState();
  const configApi = useApi(configApiRef);
  const logoFullBase64URI = configApi.getOptionalString(
    'app.branding.fullLogo',
  );
  const logoIconBase64URI = configApi.getOptionalString(
    'app.branding.iconLogo',
  );

  return (
    <div className={classes.sidebarLogo}>
      <Link to="/" underline="none" aria-label="Home">
        {isOpen ? (
          <LogoRender
            base64Logo={logoFullBase64URI}
            defaultLogo={<LogoFull />}
            width={110}
          />
        ) : (
          <LogoRender
            base64Logo={logoIconBase64URI}
            defaultLogo={<LogoIcon />}
            width={28}
          />
        )}
      </Link>
    </div>
  );
};
