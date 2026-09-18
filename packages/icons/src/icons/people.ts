// People & accounts: users, groups and faces.
// Drawn on the 24×24 grid: 2-unit round strokes, no fill, about 2 units of margin.
import type { IconDef } from '../types';

const category = 'people';

export const user: IconDef = { name: 'user', category, tags: ['person', 'account', 'profile'], body: '<circle cx="12" cy="8" r="4.5"/><path d="M4 21a8 8 0 0 1 16 0"/>' };
export const userPlus: IconDef = { name: 'userPlus', category, tags: ['add person', 'invite'], body: '<circle cx="10" cy="8" r="4"/><path d="M3 21a7 7 0 0 1 14 0"/><path d="M19 8v6M16 11h6"/>' };
export const userMinus: IconDef = { name: 'userMinus', category, tags: ['remove person'], body: '<circle cx="10" cy="8" r="4"/><path d="M3 21a7 7 0 0 1 14 0"/><path d="M16 11h6"/>' };
export const userCheck: IconDef = { name: 'userCheck', category, tags: ['verified person', 'approved'], body: '<circle cx="10" cy="8" r="4"/><path d="M3 21a7 7 0 0 1 14 0"/><path d="M16 11l2 2 4-4"/>' };
export const userX: IconDef = { name: 'userX', category, tags: ['remove person', 'block'], body: '<circle cx="10" cy="8" r="4"/><path d="M3 21a7 7 0 0 1 14 0"/><path d="M17 9l4 4M21 9l-4 4"/>' };
export const users: IconDef = { name: 'users', category, tags: ['group', 'team', 'people'], body: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4.1a4 4 0 0 1 0 7.8M19 14.5a7 7 0 0 1 3 6.5"/>' };
export const userCircle: IconDef = { name: 'userCircle', category, tags: ['avatar', 'account', 'profile'], body: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3.5"/><path d="M5.5 19.5a7.5 7.5 0 0 1 13 0"/>' };
export const userSquare: IconDef = { name: 'userSquare', category, tags: ['avatar', 'contact', 'profile'], body: '<path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><circle cx="12" cy="10" r="3.5"/><path d="M6 21a6 6 0 0 1 12 0"/>' };
export const userCog: IconDef = { name: 'userCog', category, tags: ['account settings', 'admin'], body: '<circle cx="10" cy="8" r="4"/><path d="M3 21a7 7 0 0 1 14 0"/><circle cx="19" cy="15" r="2"/><path d="M19 11.5v1.5M19 17v1.5M22 15h-1M17 15h-1"/>' };
export const userLock: IconDef = { name: 'userLock', category, tags: ['private account'], body: '<circle cx="10" cy="8" r="4"/><path d="M3 21a7 7 0 0 1 10-6.3M16 17h6v4h-6zM17.5 17v-1.5a1.5 1.5 0 0 1 3 0V17"/>' };
export const smile: IconDef = { name: 'smile', category, tags: ['happy', 'emoji', 'face', 'satisfied'], body: '<circle cx="12" cy="12" r="10"/><path d="M8 14.5a5 5 0 0 0 8 0M9 9.5h.01M15 9.5h.01"/>' };
export const frown: IconDef = { name: 'frown', category, tags: ['sad', 'unhappy', 'emoji', 'face'], body: '<circle cx="12" cy="12" r="10"/><path d="M8 16.5a5 5 0 0 1 8 0M9 9.5h.01M15 9.5h.01"/>' };
export const meh: IconDef = { name: 'meh', category, tags: ['neutral', 'indifferent', 'emoji', 'face'], body: '<circle cx="12" cy="12" r="10"/><path d="M8 15h8M9 9.5h.01M15 9.5h.01"/>' };
export const laugh: IconDef = { name: 'laugh', category, tags: ['joy', 'emoji', 'face'], body: '<circle cx="12" cy="12" r="10"/><path d="M7.5 13h9a4.5 4.5 0 0 1-9 0zM8.5 9l1.5 1-1.5 1M15.5 9L14 10l1.5 1"/>' };
export const baby: IconDef = { name: 'baby', category, tags: ['child', 'infant', 'newborn'], body: '<circle cx="12" cy="12" r="10"/><path d="M9.5 15a3.5 3.5 0 0 0 5 0M9 10.5h.01M15 10.5h.01M12 2c-1.5 1.5-1.5 3.5 0 4.5"/>' };
export const personStanding: IconDef = { name: 'personStanding', category, tags: ['human', 'accessibility', 'body'], body: '<circle cx="12" cy="4" r="2"/><path d="M5 8.5l7 1 7-1M12 9.5V14M8.5 21.5L12 14l3.5 7.5"/>' };
export const accessibility: IconDef = { name: 'accessibility', category, tags: ['a11y', 'universal access', 'wheelchair'], body: '<circle cx="15" cy="4" r="2"/><path d="M18 20l-2-6h-5l-1.5-5 5-1 2.5 2.5M8.5 11.2A5.5 5.5 0 1 0 14.5 18"/>' };
export const idCard: IconDef = { name: 'idCard', category, tags: ['identity', 'badge', 'license'], body: '<path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16a3 3 0 0 1 6 0M14 10h5M14 14h3"/>' };
export const crown: IconDef = { name: 'crown', category, tags: ['king', 'premium', 'vip', 'leader'], body: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5zM5 22h14"/>' };
