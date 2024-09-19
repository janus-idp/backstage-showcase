/*
 * Copyright 2024 The Janus-IDP Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import crypto from 'crypto';
// @ts-ignore
import urlsafeBase64 from 'urlsafe-base64';
import https from 'https';
import axios from 'axios';
import fs from 'fs';
import { OpenShiftUser } from './types';

export function bufferFromFileOrString(
  file?: fs.PathOrFileDescriptor,
  data?: string,
): Buffer | null {
  if (file) {
    return fs.readFileSync(file);
  }
  if (data) {
    return Buffer.from(data, 'base64');
  }
  return null;
}

// Converts the user access token into the corresponding oauth.openshift.io/v1/oauthaccesstokens object name
// Adapted from https://github.com/openshift/jenkins-openshift-login-plugin/blob/a845a1e512d3916cde95279aa90af4a03e0eeb9e/src/main/java/org/openshift/jenkins/plugins/openshiftlogin/OpenShiftOAuth2SecurityRealm.java#L1204-L1230
export function tokenToObjectName(code?: string): string {
  const SHA256_PREFIX = 'sha256~';
  let accessToken = code;
  if (accessToken === undefined) {
    return '';
  }
  if (accessToken.startsWith(SHA256_PREFIX)) {
    accessToken = accessToken.substring(SHA256_PREFIX.length);
    const hash = crypto
      .createHash('sha256')
      .update(accessToken, 'utf8')
      .digest();
    accessToken = SHA256_PREFIX + urlsafeBase64.encode(hash);
  }
  return accessToken;
}

export function isValidUrl(value: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch (_) {
    return false;
  }
}

export async function logoutUser(
  agent: https.Agent,
  accessToken?: string,
  openshiftApiUrl?: string,
): Promise<void> {
  const tokenName = tokenToObjectName(accessToken);

  const url = `${openshiftApiUrl}/apis/oauth.openshift.io/v1/oauthaccesstokens/${tokenToObjectName(tokenName)}`;

  await axios.delete(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    httpsAgent: agent,
  });
}

export async function fetchUserInfo(
  agent: https.Agent,
  accessToken: string,
  openshiftApiUrl: string,
): Promise<OpenShiftUser> {
  const url = `${openshiftApiUrl}/apis/user.openshift.io/v1/users/~`;

  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    httpsAgent: agent,
  });

  return response.data as OpenShiftUser;
}
