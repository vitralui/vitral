import { reactive } from 'vue';

/** Northgate Homes: a made-up agency in a made-up harbour town. */
export type HomeType = 'House' | 'Apartment' | 'Townhouse' | 'Cottage';

export interface Listing {
    id: number;
    title: string;
    address: string;
    area: string;
    type: HomeType;
    price: number;
    beds: number;
    baths: number;
    size: number;
    year: number;
    photos: number[];
    badge?: string;
    /** Where the pin sits on the drawn map, in percent. */
    x: number;
    y: number;
    amenities: string[];
}

const interiors = [625, 1008, 1059, 311, 305, 534];

export const listings: Listing[] = [
    {
        id: 1,
        title: 'Brick townhouse by the canal',
        address: '18 Lantern Row',
        area: 'Old Harbour',
        type: 'Townhouse',
        price: 845000,
        beds: 3,
        baths: 2,
        size: 164,
        year: 1908,
        photos: [437, ...interiors],
        badge: 'New',
        x: 22,
        y: 38,
        amenities: ['Roof terrace', 'Original floors', 'Bike storage', 'Fireplace']
    },
    {
        id: 2,
        title: 'Canal-side apartment with balcony',
        address: '4B Quay Street',
        area: 'Old Harbour',
        type: 'Apartment',
        price: 495000,
        beds: 2,
        baths: 1,
        size: 86,
        year: 1995,
        photos: [164, ...interiors.slice(2)],
        x: 30,
        y: 52,
        amenities: ['Balcony', 'Lift', 'Water view']
    },
    {
        id: 3,
        title: 'Whitewashed house above the bay',
        address: '7 Cliff Lane',
        area: 'Seaview',
        type: 'House',
        price: 1250000,
        beds: 4,
        baths: 3,
        size: 240,
        year: 2011,
        photos: [947, ...interiors],
        badge: 'Open house',
        x: 70,
        y: 22,
        amenities: ['Sea view', 'Pool', 'Garage', 'Solar panels']
    },
    {
        id: 4,
        title: 'Colourful row house near the market',
        address: '52 Market Hill',
        area: 'Midtown',
        type: 'Townhouse',
        price: 610000,
        beds: 3,
        baths: 2,
        size: 128,
        year: 1932,
        photos: [369, ...interiors.slice(1)],
        x: 48,
        y: 44,
        amenities: ['Courtyard', 'Home office', 'Near transit']
    },
    {
        id: 5,
        title: 'Green-door flat in a listed building',
        address: '3 Chapel Yard',
        area: 'Midtown',
        type: 'Apartment',
        price: 385000,
        beds: 1,
        baths: 1,
        size: 58,
        year: 1880,
        photos: [946, ...interiors.slice(3)],
        x: 55,
        y: 60,
        amenities: ['High ceilings', 'Shared garden']
    },
    {
        id: 6,
        title: 'Timber cottage at the edge of the woods',
        address: 'Fernbrook Cottage',
        area: 'Fernbrook',
        type: 'Cottage',
        price: 420000,
        beds: 2,
        baths: 1,
        size: 92,
        year: 1964,
        photos: [76, ...interiors],
        badge: 'Price cut',
        x: 82,
        y: 70,
        amenities: ['Wood stove', 'Large plot', 'Workshop']
    },
    {
        id: 7,
        title: 'Hillside villa with terraces',
        address: '11 Windmill Road',
        area: 'Seaview',
        type: 'House',
        price: 1480000,
        beds: 5,
        baths: 4,
        size: 310,
        year: 2018,
        photos: [49, ...interiors.slice(1)],
        x: 64,
        y: 34,
        amenities: ['Terraces', 'Sea view', 'Heat pump', 'Two parking spaces']
    },
    {
        id: 8,
        title: 'Estate house with a walled garden',
        address: 'The Old Rectory',
        area: 'Fernbrook',
        type: 'House',
        price: 1890000,
        beds: 6,
        baths: 4,
        size: 420,
        year: 1790,
        photos: [142, ...interiors],
        x: 88,
        y: 48,
        amenities: ['Walled garden', 'Library', 'Stables', 'Cellar']
    }
];

export const areas = ['Old Harbour', 'Midtown', 'Seaview', 'Fernbrook'];
export const homeTypes: HomeType[] = ['House', 'Apartment', 'Townhouse', 'Cottage'];

export const agent = { name: 'Elena Marsh', initials: 'EM', phone: '+1 555 0142', photo: 64 };

export const search = reactive({
    listingId: 1,
    area: null as string | null,
    types: [] as HomeType[],
    price: [300000, 2000000] as number[],
    beds: 'Any'
});

export const listingOf = (id: number) => listings.find((listing) => listing.id === id) ?? listings[0]!;

export function filtered() {
    const minBeds = search.beds === 'Any' ? 0 : Number.parseInt(search.beds, 10);
    return listings.filter(
        (listing) =>
            (!search.area || listing.area === search.area) &&
            (search.types.length === 0 || search.types.includes(listing.type)) &&
            listing.price >= search.price[0]! &&
            listing.price <= search.price[1]! &&
            listing.beds >= minBeds
    );
}

export const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const shortPrice = (value: number) => (value >= 1e6 ? `$${(value / 1e6).toFixed(2).replace(/0$/, '')}M` : `$${Math.round(value / 1000)}K`);
