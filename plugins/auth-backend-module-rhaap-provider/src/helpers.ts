import { PassportProfile } from '@backstage/plugin-auth-node';

export async function fetchProfile(options: {
  host: string;
  accessToken: string;
  tokenType: string;
}): Promise<PassportProfile> {
  const { host, accessToken, tokenType } = options;
  const response = await fetch(`${host}/api/gateway/v1/me/`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${tokenType} ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to retrieve profile data`);
  }
  const userDataJson = await response.json();
  let userData;
  if (
    Object.hasOwn(userDataJson, 'results') &&
    Array.isArray(userDataJson.results) &&
    userDataJson.results?.length
  ) {
    userData = userDataJson.results[0];
  } else {
    throw new Error(`Failed to retrieve profile data`);
  }
  return {
    provider: 'AAP oauth2',
    username: userData.username,
    email: userData.email,
    displayName: `${userData?.first_name ? userData.first_name : ''} ${userData?.last_name ? userData.last_name : ''}`,
  } as PassportProfile;
}
