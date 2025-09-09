'use client';

import Image from 'next/image';
import { type ReactElement, useEffect, useState } from 'react';
import Header from '@/components/Header';
import ScrollButtons from '@/components/ScrollButtons';
import SectionSlider from '@/components/SectionSlider';
import { properties, type RoomImage } from '@/lib/properties';

const heroSlides = [
    '/images/loft/IMG_1755.jpg',
    '/images/living-room/IMG_0190.jpg',
    '/images/loft/IMG_1751.jpg',
    '/images/master-bed/IMG_1746.jpg',
    '/images/sauna/IMG_0195.jpg',
];

export default function PropertiesPage(): ReactElement {
    const property = properties[0];
    const sections = property.rooms.map((room) => ({
        id: room.title.toLowerCase().replace(/\s+/g, '-'),
        label: room.title,
    }));

    type LightboxImage = RoomImage & { room: string };
    const allImages: LightboxImage[] = property.rooms.flatMap((room) =>
        room.images.map((img) => ({ ...img, room: room.title }))
    );

    const getImageIndex = (src: string): number =>
        allImages.findIndex((img) => img.src === src);

    const [heroIndex, setHeroIndex] = useState(0);
    useEffect(() => {
        const id = setInterval(() => {
            setHeroIndex((i) => (i + 1) % heroSlides.length);
        }, 5000);
        return () => clearInterval(id);
    }, []);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const openLightbox = (index: number) => {
        setCurrentIndex(index);
        setIsOpen(true);
    };

    const closeLightbox = () => setIsOpen(false);

    const showPrev = () =>
        setCurrentIndex((i) => (i - 1 + allImages.length) % allImages.length);
    const showNext = () =>
        setCurrentIndex((i) => (i + 1) % allImages.length);
    return (
        <>
           <Header overlay />
           <ScrollButtons slug={property.slug} />
            <section className="gallery-hero">
                <div className="background">
                    {heroSlides.map((src, i) => (
                        <Image
                            key={src}
                            src={src}
                            alt=""
                            fill
                            priority={i === 0}
                            className={`slide${i === heroIndex ? ' active' : ''}`}
                        />
                    ))}
                </div>
                <div className="content">
                    <h1>Luxe Townhome</h1>
                    <p>Ashburn, VA</p>
                    <div className="details">
                        <span> {property.guests} guests</span>
                        <span>&bull;</span>
                        <span>{property.bedrooms} bedrooms</span>
                        <span>&bull;</span>
                        <span>{property.bathrooms} baths</span>

                    </div>
                </div>
            </section>
            <section className="gallery-page">
                {property.rooms.map((room) => (
                    <div
                        key={room.title}
                        id={room.title.toLowerCase().replace(/\s+/g, '-')}
                        className="room-section"
                    >
                        <h2>{room.title}</h2>
                        <div className="gallery-grid">
                            {room.images.map((img) => (
                                <div key={img.src} className="gallery-item">
                                    <Image
                                        src={img.src}
                                        alt={img.alt}
                                        fill
                                        sizes="(max-width: 600px) 100vw, 300px"
                                        style={{ objectFit: 'cover' }}
                                        onClick={() => openLightbox(getImageIndex(img.src))}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </section>
            {isOpen && (
                <div className="lightbox" onClick={closeLightbox} role="dialog" aria-modal="true">
                    <button className="lightbox-nav prev" onClick={(e) => { e.stopPropagation(); showPrev(); }} aria-label="Previous image">
                        &#10094;
                    </button>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={allImages[currentIndex].src}
                            alt={allImages[currentIndex].alt}
                            width={0}
                            height={0}
                            sizes="90vw"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                        <div className="lightbox-caption">{allImages[currentIndex].room}</div>
                    </div>
                    <button className="lightbox-nav next" onClick={(e) => { e.stopPropagation(); showNext(); }} aria-label="Next image">
                        &#10095;
                    </button>
                    <button className="lightbox-close" onClick={(e) => { e.stopPropagation(); closeLightbox(); }} aria-label="Close gallery">
                        &times;
                    </button>
                </div>
            )}
            <SectionSlider sections={sections} />
        </>
    );
}