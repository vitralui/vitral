// Devices & hardware: computers, phones, peripherals and power.
// Drawn on the 24×24 grid: 2-unit round strokes, no fill, about 2 units of margin.
import type { IconDef } from '../types';

const category = 'devices';

export const monitor: IconDef = { name: 'monitor', category, tags: ['screen', 'desktop', 'display'], body: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>' };
export const laptop: IconDef = { name: 'laptop', category, tags: ['computer', 'notebook', 'macbook'], body: '<rect x="4" y="4" width="16" height="11" rx="2"/><path d="M2 19h20l-1.5-4h-17z"/>' };
export const smartphone: IconDef = { name: 'smartphone', category, tags: ['mobile', 'phone', 'cell'], body: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>' };
export const tablet: IconDef = { name: 'tablet', category, tags: ['ipad', 'device', 'touch'], body: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M11 18h2"/>' };
export const watch: IconDef = { name: 'watch', category, tags: ['smartwatch', 'wearable', 'time'], body: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 6l.5-4h5l.5 4M9 18l.5 4h5l.5-4M12 10v2l1.5 1"/>' };
export const keyboard: IconDef = { name: 'keyboard', category, tags: ['type', 'keys', 'input'], body: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 12.5h.01M10 12.5h.01M14 12.5h.01M18 12.5h.01M7 16h10"/>' };
export const mouse: IconDef = { name: 'mouse', category, tags: ['pointer', 'click', 'peripheral'], body: '<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 6v4"/>' };
export const printer: IconDef = { name: 'printer', category, tags: ['print', 'paper', 'output'], body: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>' };
export const cpu: IconDef = { name: 'cpu', category, tags: ['processor', 'chip', 'hardware'], body: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>' };
export const hardDrive: IconDef = { name: 'hardDrive', category, tags: ['disk', 'storage', 'hdd'], body: '<path d="M2 13l3-8h14l3 8M2 13v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5zM6 16.5h.01M10 16.5h.01"/>' };
export const memoryStick: IconDef = { name: 'memoryStick', category, tags: ['ram', 'memory', 'module'], body: '<path d="M3 7h18v10H3zM6 17v3M10 17v3M14 17v3M18 17v3M7 10v4M11 10v4M15 10v4"/>' };
export const usb: IconDef = { name: 'usb', category, tags: ['port', 'connector', 'plug'], body: '<path d="M12 18V3M9.5 5.5L12 3l2.5 2.5M12 16l-5-2.5V10M12 13l5-2.5V8"/><circle cx="12" cy="20" r="2"/><circle cx="7" cy="8.5" r="1.5"/><rect x="15.5" y="5" width="3" height="3" rx="0.5"/>' };
export const plug: IconDef = { name: 'plug', category, tags: ['power', 'electricity', 'connect'], body: '<path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0zM12 17v5"/>' };
export const battery: IconDef = { name: 'battery', category, tags: ['power', 'charge', 'energy'], body: '<rect x="2" y="7" width="17" height="10" rx="2"/><path d="M22 11v2"/>' };
export const batteryLow: IconDef = { name: 'batteryLow', category, tags: ['power', 'low charge'], body: '<rect x="2" y="7" width="17" height="10" rx="2"/><path d="M22 11v2M6 10.5v3"/>' };
export const batteryFull: IconDef = { name: 'batteryFull', category, tags: ['power', 'charged'], body: '<rect x="2" y="7" width="17" height="10" rx="2"/><path d="M22 11v2M6 10.5v3M10 10.5v3M14 10.5v3"/>' };
export const batteryCharging: IconDef = { name: 'batteryCharging', category, tags: ['power', 'charging'], body: '<path d="M8 17H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3M15 7h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2M22 11v2M12 6l-3 6h5l-3 6"/>' };
export const bluetooth: IconDef = { name: 'bluetooth', category, tags: ['wireless', 'pairing', 'connection'], body: '<path d="M6.5 7.5l11 9L12 21V3l5.5 4.5-11 9"/>' };
export const gamepadDevice: IconDef = { name: 'gamepadDevice', category, tags: ['console', 'controller'], body: '<rect x="2" y="6" width="20" height="12" rx="6"/><path d="M6 12h4M8 10v4M15 11h.01M18 13h.01"/>' };
export const speaker: IconDef = { name: 'speaker', category, tags: ['audio', 'sound', 'loudspeaker'], body: '<rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="14" r="4"/><path d="M12 6h.01"/>' };
export const webcam: IconDef = { name: 'webcam', category, tags: ['camera', 'video call'], body: '<circle cx="12" cy="10" r="7"/><circle cx="12" cy="10" r="3"/><path d="M7 21h10M12 17v4"/>' };
export const server: IconDef = { name: 'server', category, tags: ['rack', 'hosting', 'backend'], body: '<rect x="2" y="3" width="20" height="8" rx="2"/><rect x="2" y="13" width="20" height="8" rx="2"/><path d="M6 7h.01M6 17h.01"/>' };
export const router: IconDef = { name: 'router', category, tags: ['network', 'modem', 'wifi'], body: '<rect x="2" y="13" width="20" height="8" rx="2"/><path d="M6 17h.01M10 17h.01M15 13V9M9 7a4.5 4.5 0 0 1 6 0M6 4a8.5 8.5 0 0 1 12 0"/>' };
export const gpu: IconDef = { name: 'gpu', category, tags: ['graphics card', 'video card'], body: '<path d="M2 4v17M2 6h18a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H2M7 17v3h8v-3"/><circle cx="9" cy="11.5" r="2.5"/><circle cx="16" cy="11.5" r="2.5"/>' };
export const headset: IconDef = { name: 'headset', category, tags: ['support', 'call center', 'microphone'], body: '<path d="M4 14v-2a8 8 0 0 1 16 0v2M20 17v1a4 4 0 0 1-4 4h-3"/><rect x="2" y="13" width="4" height="6" rx="1"/><rect x="18" y="13" width="4" height="6" rx="1"/>' };
export const projector: IconDef = { name: 'projector', category, tags: ['presentation', 'beamer'], body: '<rect x="2" y="8" width="20" height="10" rx="2"/><circle cx="16" cy="13" r="3"/><path d="M5 18v2M19 18v2M6 13h4"/>' };
export const satellite: IconDef = { name: 'satellite', category, tags: ['orbit', 'signal', 'space'], body: '<path d="M12 8l4 4-4 4-4-4zM9 5L6 2 2 6l3 3zM19 15l3 3-4 4-3-3zM7.5 7.5L10 10M14 14l2.5 2.5M3 14a7 7 0 0 0 7 7M3 17.5a3.5 3.5 0 0 0 3.5 3.5"/>' };
export const smartHome: IconDef = { name: 'smartHome', category, tags: ['iot', 'connected house', 'hub'], body: '<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 13a4.2 4.2 0 0 1 6 0M10.8 15.5a1.7 1.7 0 0 1 2.4 0M12 18h.01"/>' };
