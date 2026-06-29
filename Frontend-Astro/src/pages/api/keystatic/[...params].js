import { makeGenericAPIRouteHandler } from '@keystatic/core/api/generic';
import { env } from 'cloudflare:workers';
import config from '../../../../keystatic.config';

const handler = makeGenericAPIRouteHandler(
  {
    config,
    clientId: env.KEYSTATIC_GITHUB_CLIENT_ID,
    clientSecret: env.KEYSTATIC_GITHUB_CLIENT_SECRET,
    secret: env.KEYSTATIC_SECRET,
  },
  {
    slugEnvName: 'PUBLIC_KEYSTATIC_GITHUB_APP_SLUG',
  }
);

export async function ALL(context) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const response = await originalFetch(input, init);
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    if (url.startsWith('https://github.com/login/oauth/access_token')) {
      try {
        const data = await response.clone().json();
        if (data?.error) {
          console.error('[keystatic] GitHub OAuth token exchange failed', {
            error: data.error,
            error_description: data.error_description,
            error_uri: data.error_uri,
          });
        }
      } catch {
        console.error('[keystatic] GitHub OAuth token exchange returned a non-JSON response', {
          status: response.status,
          statusText: response.statusText,
        });
      }
    }

    return response;
  };

  const { body, headers, status } = await handler(context.request).finally(() => {
    globalThis.fetch = originalFetch;
  });

  return new Response(body, {
    status,
    headers,
  });
}

export const all = ALL;
export const prerender = false;
