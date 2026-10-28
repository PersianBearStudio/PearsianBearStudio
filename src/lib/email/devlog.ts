/**
 * Development transport — prints the fully composed notification to the
 * dev-server console instead of sending anything.
 *
 * Only ever active when EMAIL_PROVIDER=dev-log is set explicitly
 * (the local .dev.vars does this). It exists so the whole flow —
 * validation, composition, escaping, reply-to — can be exercised and
 * reviewed without provider credentials, and so automated tests have
 * something deterministic to assert against.
 *
 * The output is clearly fenced and never claims real delivery.
 */

import type { OutgoingEmail, SendResult } from './transport';

export type DevLogEmail = OutgoingEmail;

export async function sendWithDevLog(
  email: DevLogEmail,
): Promise<SendResult> {
  const line = '─'.repeat(64);
  const blocks: string[] = [
    '',
    line,
    '[dev-log transport] NOT SENT — notification preview only',
    line,
    `From:    ${email.from}`,
    `To:      ${email.to}`,
    `Reply-To: ${email.replyTo ?? '(none)'}`,
    `Subject: ${email.subject}`,
    '',
    email.text,
    '',
    line,
  ];
  console.info(blocks.join('\n'));
  return { accepted: true };
}
