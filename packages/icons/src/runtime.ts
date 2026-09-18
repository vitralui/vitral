import { isMirrored } from './direction';
import {
    arrowDown, arrowLeft, arrowLeftRight, arrowRight, arrowUp, arrowUpDown, bell, calendar, check, chevronDown, chevronLeft, chevronRight, chevronsDown,
    chevronsLeft, chevronsRight, chevronsUp, chevronUp, circle, clock, copy, download, error, externalLink, eye, eyeOff, file,
    filter, folder, folderOpen, grip, home, image, info, lock, maximize, menu, minus, moon, moreHorizontal, moreVertical, move,
    pause, pencil, play, plus, refresh, restore, rotateLeft, rotateRight, search, selection, sidebar, sliders, sort, spinner, star, starFill,
    success, sun, terminal, trash, upload, user, warning, x, zoomIn, zoomOut
} from './icons/index';
import { ICON_STROKE_WIDTH, ICON_VIEWBOX, type IconDef } from './types';

/**
 * The icons a string name resolves to without registering anything: the ones
 * the components themselves use. Everything else is a named import away
 * (`import { graduationCap } from '@vitral/icons'`), or registered once with
 * {@link registerIcons}. `registerAllIcons()` from `@vitral/icons/registry`
 * makes every name work, at the cost of bundling the whole set.
 */
export const baseIcons: readonly IconDef[] = [
    chevronDown, chevronUp, chevronLeft, chevronRight, chevronsLeft, chevronsRight, chevronsUp, chevronsDown,
    check, minus, plus, x, search, calendar, clock, info, warning, error, success, spinner,
    arrowUp, arrowDown, arrowLeft, arrowRight, arrowLeftRight, arrowUpDown, sort, filter, menu, moreHorizontal, moreVertical, eye, eyeOff,
    home, folder, folderOpen, file, star, starFill, trash, pencil, copy, externalLink, upload, download, user,
    sliders, bell, sun, moon, grip, sidebar, refresh, circle, maximize, restore, zoomIn, zoomOut, rotateLeft,
    play, pause, image, terminal, lock, move, selection, rotateRight
];

// Built on first use rather than at import, so the module has no side effect
// and a bundler can still drop it from an application that never looks a name up.
let table: Map<string, IconDef> | undefined;
const registry = () => (table ??= new Map(baseIcons.map((def) => [def.name, def])));

/** Makes icons resolvable by name: the built-in ones you import, or your own. Later registrations win. */
export function registerIcons(defs: Iterable<IconDef> | Readonly<Record<string, IconDef>>): void {
    const list = Symbol.iterator in defs ? (defs as Iterable<IconDef>) : Object.values(defs);
    for (const def of list) registry().set(def.name, def);
}

/** The icon registered under a name, if any. */
export function getIcon(name: string): IconDef | undefined {
    return registry().get(name);
}

export interface RenderSvgOptions {
    /**
     * The direction the icon is read in. In `'rtl'` a mirrored icon (see
     * {@link isMirrored}) is flipped about the middle of its own grid, so it
     * points the way the reader is going.
     */
    direction?: 'ltr' | 'rtl';
}

/** Flips the drawing inside its viewBox, rather than the element, so any SVG reader shows it mirrored. */
function flip(body: string, viewBox: string): string {
    const [minX = 0, , width = 24] = viewBox.trim().split(/[\s,]+/).map(Number);
    return `<g transform="translate(${minX * 2 + width} 0) scale(-1 1)">${body}</g>`;
}

/** The icon as a standalone SVG string, for code that is not using a component. */
export function renderSvg(def: IconDef, attrs: Record<string, string> = {}, options: RenderSvgOptions = {}): string {
    const all: Record<string, string> = {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: def.viewBox ?? ICON_VIEWBOX,
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': String(ICON_STROKE_WIDTH),
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true',
        ...attrs
    };
    const rendered = Object.entries(all)
        .map(([k, v]) => `${k}="${v.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`)
        .join(' ');
    const viewBox = all.viewBox ?? ICON_VIEWBOX;
    const body = options.direction === 'rtl' && isMirrored(def) ? flip(def.body, viewBox) : def.body;
    return `<svg ${rendered}>${body}</svg>`;
}
