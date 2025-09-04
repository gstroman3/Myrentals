export type RoomImage = {
  src: string;
  alt: string;
};

export type Room = {
  title: string;
  images: RoomImage[];
};

export type Property = {
  slug: string;
  title: string;
  location: string;
  hero: RoomImage;
  rooms: Room[];
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
};

export const properties: Property[] = [
  {
    slug: 'ashburn-estate',
    title: 'Ashburn Estate',
    location: 'Ashburn, VA',
    hero: { src: '/images/front-house/front-right.jpg', alt: 'Luxury home exterior' },
    guests: 10,
    bedrooms: 3,
    beds: 4,
    bathrooms: 3.5,
    rooms: [
      {
        title: 'Kitchen',
        images: [
          { src: '/images/kitchen/IMG_0186.jpg', alt: 'Kitchen 1' },
          { src: '/images/kitchen/IMG_0187.jpg', alt: 'Kitchen 2' },
          { src: '/images/kitchen/IMG_0188.jpg', alt: 'Kitchen 3' },
        ],
      },
      {
        title: 'Living Room',
        images: [
          { src: '/images/living-room/IMG_0190.jpg', alt: 'Living room 1' },
          { src: '/images/living-room/IMG_0191.jpg', alt: 'Living room 2' },
        ],
      },
      {
        title: 'Dining',
        images: [{ src: '/images/dining/IMG_0189.jpg', alt: 'Dining Room' }],
      },
      {
        title: 'Deck',
        images: [
          { src: '/images/deck/IMG_1763.jpg', alt: 'Deck 1' },
          { src: '/images/deck/IMG_1765.jpg', alt: 'Deck 2' },
        ],
      },
      {
        title: 'Master Bedroom',
        images: [
          { src: '/images/master-bed/IMG_1746.jpg', alt: 'Master bedroom 1' },
          { src: '/images/master-bed/IMG_1749.jpg', alt: 'Master bedroom 2' },
          { src: '/images/master-bed/IMG_1750.jpg', alt: 'Master bedroom 3' },
          { src: '/images/master-bed/closet.jpg', alt: 'Master bedroom 4' },

        ],
      },
      {
        title: 'Guest Bedroom One',
        images: [
          { src: '/images/guest-bedroom-one/IMG_1206.jpg', alt: 'Guest bedroom one 1' },
          { src: '/images/guest-bedroom-one/IMG_1208.jpg', alt: 'Guest bedroom one 2' },
        ],
      },
      {
        title: 'Guest Bedroom Two',
        images: [
          { src: '/images/guest-bedroom-two/IMG_1212.jpg', alt: 'Guest bedroom two 1' },
          { src: '/images/guest-bedroom-two/IMG_1213.jpg', alt: 'Guest bedroom two 2' },
        ],
      },
      {
        title: 'Shared Guest Bath',
        images: [
          { src: '/images/shared-guest-bath/IMG_1217.jpg', alt: 'Shared guest bath' },
        ],
      },
      {
        title: 'Loft',
        images: [
          { src: '/images/loft/IMG_1751.jpg', alt: 'Loft 1' },
          { src: '/images/loft/IMG_1752.jpg', alt: 'Loft 2' },
          { src: '/images/loft/IMG_1754.jpg', alt: 'Loft 3' },
          { src: '/images/loft/IMG_1755.jpg', alt: 'Loft 4' },
          { src: '/images/loft/IMG_1756.jpg', alt: 'Loft 5' },
          { src: '/images/loft/IMG_1757.jpg', alt: 'Loft 6' },
        ],
      },
      {
        title: 'First Floor Bath',
        images: [
          { src: '/images/first-floor-bath/IMG_0204.jpg', alt: 'First floor bath 1' },
          { src: '/images/first-floor-bath/IMG_0210.jpg', alt: 'First floor bath 2' },
        ],
      },
      {
        title: 'Weight Room',
        images: [{ src: '/images/weight-room/IMG_0212.jpg', alt: 'Weight room' }],
      },

      {
        title: 'Sauna',
        images: [{ src: '/images/sauna/IMG_0195.jpg', alt: 'Sauna' }],
      },
      {
        title: 'Front of House',
        images: [
          { src: '/images/front-house/front-center.jpg', alt: 'Front 1' },
          { src: '/images/front-house/front-right.jpg', alt: 'Front 2' },
        ],
      },
      {
        title: 'Backyard',
        images: [
          { src: '/images/backyard/IMG_0198.jpg', alt: 'Backyard view' },
          { src: '/images/backyard/IMG_0201.jpg', alt: 'Backyard view 2' },
        ],
      },
    ],
  },
];

export function getPropertyBySlug(slug: string): Property | undefined {
  return properties.find((p) => p.slug === slug);
}