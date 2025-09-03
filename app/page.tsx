import type { Metadata } from 'next';
import HomePage from '@/components/HomePage';

const LOGO_IMAGE = 'https://stromanproperties.com/images/logo_navy_background.png';

export const metadata: Metadata = {
  openGraph: {
    title: 'Stroman Properties',
    description: 'Luxury vacation rentals',
    images: [{ url: LOGO_IMAGE, alt: 'Stroman Properties logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [LOGO_IMAGE],
  },
};

export default function Home() {
  return <HomePage />;
}