import Link from 'next/link';
import type { ReactElement } from 'react';

export default function Home(): ReactElement {
  return (
    <section>
      <h1>Welcome to Stroman Properties</h1>
      <p>Browse our exclusive listings.</p>
      <Link href="/property">View Featured Property</Link>
    </section>
  );
}