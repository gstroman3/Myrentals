import { logger } from '@/lib/logging';

interface NotifyOptions {
  subject: string;
  body: string;
}

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.BOOKINGS_NOTIFY_TO;
  const from = process.env.BOOKINGS_NOTIFY_FROM ?? 'alerts@stroman-properties.com';
  if (!apiKey || !to) return null;
  return { apiKey, to, from };
}

export async function sendFailureNotification(options: NotifyOptions): Promise<void> {
  const config = getResendConfig();
  if (!config) {
    logger.debug('Skipping failure notification because email config is missing');
    return;
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.from,
        to: config.to,
        subject: options.subject,
        text: options.body,
      }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Resend request failed (${response.status}): ${text}`);
    }
  } catch (error) {
    logger.error('Failed to send failure notification', error);
  }
}

