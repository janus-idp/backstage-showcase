import { AppComponents } from '@backstage/core-plugin-api';

import { SignInPage } from '../SignInPage/SignInPage';

const defaultAppComponents: Partial<AppComponents> = {
  SignInPage: props => <SignInPage {...props} />,
};

export default defaultAppComponents;
