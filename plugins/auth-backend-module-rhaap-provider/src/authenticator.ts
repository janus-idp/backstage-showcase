import { Strategy as Oauth2Strategy } from 'passport-oauth2';
import {
  createOAuthAuthenticator,
  PassportOAuthAuthenticatorHelper,
  PassportOAuthDoneCallback,
  PassportProfile,
} from '@backstage/plugin-auth-node';
import { fetchProfile } from './helpers';

/** @public */
export const aapAuthAuthenticator = createOAuthAuthenticator({
  scopes: {
    persist: true,
  },
  defaultProfileTransform:
    PassportOAuthAuthenticatorHelper.defaultProfileTransform,
  initialize({ callbackUrl, config }) {
    const clientId = config.getString('clientId');
    const clientSecret = config.getString('clientSecret');
    const host = config.getString('host');
    const callbackURL = config.getOptionalString('callbackUrl') ?? callbackUrl;

    const helper = PassportOAuthAuthenticatorHelper.from(
      new Oauth2Strategy(
        {
          clientID: clientId,
          clientSecret: clientSecret,
          callbackURL: callbackURL,
          authorizationURL: `${host}/o/authorize/`,
          tokenURL: `${host}/o/token/`,
          skipUserProfile: true,
          passReqToCallback: false,
        },
        (
          accessToken: any,
          refreshToken: any,
          params: any,
          fullProfile: PassportProfile,
          done: PassportOAuthDoneCallback,
        ) => {
          done(
            undefined,
            { fullProfile, params, accessToken },
            { refreshToken },
          );
        },
      ),
    );
    return { helper, host };
  },
  async start(input, { helper }) {
    // console.log('RHAAP start');
    const start = await helper.start(input, {
      accessType: 'offline',
      prompt: 'auto',
      approval_prompt: 'auto',
    });
    start.url += '&approval_prompt=auto';
    return start;
  },

  async authenticate(input, { helper, host }) {
    const result = await helper.authenticate(input);
    // console.log('RHAAP authenticate result=', result);
    const fullProfile = await fetchProfile({
      host,
      accessToken: result.session.accessToken,
      tokenType: result.session.tokenType,
    });
    // console.log('RHAAP authenticate fullProfile=', fullProfile);
    return { ...result, fullProfile };
  },

  async refresh(input, { helper, host }) {
    // console.log('RHAAP refresh');
    const result = await helper.refresh(input);
    const fullProfile = await fetchProfile({
      host,
      accessToken: result.session.accessToken,
      tokenType: result.session.tokenType,
    });
    return { ...result, fullProfile };
  },
});
