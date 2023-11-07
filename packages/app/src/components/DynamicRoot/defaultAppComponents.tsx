import { AppComponents } from '@backstage/core-plugin-api';
import React from 'react';
import { SignInPage } from '../SignInPage/SignInPage';

const defaultAppComponents: Partial<AppComponents> = {
  SignInPage: props => <SignInPage {...props} />,
};

export default defaultAppComponents;
