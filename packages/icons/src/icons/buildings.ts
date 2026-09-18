// Home & buildings: places, rooms and household things.
// Drawn on the 24×24 grid: 2-unit round strokes, no fill, about 2 units of margin.
import type { IconDef } from '../types';

const category = 'buildings';

export const home: IconDef = { name: 'home', category, tags: ['house', 'start', 'main', 'dashboard'], body: '<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>' };
export const house: IconDef = { name: 'house', category, tags: ['home', 'residence', 'property'], body: '<path d="M2.5 11L12 3l9.5 8M5 9v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/><rect x="9.5" y="14" width="5" height="7" rx="1"/>' };
export const building: IconDef = { name: 'building', category, tags: ['office', 'company', 'business'], body: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>' };
export const buildings: IconDef = { name: 'buildings', category, tags: ['city', 'offices', 'enterprise'], body: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M6 12H4a2 2 0 0 0-2 2v8M18 9h2a2 2 0 0 1 2 2v11M2 22h20M10 6h4M10 10h4M10 14h4M10 18h4"/>' };
export const factory: IconDef = { name: 'factory', category, tags: ['industry', 'manufacturing', 'plant'], body: '<path d="M2 22V10l6 4v-4l6 4V4h6v18zM2 22h20M7 18h.01M12 18h.01M17 18h.01"/>' };
export const warehouse: IconDef = { name: 'warehouse', category, tags: ['storage', 'depot', 'logistics'], body: '<path d="M2 21V8l10-5 10 5v13M6 21v-9h12v9M6 15h12M6 18h12"/>' };
export const store: IconDef = { name: 'store', category, tags: ['shop', 'market', 'retail'], body: '<path d="M3 9l1.5-5h15L21 9M3 9v1.5a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0V9zM5 13v8h14v-8M10 21v-5h4v5"/>' };
export const church: IconDef = { name: 'church', category, tags: ['religion', 'chapel', 'worship'], body: '<path d="M12 2v5M10 4h4M4 22V14l4-2.5V9l4-2 4 2v2.5l4 2.5v8M2 22h20M10 22v-4a2 2 0 0 1 4 0v4"/>' };
export const castle: IconDef = { name: 'castle', category, tags: ['fortress', 'palace', 'kingdom'], body: '<path d="M4 22V4h3v2h2.5V4h5v2H17V4h3v18M2 22h20M10 22v-5a2 2 0 0 1 4 0v5M4 11h16"/>' };
export const landmark: IconDef = { name: 'landmark', category, tags: ['museum', 'government', 'columns'], body: '<path d="M3 22h18M5 18h14M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l9 5v3H3V7z"/>' };
export const bed: IconDef = { name: 'bed', category, tags: ['sleep', 'hotel', 'bedroom'], body: '<path d="M2 4v16M2 17h20v3M2 11h18a2 2 0 0 1 2 2v4M6 11V8h6v3"/>' };
export const sofa: IconDef = { name: 'sofa', category, tags: ['couch', 'living room', 'furniture'], body: '<path d="M4 10V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2zM5 18v2M19 18v2"/>' };
export const armchair: IconDef = { name: 'armchair', category, tags: ['seat', 'furniture', 'chair'], body: '<path d="M6 11V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5M4 11a2 2 0 0 1 2 2v2h12v-2a2 2 0 0 1 4 0v5H2v-5a2 2 0 0 1 2-2zM5 18v3M19 18v3"/>' };
export const lamp: IconDef = { name: 'lamp', category, tags: ['light', 'desk lamp', 'furniture'], body: '<path d="M8 2h8l3 9H5zM12 11v8M8 22h8v-3H8z"/>' };
export const door: IconDef = { name: 'door', category, tags: ['entrance', 'exit', 'room'], body: '<path d="M5 22V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18M3 22h18M14 12h.01"/>' };
export const doorOpen: IconDef = { name: 'doorOpen', category, tags: ['enter', 'leave', 'exit'], body: '<path d="M13 4h4a2 2 0 0 1 2 2v16M2 22h20M13 4.5v17L5 20V4.8a1 1 0 0 1 .8-1l6-1.5a1 1 0 0 1 1.2 1zM10 12h.01"/>' };
export const bath: IconDef = { name: 'bath', category, tags: ['bathroom', 'tub', 'shower'], body: '<path d="M9 6L7.5 4.5a2.1 2.1 0 0 0-3.5 1.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5H2M7 19v2M17 19v2M10 5L8 7"/>' };
export const toilet: IconDef = { name: 'toilet', category, tags: ['restroom', 'wc', 'bathroom'], body: '<path d="M7 12V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v8M4 12h16a8 8 0 0 1-5 7.4V22H9v-2.6A8 8 0 0 1 4 12z"/>' };
export const keyHouse: IconDef = { name: 'keyHouse', category, tags: ['house key', 'rent', 'property'], body: '<circle cx="12" cy="7" r="5"/><path d="M12 12v10M12 18h3M12 15h2"/>' };
export const fence: IconDef = { name: 'fence', category, tags: ['garden', 'yard', 'boundary'], body: '<path d="M4 3L2 5v17h4V5zM12 3l-2 2v17h4V5zM20 3l-2 2v17h4V5zM6 8h4M6 16h4M14 8h4M14 16h4"/>' };
export const lightbulbOff: IconDef = { name: 'lightbulbOff', category, tags: ['light off', 'dark'], body: '<path d="M9 18h6M10 21.5h4M16.2 13.5A6.5 6.5 0 0 0 8.3 4.2M5.8 7.2a6.5 6.5 0 0 0 2.4 7.3c.8.7 1.3 1.6 1.3 2.6V18M3 3l18 18"/>' };
export const fan: IconDef = { name: 'fan', category, tags: ['air', 'cooling', 'ventilation'], body: '<path d="M10.8 11.2C9 9.5 8 6.5 9.5 4.3c1.6-2.3 5.5-1.8 5.8 1.4.2 2.3-1.8 4.3-3.1 5.4M12.8 10.8c1.7-1.8 4.7-2.8 6.9-1.3 2.3 1.6 1.8 5.5-1.4 5.8-2.3.2-4.3-1.8-5.4-3.1M13.2 12.8c1.8 1.7 2.8 4.7 1.3 6.9-1.6 2.3-5.5 1.8-5.8-1.4-.2-2.3 1.8-4.3 3.1-5.4M11.2 13.2c-1.7 1.8-4.7 2.8-6.9 1.3-2.3-1.6-1.8-5.5 1.4-5.8 2.3-.2 4.3 1.8 5.4 3.1"/><circle cx="12" cy="12" r="1"/>' };
export const washingMachine: IconDef = { name: 'washingMachine', category, tags: ['laundry', 'washer', 'appliance'], body: '<rect x="3" y="2" width="18" height="20" rx="2"/><circle cx="12" cy="13" r="5"/><path d="M7 6h.01M10 6h.01M9.5 14.5a3 3 0 0 0 4-2.5"/>' };
export const refrigerator: IconDef = { name: 'refrigerator', category, tags: ['fridge', 'kitchen', 'appliance'], body: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M5 10h14M9 5v2M9 13v3"/>' };
export const plant: IconDef = { name: 'plant', category, tags: ['houseplant', 'pot', 'decor'], body: '<path d="M7 14h10l-1.5 8h-7zM12 14V9M12 9c0-3-2-5-6-5 0 3 2 5 6 5zM12 11c0-3 2-6 6-6 0 4-2 6-6 6z"/>' };
export const hotel: IconDef = { name: 'hotel', category, tags: ['accommodation', 'stay', 'travel'], body: '<rect x="3" y="2" width="18" height="20" rx="2"/><path d="M9 6v6M15 6v6M9 9h6M10 22v-4h4v4"/>' };
