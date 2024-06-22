// Copyright 2024 The Janus IDP Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { bootstrap } from 'global-agent';
import { Agent, ProxyAgent, Dispatcher, setGlobalDispatcher } from 'undici';

/**
 * Adds support for corporate proxy to both 'node-fetch' (using 'global-agent') and native 'fetch' (using 'undici') packages.
 *
 * Ref: https://github.com/backstage/backstage/blob/master/contrib/docs/tutorials/help-im-behind-a-corporate-proxy.md
 * Ref: https://gist.github.com/zicklag/1bb50db6c5138de347c224fda14286da (to support 'no_proxy')
 */
export function configureCorporateProxyAgent() {
  // Bootstrap global-agent, which addresses node-fetch proxy-ing.
  // global-agent purposely uses namespaced env vars to prevent conflicting behavior with other libraries,
  // but user can set GLOBAL_AGENT_ENVIRONMENT_VARIABLE_NAMESPACE to an empty value for global-agent to use
  // the conventional HTTP_PROXY, HTTPS_PROXY and NO_PROXY environment variables.
  // More details in https://github.com/gajus/global-agent#what-is-the-reason-global-agentbootstrap-does-not-use-http_proxy
  bootstrap();

  // Configure the undici package, which affects the native 'fetch'. It leverages the same env vars used by global-agent,
  // or the more conventional HTTP(S)_PROXY ones.
  const proxyEnv =
    process.env.GLOBAL_AGENT_HTTP_PROXY ??
    process.env.GLOBAL_AGENT_HTTPS_PROXY ??
    process.env.HTTP_PROXY ??
    process.env.http_proxy ??
    process.env.HTTPS_PROXY ??
    process.env.https_proxy;

  if (proxyEnv) {
    const proxyUrl = new URL(proxyEnv);

    // Create an access token if the proxy requires authentication
    let token: string | undefined = undefined;
    if (proxyUrl.username && proxyUrl.password) {
      const b64 = Buffer.from(
        `${proxyUrl.username}:${proxyUrl.password}`,
      ).toString('base64');
      token = `Basic ${b64}`;
    }

    // Create a default agent that will be used for no_proxy origins
    const defaultAgent = new Agent();

    // Create an interceptor that will use the appropriate agent based on the origin and the no_proxy
    // environment variable.
    // Collect the list of domains that we should not use a proxy for.
    // The only wildcard available is a single * character, which matches all hosts, and effectively disables the proxy.
    const noProxyEnv =
      process.env.GLOBAL_AGENT_NO_PROXY ??
      process.env.NO_PROXY ??
      process.env.no_proxy;
    const noProxyList = noProxyEnv?.split(',') || [];

    const isNoProxy = (origin?: string): boolean => {
      for (const exclusion of noProxyList) {
        if (exclusion === '*') {
          // Effectively disables proxying
          return true;
        }
        // Matched as either a domain which contains the hostname, or the hostname itself.
        if (origin === exclusion || origin?.endsWith(`.${exclusion}`)) {
          return true;
        }
      }
      return false;
    };

    const noProxyInterceptor = (
      dispatch: Dispatcher['dispatch'],
    ): Dispatcher['dispatch'] => {
      return (opts, handler) => {
        return isNoProxy(opts.origin?.toString())
          ? defaultAgent.dispatch(opts, handler)
          : dispatch(opts, handler);
      };
    };

    // Create a proxy agent that will send all requests through the configured proxy, unless the
    // noProxyInterceptor bypasses it.
    const proxyAgent = new ProxyAgent({
      uri: proxyUrl.protocol + proxyUrl.host,
      token,
      interceptors: {
        Client: [noProxyInterceptor],
      },
    });

    // Make sure our configured proxy agent is used for all `fetch()` requests globally.
    setGlobalDispatcher(proxyAgent);
  }
}
