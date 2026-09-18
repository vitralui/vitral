// Maps & location: places, directions and the globe.
// Drawn on the 24×24 grid: 2-unit round strokes, no fill, about 2 units of margin.
import type { IconDef } from '../types';

const category = 'maps';

export const mapPin: IconDef = { name: 'mapPin', category, tags: ['location', 'marker', 'place', 'address'], body: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>' };
export const mapPinOff: IconDef = { name: 'mapPinOff', category, tags: ['no location', 'hide place'], body: '<path d="M6.3 6.3A7 7 0 0 0 5 10c0 5.5 7 12 7 12s2-1.9 3.8-4.5M17.8 14.2c.8-1.4 1.2-2.8 1.2-4.2a7 7 0 0 0-10.4-6.1M3 3l18 18"/>' };
export const mapPinPlus: IconDef = { name: 'mapPinPlus', category, tags: ['add location'], body: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><path d="M12 7v6M9 10h6"/>' };
export const mapPinCheck: IconDef = { name: 'mapPinCheck', category, tags: ['visited', 'confirmed place'], body: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><path d="M9 10l2 2 4-4"/>' };
export const map: IconDef = { name: 'map', category, tags: ['atlas', 'directions', 'route'], body: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14"/>' };
export const navigation: IconDef = { name: 'navigation', category, tags: ['direction', 'gps', 'arrow'], body: '<path d="M21 3L3 10.5l7.5 3 3 7.5z"/>' };
export const compass: IconDef = { name: 'compass', category, tags: ['direction', 'north', 'explore'], body: '<circle cx="12" cy="12" r="10"/><path d="M16 8l-2 6-6 2 2-6z"/>' };
export const globe: IconDef = { name: 'globe', category, tags: ['world', 'internet', 'earth', 'language'], body: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>' };
export const earth: IconDef = { name: 'earth', category, tags: ['planet', 'world', 'continents'], body: '<circle cx="12" cy="12" r="10"/><path d="M3 8.5h4.5l2 2.5-1 3 2 2v4.5M21 9h-4.5l-2 3 2 3h3.5M14 2.5l-1 2.5 2 1.5"/>' };
export const locate: IconDef = { name: 'locate', category, tags: ['gps', 'current position', 'target'], body: '<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22"/>' };
export const signpost: IconDef = { name: 'signpost', category, tags: ['direction', 'road sign', 'way'], body: '<path d="M12 3v18M8 21h8M5 5h11l3 2.5-3 2.5H5zM19 12H8l-3 2.5L8 17h11z"/>' };
export const milestone: IconDef = { name: 'milestone', category, tags: ['marker', 'goal', 'road'], body: '<path d="M12 13v8M12 3v3M4 6h13l3 3.5-3 3.5H4z"/>' };
export const route: IconDef = { name: 'route', category, tags: ['path', 'directions', 'trip'], body: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M9 19h7.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H15"/>' };
export const flagTriangle: IconDef = { name: 'flagTriangle', category, tags: ['goal', 'destination', 'checkpoint'], body: '<path d="M6 22V3l13 6-13 6"/>' };
export const mountain: IconDef = { name: 'mountain', category, tags: ['terrain', 'landscape', 'peak'], body: '<path d="M2 20L9 7l4 7 2-3 7 9zM7.5 10l2 2 1.5-1.5"/>' };
export const tent: IconDef = { name: 'tent', category, tags: ['camping', 'outdoors', 'shelter'], body: '<path d="M3.5 21L12 4l8.5 17zM12 21l-3-6h6l-3 6M2 21h20"/>' };
export const streetView: IconDef = { name: 'streetView', category, tags: ['person', 'walk', 'street'], body: '<circle cx="12" cy="5" r="2.5"/><path d="M9 21v-5H7.5V11a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v5H15v5M5 17.5c-2 .6-3 1.4-3 2.3 0 1.2 4.5 2.2 10 2.2s10-1 10-2.2c0-.9-1-1.7-3-2.3"/>' };
export const parking: IconDef = { name: 'parking', category, tags: ['car park', 'p', 'garage'], body: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>' };
export const trafficLight: IconDef = { name: 'trafficLight', category, tags: ['signal', 'stop', 'go'], body: '<rect x="7" y="2" width="10" height="20" rx="5"/><circle cx="12" cy="7" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="17" r="1.5"/>' };
