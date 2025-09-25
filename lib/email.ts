import 'server-only';
import type { ReactElement } from 'react';

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

let cachedRenderer: typeof import('react-dom/server').renderToStaticMarkup | null = null;

async function getRenderer(): Promise<
  typeof import('react-dom/server').renderToStaticMarkup
> {
  if (cachedRenderer) {
    return cachedRenderer;
  }

  const reactDomServer = await import('react-dom/server');
  if (typeof reactDomServer.renderToStaticMarkup !== 'function') {
    throw new Error('react-dom/server does not expose renderToStaticMarkup');
  }

  cachedRenderer = reactDomServer.renderToStaticMarkup;
  return cachedRenderer;
}

export async function renderEmail(element: ReactElement): Promise<string> {
  const renderToStaticMarkup = await getRenderer();
  const markup = renderToStaticMarkup(element);
  return `<!DOCTYPE html>${markup}`;
}
