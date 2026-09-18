// Food & drink: meals, drinks and the kitchen.
// Drawn on the 24×24 grid: 2-unit round strokes, no fill, about 2 units of margin.
import type { IconDef } from '../types';

const category = 'food';

export const coffee: IconDef = { name: 'coffee', category, tags: ['cafe', 'cup', 'drink', 'break'], body: '<path d="M4 8h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 9h1a3 3 0 0 1 0 6h-1M8 2v2M12 2v2M3 22h15"/>' };
export const cupSoda: IconDef = { name: 'cupSoda', category, tags: ['drink', 'soft drink', 'straw'], body: '<path d="M5 7h14l-2 15H7zM5.5 11h13M12 7l2-5h3"/>' };
export const wine: IconDef = { name: 'wine', category, tags: ['glass', 'drink', 'alcohol'], body: '<path d="M8 22h8M12 15v7M7 2h10l.5 6a5.5 5.5 0 0 1-11 0zM6.7 7h10.6"/>' };
export const beer: IconDef = { name: 'beer', category, tags: ['mug', 'drink', 'pub'], body: '<path d="M5 7h11v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM16 10h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M5 7a3 3 0 0 1 3-4 3.5 3.5 0 0 1 5.5 0A3 3 0 0 1 16 7M8.5 11v7M12.5 11v7"/>' };
export const martini: IconDef = { name: 'martini', category, tags: ['cocktail', 'bar', 'drink'], body: '<path d="M3 3h18l-9 10zM12 13v8M7 21h10M16 3l3-2"/>' };
export const glassWater: IconDef = { name: 'glassWater', category, tags: ['water', 'drink', 'hydrate'], body: '<path d="M5 2h14l-2 18a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2zM6 9c2-1 4-1 6 0s4 1 6 0"/>' };
export const milk: IconDef = { name: 'milk', category, tags: ['dairy', 'bottle', 'carton'], body: '<path d="M8 2h8M9 2v3l-2 3v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V8l-2-3V2M7 13h10"/>' };
export const pizza: IconDef = { name: 'pizza', category, tags: ['slice', 'food', 'italian'], body: '<path d="M3 6.5A20 20 0 0 1 21 6.5L12 22zM4.5 9.5a17 17 0 0 1 15 0M9 11h.01M14 12.5h.01M11.5 16h.01"/>' };
export const burger: IconDef = { name: 'burger', category, tags: ['hamburger', 'fast food'], body: '<path d="M4 10a8 6 0 0 1 16 0zM3 13.5h18M4 17h16v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM9 7h.01M13 6h.01M15 8h.01"/>' };
export const sandwich: IconDef = { name: 'sandwich', category, tags: ['toast', 'lunch', 'bread'], body: '<path d="M3 11l9-7 9 7M4 11h16v3H4zM5 14v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"/>' };
export const utensils: IconDef = { name: 'utensils', category, tags: ['restaurant', 'fork', 'knife', 'eat'], body: '<path d="M4 2v7a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V2M7 2v20M18 22V2c-2.5 0-4 3-4 7v4h4"/>' };
export const chefHat: IconDef = { name: 'chefHat', category, tags: ['cook', 'kitchen', 'restaurant'], body: '<path d="M17 21.5v-6.2a4 4 0 0 0 1-7.9 6 6 0 0 0-12 0 4 4 0 0 0 1 7.9v6.2zM7 17.5h10"/>' };
export const cookingPot: IconDef = { name: 'cookingPot', category, tags: ['kitchen', 'stew', 'soup'], body: '<path d="M2 12h20M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M4 8h16M12 5V3M9 8V6.5a3 3 0 0 1 6 0V8"/>' };
export const soup: IconDef = { name: 'soup', category, tags: ['bowl', 'meal', 'hot'], body: '<path d="M3 11h18a9 9 0 0 1-18 0zM7 21h10M9 7c0-1.5 1-1.5 1-3M13 7c0-1.5 1-1.5 1-3"/>' };
export const iceCream: IconDef = { name: 'iceCream', category, tags: ['dessert', 'cone', 'sweet'], body: '<path d="M7 10l5 12 5-12M7 10a5 5 0 0 1 10 0zM6 10h12"/>' };
export const cake: IconDef = { name: 'cake', category, tags: ['birthday', 'dessert', 'party'], body: '<path d="M4 21v-8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8M4 15.5c1.3 1 2.7 1 4 0s2.7-1 4 0 2.7 1 4 0 2.7-1 4 0M2 21h20M12 11V8M12 5.5c-1 0-1.5-.7-1.5-1.5S12 2 12 2s1.5 1.2 1.5 2-.5 1.5-1.5 1.5z"/>' };
export const cookie: IconDef = { name: 'cookie', category, tags: ['biscuit', 'snack', 'cookies'], body: '<path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5zM8.5 8.5h.01M16 15.5h.01M12 12h.01M11 17h.01M7 14h.01"/>' };
export const croissant: IconDef = { name: 'croissant', category, tags: ['bakery', 'breakfast', 'pastry'], body: '<path d="M4 15a8 8 0 0 0 16 0c0-3-2-5-4-5.5-1 2.5-2.5 3.5-4 3.5s-3-1-4-3.5C6 10 4 12 4 15zM9 13.5l-1 5.5M15 13.5l1 5.5M12 14v8"/>' };
export const egg: IconDef = { name: 'egg', category, tags: ['breakfast', 'protein'], body: '<path d="M12 22c-4.5 0-7-3-7-7.5C5 9 8 2 12 2s7 7 7 12.5c0 4.5-2.5 7.5-7 7.5z"/>' };
export const eggFried: IconDef = { name: 'eggFried', category, tags: ['breakfast', 'cooking'], body: '<path d="M11.5 3C16 3 18 5.5 18 8c3 .5 4 3 3.5 5.5-.5 3-3 4-5 4.5-1 3-4 4.5-7 3.5S3 17 3 13.5C3 10 4.5 8 6 7c.5-2.5 2.5-4 5.5-4z"/><circle cx="12" cy="12" r="3"/>' };
export const carrot: IconDef = { name: 'carrot', category, tags: ['vegetable', 'healthy'], body: '<path d="M2.5 21.5s6.5-2 12-7.5c1.7-1.7 1.7-4.5 0-6.3s-4.5-1.7-6.2 0C2.8 13.2 2.5 21.5 2.5 21.5zM8.5 14.5L7 13M10 9l2 2M14.5 7.5L17 5M16.5 9.5L21 8M14.5 7.5L16 3"/>' };
export const cherry: IconDef = { name: 'cherry', category, tags: ['fruit', 'berries'], body: '<circle cx="7" cy="17" r="4"/><circle cx="17" cy="17" r="4"/><path d="M7 13c0-5 3-8 7-10M17 13c0-4-1-7-3-10M13 3.5c2-1 4-1 6 0"/>' };
export const grape: IconDef = { name: 'grape', category, tags: ['fruit', 'wine', 'vineyard'], body: '<circle cx="9" cy="10" r="2.5"/><circle cx="15" cy="10" r="2.5"/><circle cx="12" cy="14.5" r="2.5"/><circle cx="6.5" cy="14.5" r="2.5"/><circle cx="17.5" cy="14.5" r="2.5"/><circle cx="9.5" cy="19" r="2.5"/><circle cx="14.5" cy="19" r="2.5"/><path d="M12 7.5V2.5l3-1"/>' };
export const banana: IconDef = { name: 'banana', category, tags: ['fruit', 'snack'], body: '<path d="M4 13c3.5 1 7.5 0 10.5-3.5 1.5-1.8 2-4 2-6.5M5 13c-2 1-2 3 0 4.5 4.5 3 12.5 1 14.5-7 .8-3 .5-5.5-1-7.5M16.5 3l1-1.5 1 1"/>' };
export const citrus: IconDef = { name: 'citrus', category, tags: ['lemon', 'orange', 'fruit'], body: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6.5"/><path d="M12 5.5v13M5.5 12h13M7.4 7.4l9.2 9.2M16.6 7.4l-9.2 9.2"/>' };
export const wheat: IconDef = { name: 'wheat', category, tags: ['grain', 'bread', 'farm', 'gluten'], body: '<path d="M12 22V8M12 8c-2-1-2-4 0-6 2 2 2 5 0 6zM12 13c-3 0-4.5-2.5-4.5-4.5 2.5 0 4.5 1.5 4.5 4.5zM12 13c3 0 4.5-2.5 4.5-4.5-2.5 0-4.5 1.5-4.5 4.5zM12 18c-3 0-4.5-2.5-4.5-4.5 2.5 0 4.5 1.5 4.5 4.5zM12 18c3 0 4.5-2.5 4.5-4.5-2.5 0-4.5 1.5-4.5 4.5z"/>' };
export const candy: IconDef = { name: 'candy', category, tags: ['sweet', 'dessert', 'treat'], body: '<ellipse cx="12" cy="12" rx="5" ry="4"/><path d="M7.3 10.3L3 7.5v9l4.3-2.8M16.7 10.3L21 7.5v9l-4.7-2.8M10 8.5v7M14 8.5v7"/>' };
export const popcorn: IconDef = { name: 'popcorn', category, tags: ['cinema', 'snack', 'movie'], body: '<path d="M5 9l2 13h10l2-13zM9.5 9l.5 13M14.5 9l-.5 13M5 9a2.5 2.5 0 0 1 1.5-4.5A3 3 0 0 1 12 3a3 3 0 0 1 5.5 1.5A2.5 2.5 0 0 1 19 9"/>' };
export const forkKnife: IconDef = { name: 'forkKnife', category, tags: ['dining', 'eat', 'cutlery'], body: '<path d="M3 2v5a3 3 0 0 0 6 0V2M6 2v20M15 22V2c3 0 5 3 5 7v3h-5M18 12v10"/>' };
export const teapot: IconDef = { name: 'teapot', category, tags: ['tea', 'kettle', 'brew'], body: '<path d="M5 10h12v4a6 6 0 0 1-12 0zM17 12l4-3M5 12H3.5a1.5 1.5 0 0 0 0 3H5.5M9 10a2 2 0 0 1 4 0M4 22h14"/>' };
