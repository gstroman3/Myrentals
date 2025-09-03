import Link from 'next/link';
import Image from 'next/image';
import type { ReactElement } from 'react';
import Header from '@/components/Header';
import { properties } from '@/lib/properties';

export default function PropertiesPage(): ReactElement {
  return (
    <>
      <Header />
      <section>
        <h1>Available Properties</h1>
        <div className="gallery">
          {properties.map((property) => (
            <div key={property.slug} className="card">
              <Image
                src={property.hero.src}
                alt={property.hero.alt}
                width={400}
                height={300}
              />
              <h2>{property.title}</h2>
              <p>{property.location}</p>
              <Link href={`/properties/${property.slug}`} className="btn">
                View Details
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}