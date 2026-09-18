// Security: locks, keys, shields and identity.
// Drawn on the 24×24 grid: 2-unit round strokes, no fill, about 2 units of margin.
import type { IconDef } from '../types';

const category = 'security';

export const lock: IconDef = { name: 'lock', category, tags: ['secure', 'private', 'locked', 'password'], body: '<rect x="4" y="10" width="16" height="12" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>' };
export const unlock: IconDef = { name: 'unlock', category, tags: ['open', 'unlocked', 'public'], body: '<rect x="4" y="10" width="16" height="12" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.7-1.5"/>' };
export const lockKeyhole: IconDef = { name: 'lockKeyhole', category, tags: ['secure', 'vault', 'locked'], body: '<rect x="4" y="10" width="16" height="12" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2"/><circle cx="12" cy="15" r="0.5"/>' };
export const key: IconDef = { name: 'key', category, tags: ['password', 'access', 'unlock'], body: '<circle cx="7.5" cy="15.5" r="5"/><path d="M11 12L21 2M17 6l3 3M14.5 8.5l2.5 2.5"/>' };
export const keySquare: IconDef = { name: 'keySquare', category, tags: ['passkey', 'credential'], body: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="10" cy="14" r="2.5"/><path d="M11.8 12.2L17 7M15 9l2 2"/>' };
export const shield: IconDef = { name: 'shield', category, tags: ['protection', 'security', 'guard'], body: '<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"/>' };
export const shieldCheck: IconDef = { name: 'shieldCheck', category, tags: ['secure', 'verified', 'protected'], body: '<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"/><path d="M8.5 12l2.5 2.5 4.5-4.5"/>' };
export const shieldAlert: IconDef = { name: 'shieldAlert', category, tags: ['threat', 'warning', 'risk'], body: '<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"/><path d="M12 7.5v5M12 16h.01"/>' };
export const shieldOff: IconDef = { name: 'shieldOff', category, tags: ['unprotected', 'insecure'], body: '<path d="M19.7 14.3c.2-.7.3-1.5.3-2.3V5l-8-3-3.2 1.2M5 5v7c0 6.5 7 10 7 10s2.7-1.2 5-3.7M3 3l18 18"/>' };
export const shieldX: IconDef = { name: 'shieldX', category, tags: ['blocked', 'denied'], body: '<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"/><path d="M9.5 9.5l5 5M14.5 9.5l-5 5"/>' };
export const shieldUser: IconDef = { name: 'shieldUser', category, tags: ['account protection', 'privacy'], body: '<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"/><circle cx="12" cy="10" r="2.5"/><path d="M7.8 17a5 5 0 0 1 8.4 0"/>' };
export const fingerprint: IconDef = { name: 'fingerprint', category, tags: ['biometric', 'identity', 'touch id'], body: '<path d="M12 11v4c0 2.5-.5 4.5-1.5 6.5M8 20c.8-1.5 1-3.5 1-5v-4a3 3 0 0 1 6 0v1.5M15 16c0 2-.3 3.8-.8 5.5M5 17c.6-1.8 1-3.8 1-6a6 6 0 0 1 10.8-3.6M18 11.5v2c0 1.5-.1 3-.5 4.5M2.5 13c.3-1 .5-2 .5-3a9 9 0 0 1 17.6-2.7M21 12v1"/>' };
export const scanFace: IconDef = { name: 'scanFace', category, tags: ['face id', 'recognition', 'biometric'], body: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9h.01M15 9h.01"/>' };
export const eyeScan: IconDef = { name: 'eyeScan', category, tags: ['retina', 'iris', 'biometric'], body: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M6 12s2.2-4 6-4 6 4 6 4-2.2 4-6 4-6-4-6-4z"/><circle cx="12" cy="12" r="1.5"/>' };
export const vault: IconDef = { name: 'vault', category, tags: ['safe', 'secure storage'], body: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="4"/><path d="M12 8v1.5M12 14.5V16M8 12h1.5M14.5 12H16M6 21v1M18 21v1"/>' };
export const password: IconDef = { name: 'password', category, tags: ['dots', 'pin', 'secret'], body: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="6.5" cy="12" r="0.5"/><circle cx="10.5" cy="12" r="0.5"/><circle cx="14.5" cy="12" r="0.5"/><path d="M18.5 9.5v5"/>' };
export const siren: IconDef = { name: 'siren', category, tags: ['alarm', 'emergency', 'police'], body: '<path d="M7 18v-6a5 5 0 0 1 10 0v6M5 21a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1zM21 12h1M18.5 4.5L18 5M2 12h1M12 2v1M4.9 4.9l.5.5M10 12a2 2 0 0 1 2-2"/>' };
export const cctv: IconDef = { name: 'cctv', category, tags: ['camera', 'surveillance', 'monitoring'], body: '<path d="M16.8 13.4L4 7l2-4 13 6.3a1 1 0 0 1 .4 1.4l-1.2 2.3a1 1 0 0 1-1.4.4zM16 12.8L14 17h-4M2 21v-6M2 18h4.5l3-3"/>' };
export const userShield: IconDef = { name: 'userShield', category, tags: ['admin', 'moderator', 'account security'], body: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 10-6.3M18 22s4-1.5 4-5v-3l-4-1.5-4 1.5v3c0 3.5 4 5 4 5z"/>' };
export const bugOff: IconDef = { name: 'bugOff', category, tags: ['antivirus', 'malware free'], body: '<path d="M9 5.5A4 4 0 0 1 16 8v.5M17.5 13.5V10a1 1 0 0 0-1-1h-3.5M8.4 9H7.5a1 1 0 0 0-1 1v4a6 6 0 0 0 9.6 4.8M3 3l18 18M3 13h3M4 20l2.5-2.5"/>' };
