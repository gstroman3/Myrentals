import { logger } from '@/lib/logging';

interface NotifyOptions {
  subject: string;
  body: string;
}

interface EmailDeliveryOptions extends NotifyOptions {
  to: string | string[];
  from?: string;
  context: string;
}

function getResendApiKey(): string | null {
  return process.env.RESEND_API_KEY ?? null;
}

function getDefaultFromAddress(): string {
  return process.env.BOOKINGS_NOTIFY_FROM ?? 'alerts@stroman-properties.com';
}

function normalizeRecipients(to: string | string[]): string[] {
  const raw = Array.isArray(to) ? to : [to];
  return raw
    .map((value) => value.trim())
    .filter((value) => Boolean(value));
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
    from: process.env.BOOKINGS_NOTIFY_FROM,
    subject: options.subject,
    body: options.body,
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
    from: process.env.BOOKINGS_NOTIFY_FROM,
    subject: options.subject,
    body: options.body,
    context: 'owner notification',
  });
}

export async function sendGuestNotification(
  recipient: string,
  options: NotifyOptions,
): Promise<void> {
  await sendEmail({
    to: recipient,
    from: process.env.BOOKINGS_GUEST_FROM ?? process.env.BOOKINGS_NOTIFY_FROM,
    subject: options.subject,
    body: options.body,
    context: 'guest notification',
  });
}

