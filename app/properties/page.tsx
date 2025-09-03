import Image from 'next/image';
import type { ReactElement } from 'react';
import Header from '@/components/Header';
import { properties } from '@/lib/properties';

export default function PropertiesPage(): ReactElement {
    const property = properties[0];
    return (
        <>
            <Header overlay/>
            <section className="gallery-page">
                {property.rooms.map((room) => (
                    <div key={room.title} className="room-section">
                        <h2>{room.title}</h2>
                        <div className="gallery-grid">
                            {room.images.map((img) => (
                                <Image
                                    key={img.src}
                                    src={img.src}
                                    alt={img.alt}
                                    width={600}
                                    height={400}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </section>
        </>
    );
}