// School & education: study, classroom and science.
// Drawn on the 24×24 grid: 2-unit round strokes, no fill, about 2 units of margin.
import type { IconDef } from '../types';

const category = 'education';

export const book: IconDef = { name: 'book', category, tags: ['read', 'library', 'study', 'manual'], body: '<path d="M4 19.5V5a3 3 0 0 1 3-3h13v15H7a3 3 0 0 0-3 3zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>' };
export const bookOpen: IconDef = { name: 'bookOpen', category, tags: ['read', 'reading', 'learn', 'docs'], body: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>' };
export const bookMarked: IconDef = { name: 'bookMarked', category, tags: ['reading', 'saved page'], body: '<path d="M4 19.5V5a3 3 0 0 1 3-3h13v15H7a3 3 0 0 0-3 3zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/><path d="M10 2v8l2.5-2 2.5 2V2"/>' };
export const bookA: IconDef = { name: 'bookA', category, tags: ['dictionary', 'language', 'glossary'], body: '<path d="M4 19.5V5a3 3 0 0 1 3-3h13v15H7a3 3 0 0 0-3 3zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/><path d="M9 13l3-7 3 7M10 10.5h4"/>' };
export const notebook: IconDef = { name: 'notebook', category, tags: ['notes', 'journal', 'diary'], body: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M2 6h4M2 10h4M2 14h4M2 18h4M10 2v20"/>' };
export const notebookPen: IconDef = { name: 'notebookPen', category, tags: ['write notes', 'homework'], body: '<path d="M13.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6M2 6h4M2 10h4M2 14h4M2 18h4M18.5 2.5a2.1 2.1 0 0 1 3 3L16 11l-3 1 1-3z"/>' };
export const library: IconDef = { name: 'library', category, tags: ['books', 'shelf', 'study'], body: '<path d="M4 3v18M8 3v18M12 5l4 16M17 4l4 1-3 16"/>' };
export const backpack: IconDef = { name: 'backpack', category, tags: ['school bag', 'rucksack', 'travel'], body: '<path d="M5 10a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6M8 10h8"/>' };
export const graduationCap: IconDef = { name: 'graduationCap', category, tags: ['graduate', 'school', 'university', 'degree'], body: '<path d="M22 9L12 4 2 9l10 5zM6 11v5c2 2 10 2 12 0v-5M22 9v6"/>' };
export const school: IconDef = { name: 'school', category, tags: ['building', 'classroom', 'education'], body: '<path d="M14 22v-4a2 2 0 0 0-4 0v4M18 10l4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2M18 5v17M6 5v17M4 6l8-4 8 4"/><circle cx="12" cy="9" r="2"/>' };
export const pencilLine: IconDef = { name: 'pencilLine', category, tags: ['write', 'draw', 'sketch'], body: '<path d="M12 20h9M15.5 4.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>' };
export const ruler: IconDef = { name: 'ruler', category, tags: ['measure', 'length', 'scale'], body: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0zM14.5 12.5l2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2"/>' };
export const pencilRuler: IconDef = { name: 'pencilRuler', category, tags: ['design', 'drafting', 'tools'], body: '<path d="M13 7L8.7 2.7a2.4 2.4 0 0 0-3.4 0L2.7 5.3a2.4 2.4 0 0 0 0 3.4L7 13M8 6l2-2M18 16l2-2M17 11l4.3 4.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L11 17M21.2 6.8a2.8 2.8 0 0 0-4-4L3.8 16.2 3 21l4.8-.8z"/>' };
export const triangleRuler: IconDef = { name: 'triangleRuler', category, tags: ['set square', 'geometry'], body: '<path d="M3 3v18h18zM7 11v6h6zM3 7h2M3 11h2M3 15h2"/>' };
export const calculator: IconDef = { name: 'calculator', category, tags: ['math', 'sum', 'accounting'], body: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8v4H8zM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>' };
export const abacus: IconDef = { name: 'abacus', category, tags: ['counting', 'math', 'beads'], body: '<rect x="3" y="2" width="18" height="20" rx="2"/><path d="M3 8h18M3 16h18"/><circle cx="8" cy="8" r="1.5"/><circle cx="12" cy="8" r="1.5"/><circle cx="15" cy="16" r="1.5"/><circle cx="9" cy="16" r="1.5"/>' };
export const microscope: IconDef = { name: 'microscope', category, tags: ['science', 'lab', 'biology'], body: '<path d="M6 18h8M3 22h18M14 22a7 7 0 0 0 0-14h-1M9 14h2M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2zM12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/>' };
export const flask: IconDef = { name: 'flask', category, tags: ['chemistry', 'lab', 'experiment', 'science'], body: '<path d="M9 2v6.5L3.5 19A2 2 0 0 0 5.3 22h13.4a2 2 0 0 0 1.8-3L15 8.5V2M8 2h8M6.5 15h11"/>' };
export const testTube: IconDef = { name: 'testTube', category, tags: ['lab', 'sample', 'chemistry'], body: '<path d="M14.5 2v17.5a2.5 2.5 0 0 1-5 0V2M8 2h8M9.5 12h5"/>' };
export const testTubes: IconDef = { name: 'testTubes', category, tags: ['lab', 'samples', 'research'], body: '<path d="M9 2v17.5a2.5 2.5 0 0 1-5 0V2M20 2v17.5a2.5 2.5 0 0 1-5 0V2M3 2h7M14 2h7M4 12h5M15 16h5"/>' };
export const atom: IconDef = { name: 'atom', category, tags: ['physics', 'science', 'nuclear'], body: '<circle cx="12" cy="12" r="1"/><ellipse cx="12" cy="12" rx="10" ry="4"/><path d="M7 3.34A10 4 60 0 0 17 20.66 10 4 60 0 0 7 3.34M17 3.34A10 4 -60 0 0 7 20.66 10 4 -60 0 0 17 3.34"/>' };
// A globe with its equator and meridian, on a stand it actually touches. The
// old one had a radius-9 arc drawn across a radius-6 globe, so a line swept
// clear of the sphere and out the other side, and the stem began three units
// below where the globe ended.
export const globeStand: IconDef = { name: 'globeStand', category, tags: ['geography', 'world', 'earth'], body: '<circle cx="12" cy="10" r="7"/><path d="M5 10h14M12 3a3.5 7 0 0 0 0 14a3.5 7 0 0 0 0-14M12 17v3M8.5 20h7"/>' };
export const certificate: IconDef = { name: 'certificate', category, tags: ['diploma', 'award', 'achievement'], body: '<path d="M12 18H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v11a2 2 0 0 1-1 1.7M6 7h12M6 11h5"/><circle cx="17" cy="13.5" r="3"/><path d="M15 16v6l2-1.5 2 1.5v-6"/>' };
export const chalkboard: IconDef = { name: 'chalkboard', category, tags: ['blackboard', 'classroom', 'teach'], body: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M6 21l2-4M18 21l-2-4M6 13l3-3 2.5 2L15 8M15 17h4"/>' };
export const presentation: IconDef = { name: 'presentation', category, tags: ['slides', 'talk', 'lecture'], body: '<path d="M2 3h20M3 3v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3M12 16v2M8 22l4-4 4 4M8 11l3-3 2 2 3-3"/>' };
export const teacher: IconDef = { name: 'teacher', category, tags: ['lecturer', 'instructor', 'class'], body: '<circle cx="7" cy="11" r="3"/><path d="M2 21a5 5 0 0 1 10 0M10 3h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6M10 9l4-3"/>' };
export const award: IconDef = { name: 'award', category, tags: ['badge', 'prize', 'achievement', 'ribbon'], body: '<circle cx="12" cy="9" r="6"/><path d="M8.5 13.8L7 22l5-3 5 3-1.5-8.2"/>' };
export const lightbulbIdea: IconDef = { name: 'lightbulbIdea', category, tags: ['idea', 'learn', 'insight'], body: '<path d="M8.2 14.5A6.5 6.5 0 1 1 15.8 14.5c-.8.7-1.3 1.6-1.3 2.6V18h-5v-.9c0-1-.5-1.9-1.3-2.6zM10 21.5h4M12 6.5l-1.5 3h3L12 12.5"/>' };
export const magnet: IconDef = { name: 'magnet', category, tags: ['physics', 'attraction', 'science'], body: '<path d="M6 3v9a6 6 0 0 0 12 0V3h-4v9a2 2 0 0 1-4 0V3zM6 7h4M14 7h4"/>' };
export const telescope: IconDef = { name: 'telescope', category, tags: ['astronomy', 'stars', 'observe'], body: '<path d="M3.5 13.5l2 3.5 13-7.5-3-5zM15.5 4.5l1-.6a1 1 0 0 1 1.4.4l2 3.4a1 1 0 0 1-.4 1.4l-1 .5M10 13l1.5 2.5M11.5 15.5L8 22M11.5 15.5L15 22"/>' };
export const crayon: IconDef = { name: 'crayon', category, tags: ['draw', 'colour', 'kids'], body: '<path d="M8 21l-5-5L15 4l5 5zM15 4l2-2 5 5-2 2M5 14l5 5M3 16l-1 6 6-1"/>' };
export const pi: IconDef = { name: 'pi', category, tags: ['math', 'constant', 'geometry'], body: '<path d="M4 7h16M8 7v13M16 7v10a3 3 0 0 0 3 3"/>' };
export const mathOperations: IconDef = { name: 'mathOperations', category, tags: ['plus minus times divide', 'arithmetic'], body: '<path d="M6 3v6M3 6h6M15 6h6M4 15l4 4M8 15l-4 4M15 16h6M18 19h.01M18 13h.01"/>' };
export const schoolBell: IconDef = { name: 'schoolBell', category, tags: ['class bell', 'ring', 'break'], body: '<path d="M18 13a6 6 0 1 0-12 0v4h12zM4 17h16M12 17v2"/><circle cx="12" cy="20.5" r="1.5"/><path d="M12 7V4"/>' };
export const pencilCase: IconDef = { name: 'pencilCase', category, tags: ['stationery', 'supplies'], body: '<rect x="2" y="7" width="20" height="12" rx="4"/><path d="M2 11h20M11 11v3h2v-3"/>' };
export const studyDesk: IconDef = { name: 'studyDesk', category, tags: ['homework', 'desk', 'study place'], body: '<path d="M3 10h18M5 10v11M19 10v11M13 10v6h6M13 13h6M8 10V7l2-3 2 1"/>' };
