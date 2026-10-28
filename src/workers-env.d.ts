/**
 * Ambient declaration for the `cloudflare:workers` module provided by
 * the Cloudflare runtime (workerd) at dev time — through the
 * @astrojs/cloudflare adapter — and in production on Pages.
 *
 * Only the surface this project uses is declared. Values arrive from
 * .dev.vars locally and from dashboard variables/secrets in production.
 */
declare module 'cloudflare:workers' {
  export const env: Record<string, string | undefined>;
}
