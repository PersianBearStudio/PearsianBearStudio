/**
 * PersianBearStudio — e-mail transport layer.
 *
 * The API endpoint composes ONE notification (see compose.ts) and hands
 * it to a transport selected from the environment:
 *
 *   EMAIL_PROVIDER=resend  → production, via the Resend HTTP API
 *                            (needs RESEND_API_KEY + EMAIL_FROM)
 *   EMAIL_PROVIDER=dev-log → local development; the notification is
 *                            printed to the server console only
 *
 * If EMAIL_PROVIDER is unset, a Resend transport is used when
 * RESEND_API_KEY + EMAIL_FROM are both present; otherwise the endpoint
 * reports 503 "not configured" instead of pretending to work.
 *
 * Transports never receive or return credentials, and failures are
 * reduced to an `errorKind` so raw provider responses (which could
 * reveal account details) never reach the client or logs.
 */

import type { AppEnv } from '../types';
import { sendWithDevLog } from './devlog';
import { sendWithResend } from './resend';

export interface OutgoingEmail {
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}

export type SendErrorKind =
  | 'auth'
  | 'invalid-sender'
  | 'rate-limit'
  | 'network'
  | 'unknown';

export interface SendResult {
  accepted: boolean;
  errorKind?: SendErrorKind;
}

export interface EmailTransport {
  readonly name: string;
  send(email: OutgoingEmail): Promise<SendResult>;
}

const devLogTransport: EmailTransport = {
  name: 'dev-log',
  send: (email) => sendWithDevLog(email),
};

export type TransportSelection =
  | { transport: EmailTransport }
  | {
      transport: null;
      reason: 'unknown-provider' | 'missing-key' | 'missing-from';
    };

/** Chooses the transport from environment configuration. */
export function getTransport(env: AppEnv): TransportSelection {
  const provider = (env.EMAIL_PROVIDER ?? '').trim().toLowerCase();

  if (provider === 'dev-log') return { transport: devLogTransport };

  const wantsResend =
    provider === 'resend' ||
    (provider === '' && env.RESEND_API_KEY && env.EMAIL_FROM);

  if (wantsResend) {
    if (!env.RESEND_API_KEY) return { transport: null, reason: 'missing-key' };
    if (!env.EMAIL_FROM) return { transport: null, reason: 'missing-from' };
    const key = env.RESEND_API_KEY;
    return {
      transport: {
        name: 'resend',
        send: (email) => sendWithResend(email, key),
      },
    };
  }

  if (provider !== '') {
    return { transport: null, reason: 'unknown-provider' };
  }
  return { transport: null, reason: 'missing-key' };
}
