import type { Metadata } from 'next';
import HomePage from '@/components/HomePage';

export const metadata: Metadata = {
  openGraph: {
    title: 'Stroman Properties',
    description: 'Luxury vacation rentals',
    images: ['/images/logo_navy_background.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/images/logo_navy_background.png'],
  },
};

export default function Home() {
  return <HomePage />;
}