// Transport: cars, public transport, planes, boats and bikes.
// Drawn on the 24×24 grid: 2-unit round strokes, no fill, about 2 units of margin.
import type { IconDef } from '../types';

const category = 'transport';

export const car: IconDef = { name: 'car', category, tags: ['vehicle', 'auto', 'drive'], body: '<path d="M5 17H3v-5l2-5.5A2 2 0 0 1 6.9 5h10.2a2 2 0 0 1 1.9 1.5L21 12v5h-2M9 17h6M3 12h18"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>' };
export const carFront: IconDef = { name: 'carFront', category, tags: ['vehicle', 'auto', 'front view'], body: '<path d="M4 11l1.8-5.4A2 2 0 0 1 7.7 4h8.6a2 2 0 0 1 1.9 1.6L20 11M3 13a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4H3zM5 17v3M19 17v3M7 14h.01M17 14h.01"/>' };
export const bus: IconDef = { name: 'bus', category, tags: ['public transport', 'coach'], body: '<rect x="4" y="3" width="16" height="15" rx="2"/><path d="M4 11h16M4 7h16M8 18v3M16 18v3M7.5 14.5h.01M16.5 14.5h.01"/>' };
export const train: IconDef = { name: 'train', category, tags: ['railway', 'metro', 'public transport'], body: '<rect x="5" y="2" width="14" height="16" rx="3"/><path d="M5 10h14M12 2v8M8 22l2-4M16 22l-2-4M8.5 14h.01M15.5 14h.01"/>' };
export const tram: IconDef = { name: 'tram', category, tags: ['streetcar', 'light rail'], body: '<rect x="5" y="6" width="14" height="12" rx="3"/><path d="M5 12h14M9 2h6M12 2v4M8 22l2-4M16 22l-2-4M8.5 15h.01M15.5 15h.01"/>' };
export const plane: IconDef = { name: 'plane', category, tags: ['flight', 'airplane', 'travel'], body: '<path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>' };
export const planeTakeoff: IconDef = { name: 'planeTakeoff', category, tags: ['departure', 'flight'], body: '<path d="M2 22h20M3.5 13.5l2 2.5 3.5-1.5 11-4.5a2 2 0 0 0-1.5-3.7L14 8 8.5 4 6.5 5l3 4.5-4 1.5-2-1.5L2 10z"/>' };
export const planeLanding: IconDef = { name: 'planeLanding', category, tags: ['arrival', 'flight'], body: '<path d="M2 22h20M4 8l1.5 3.5 3.5 1.5 11 3.5a2 2 0 0 0 1.2-3.8L16 11 13 4.5l-2.2-.5.5 5.5-4-1.5-1-2.5L4 5z"/>' };
export const ship: IconDef = { name: 'ship', category, tags: ['boat', 'cruise', 'sea'], body: '<path d="M2 20c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0 1.5.5 2 .5M4 17l-1.5-5H21.5L20 17M6 12V7h12v5M12 4v3M9 4h6"/>' };
export const sailboat: IconDef = { name: 'sailboat', category, tags: ['boat', 'sailing', 'yacht'], body: '<path d="M2 18h20l-2 3H4zM12 2v16M12 3l7 12h-7M10 6L4 15h6"/>' };
export const anchor: IconDef = { name: 'anchor', category, tags: ['port', 'harbor', 'marine'], body: '<circle cx="12" cy="5" r="2.5"/><path d="M12 22V7.5M5 12H2a10 10 0 0 0 20 0h-3M8 11h8"/>' };
export const bike: IconDef = { name: 'bike', category, tags: ['bicycle', 'cycling', 'ride'], body: '<circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="M5.5 17l4-8h6l3 8M12 17l-3-8M15 6h2.5l-2 3M8 6h3"/>' };
export const scooter: IconDef = { name: 'scooter', category, tags: ['kick scooter', 'ride'], body: '<circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 19h10M17 4h-3l3 15M13 4h1"/>' };
export const motorcycle: IconDef = { name: 'motorcycle', category, tags: ['motorbike', 'ride'], body: '<circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/><path d="M8 17h5l3-6h-5l-3 3H5M16 11l-2-5h3M16 11l3 6"/>' };
export const truckDelivery: IconDef = { name: 'truckDelivery', category, tags: ['lorry', 'freight', 'delivery'], body: '<path d="M14 17V5H2v12h2M14 8h4l4 5v4h-2M9 17h6"/><circle cx="6.5" cy="17" r="2.5"/><circle cx="17.5" cy="17" r="2.5"/>' };
export const fuel: IconDef = { name: 'fuel', category, tags: ['gas station', 'petrol', 'diesel'], body: '<path d="M3 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M2 22h14M3 10h12M15 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0V9l-4-4"/>' };
export const chargingStation: IconDef = { name: 'chargingStation', category, tags: ['ev', 'electric car', 'charger'], body: '<path d="M3 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M2 22h14M15 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0V9l-4-4M10 6l-3 5h4l-3 5"/>' };
export const rocket: IconDef = { name: 'rocket', category, tags: ['launch', 'space', 'startup'], body: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1zM12 15l-3-3a22 22 0 0 1 2-4A13 13 0 0 1 22 2c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2zM9 12H4s.6-3 2-4c1.6-1 5 0 5 0M12 15v5s3-.6 4-2c1-1.6 0-5 0-5"/>' };
export const helicopter: IconDef = { name: 'helicopter', category, tags: ['chopper', 'aircraft'], body: '<path d="M3 4h14M10 4v4M5 8h8a5 5 0 0 1 5 5v1a2 2 0 0 1-2 2H9a4 4 0 0 1-4-4zM18 12h4M22 10v4M9 16l-1 3M15 16l1 3M5 19h14"/>' };
export const taxi: IconDef = { name: 'taxi', category, tags: ['cab', 'car', 'ride'], body: '<path d="M5 17H3v-5l2-5.5A2 2 0 0 1 6.9 5h10.2a2 2 0 0 1 1.9 1.5L21 12v5h-2M9 17h6M3 12h18M10 5V2.5h4V5"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>' };
export const footprints: IconDef = { name: 'footprints', category, tags: ['walk', 'steps', 'trail'], body: '<path d="M4 16v-2.4C4 11.5 3 10.5 3 8c0-2.7 1.5-6 4.5-6C9.4 2 10 3.8 10 5.5c0 3.1-2 5.7-2 8.7V16a2 2 0 1 1-4 0zM20 20v-2.4c0-2.1 1-3.1 1-5.6 0-2.7-1.5-6-4.5-6C14.6 6 14 7.8 14 9.5c0 3.1 2 5.7 2 8.7V20a2 2 0 1 0 4 0zM16 17h4M4 13h4"/>' };
