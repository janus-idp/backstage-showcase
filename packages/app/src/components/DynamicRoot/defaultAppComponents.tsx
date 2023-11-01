import { ProxiedSignInPage, SignInPage } from '@backstage/core-components';
import {
  AppComponents,
  configApiRef,
  githubAuthApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import React from 'react';

const defaultAppComponents: Partial<AppComponents> = {
  SignInPage: props => {
    const configApi = useApi(configApiRef);
    if (configApi.getString('auth.environment') === 'development') {
      return (
        <SignInPage
          {...props}
          title="Select a sign-in method"
          align="center"
          providers={[
            'guest',
            {
              id: 'github-auth-provider',
              title: 'GitHub',
              message: 'Sign in using GitHub',
              apiRef: githubAuthApiRef,
            },
          ]}
        />
      );
    }
    return <ProxiedSignInPage {...props} provider="oauth2Proxy" />;
  },
};

export default defaultAppComponents;
