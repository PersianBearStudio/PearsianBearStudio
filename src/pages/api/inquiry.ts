import { env as workersEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { handleInquiryRequest } from '../../lib/http';
import type { AppEnv } from '../../lib/types';

/**
 * POST /api/inquiry — project inquiry submission endpoint.
 *
 * Runs as a Cloudflare Pages Function (via the @astrojs/cloudflare
 * adapter) and is the ONLY server entry point of the form.
 *
 * Secrets and configuration are read from the Cloudflare runtime
 * environment (`cloudflare:workers`), which is populated from:
 *   - local development:  .dev.vars (git-ignored)
 *   - production:         Workers & Pages dashboard environment
 *                         variables / secrets
 * Client-visible code never receives any of these values.
 */

export const prerender = false;

function getEnv(): AppEnv {
  const runtimeEnv = workersEnv as Record<string, unknown>;
  const read = (key: keyof AppEnv): string | undefined => {
    const value = runtimeEnv?.[key];
    return typeof value === 'string' ? value : undefined;
  };

  return {
    EMAIL_PROVIDER: read('EMAIL_PROVIDER'),
    RESEND_API_KEY: read('RESEND_API_KEY'),
    EMAIL_FROM: read('EMAIL_FROM'),
    INQUIRY_DESTINATION: read('INQUIRY_DESTINATION'),
  };
}

export const POST: APIRoute = async ({ request }) => {
  return handleInquiryRequest(request, getEnv());
};

// Anything that is not POST gets a clean 405 from the shared boundary.
export const ALL: APIRoute = async ({ request }) => {
  return handleInquiryRequest(request, getEnv());
};
