import { logger } from '@/lib/logging';

interface NotifyOptions {
  subject: string;
  body: string;
  html?: string;
}

interface EmailDeliveryOptions extends NotifyOptions {
  to: string | string[];
  from?: string;
  bcc?: string | string[];
  context: string;
}

function getResendApiKey(): string | null {
  return process.env.RESEND_API_KEY ?? null;
}

function getDefaultFromAddress(): string {
  const from =
    process.env.BOOKINGS_FROM_EMAIL ??
    process.env.BOOKINGS_NOTIFY_FROM ??
    'bookings@stromanproperties.com';
  return from.trim() || 'bookings@stromanproperties.com';
}

function normalizeRecipients(to: string | string[]): string[] {
  const raw = Array.isArray(to) ? to : [to];
  return raw
    .map((value) => value.trim())
    .filter((value) => Boolean(value));
}

function mergeRecipients(
  ...groups: Array<string | string[] | null | undefined>
): string[] {
  const collected = groups.flatMap((group) => {
    if (!group) return [];
    return normalizeRecipients(Array.isArray(group) ? group : [group]);
  });
  return Array.from(new Set(collected));
}

async function sendEmail(options: EmailDeliveryOptions): Promise<void> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    logger.debug(`Skipping ${options.context} email because RESEND_API_KEY is not configured`);
    return;
  }

  const recipients = normalizeRecipients(options.to);
  if (!recipients.length) {
    logger.debug(`Skipping ${options.context} email because no recipients were provided`);
    return;
  }

  const payload = {
    from: options.from?.trim() || getDefaultFromAddress(),
    to: recipients,
    subject: options.subject,
    text: options.body,
    html: options.html,
    bcc: options.bcc ? normalizeRecipients(options.bcc) : undefined,
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Resend request failed (${response.status}): ${text}`);
    }
  } catch (error) {
    logger.error(`Failed to send ${options.context} email`, error);
  }
}

function getOwnerRecipient(): string | null {
  return process.env.BOOKINGS_NOTIFY_TO ?? null;
}

export async function sendFailureNotification(options: NotifyOptions): Promise<void> {
  const to = getOwnerRecipient();
  if (!to) {
    logger.debug('Skipping failure notification because BOOKINGS_NOTIFY_TO is not set');
    return;
  }
  await sendEmail({
    to,
    from: getDefaultFromAddress(),
    subject: options.subject,
    body: options.body,
    html: options.html,
    context: 'failure notification',
  });
}

export async function sendOwnerNotification(options: NotifyOptions): Promise<void> {
  const to = getOwnerRecipient();
  if (!to) {
    logger.debug('Skipping owner notification because BOOKINGS_NOTIFY_TO is not set');
    return;
  }
  await sendEmail({
    to,
    from: getDefaultFromAddress(),
    subject: options.subject,
    body: options.body,
    html: options.html,
    context: 'owner notification',
  });
}

interface GuestNotifyOptions extends NotifyOptions {
  bcc?: string | string[];
  bccOwner?: boolean;
}

export async function sendGuestNotification(
  recipient: string,
  options: GuestNotifyOptions,
): Promise<void> {
  const ownerBcc = options.bccOwner ? getOwnerRecipient() : null;
  const bcc = mergeRecipients(options.bcc, ownerBcc);
  await sendEmail({
    to: recipient,
    from:
      process.env.BOOKINGS_FROM_EMAIL ??
      process.env.BOOKINGS_GUEST_FROM ??
      getDefaultFromAddress(),
    subject: options.subject,
    body: options.body,
    html: options.html,
    bcc: bcc.length ? bcc : undefined,
    context: 'guest notification',
  });
}

