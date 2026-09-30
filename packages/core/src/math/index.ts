import type { MathDrawing, MathSvgOptions } from './svg';

// Formulas are drawn from outlines this package carries, and the outlines are
// the heavy part: tens of kilobytes that an application with no formula in it
// should never download. So the renderer is loaded when a formula first needs
// drawing, not when the package is imported. Until it arrives there is nothing
// to draw with, and what asks is told so (`null`) and shows the formula's
// source instead; `loadMath()` is the promise to wait on.

export { parseMath, type MathNode, type MathFence, type MathSymbolKind } from './parse';
export type { MathDrawing, MathSvgOptions } from './svg';

type Renderer = typeof import('./svg');

let renderer: Renderer | null = null;
let loading: Promise<void> | null = null;

/** Loads the formula renderer, once. Resolves when formulas can be drawn. */
export function loadMath(): Promise<void> {
    loading ??= import('./svg').then((module) => {
        renderer = module;
    });
    return loading;
}

export const isMathLoaded = (): boolean => renderer !== null;

/** A formula drawn, or `null` while the renderer has not been loaded (`loadMath()`). */
export function drawMath(source: string, options?: MathSvgOptions): MathDrawing | null {
    return renderer ? renderer.layoutMath(source, options) : null;
}

/**
 * A formula as markup that stands on its own, `vertical-align` and all, for
 * HTML that leaves the page; `null` while the renderer has not been loaded.
 */
export function mathToSvg(source: string, options?: MathSvgOptions): string | null {
    return renderer ? renderer.renderMathSvg(source, options) : null;
}

/**
 * Draws a formula inside an element, replacing what was there, and hangs it
 * from the baseline. The place on the baseline is set through the element's
 * style object rather than written into the markup, so it holds on a page
 * whose content security policy refuses a `style` attribute. False, and
 * nothing done, while the renderer has not been loaded.
 */
export function paintMath(element: HTMLElement, source: string, options?: MathSvgOptions): boolean {
    const drawing = drawMath(source, options);
    if (!drawing) return false;
    element.innerHTML = drawing.svg;
    const svg = element.firstElementChild as SVGElement | null;
    if (svg) svg.style.verticalAlign = `${-drawing.depth}em`;
    return true;
}

// ---- taking a formula out of the page ----------------------------------------
//
// What follows waits for the renderer itself, so it can be called anywhere and
// at any time: in a page that has shown no formula yet, or where there is no
// page at all — a server writing the PDF of an exam.

/**
 * A formula as SVG markup. With a `fontSize` it is a drawing that stands on
 * its own, sized in pixels and in a colour of its own: a `.svg` file, or what
 * a PDF library draws (pdfmake's `svg`, pdfkit and jsPDF through their SVG
 * plugins). Without one it is the piece of a line an HTML page wants, sized
 * in ems and hung from the baseline.
 */
export async function renderMath(source: string, options?: MathSvgOptions): Promise<string> {
    await loadMath();
    return renderer!.renderMathSvg(source, options);
}

/** A formula as a `data:` address of its SVG, for an `<img>` or anything that takes an image by address. */
export async function renderMathDataUri(source: string, options: MathSvgOptions = {}): Promise<string> {
    const svg = await renderMath(source, { ...options, fontSize: options.fontSize ?? 16 });
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export interface MathPngOptions extends MathSvgOptions {
    /** Pixels of image for each pixel of the drawing. Three by default, which prints sharp. */
    scale?: number;
    /** Painted behind the formula; none by default, which leaves the image see-through. */
    background?: string;
}

/**
 * A formula as a PNG, for what takes pictures and not drawings: jsPDF's
 * `addImage`, a spreadsheet, a slide. In a browser only — it is the browser
 * that paints it — and as many pixels as `scale` asks for, so it stays sharp
 * on paper. Where a drawing is taken, `renderMath` is the better thing to
 * hand over: it has no pixels to run out of.
 */
export async function renderMathPng(source: string, options: MathPngOptions = {}): Promise<Blob> {
    if (typeof document === 'undefined') throw new Error('renderMathPng needs a browser to paint in; use renderMath for the drawing itself.');
    await loadMath();
    const { scale = 3, background, ...rest } = options;
    const drawing = renderer!.layoutMath(source, { ...rest, fontSize: rest.fontSize ?? 16 });
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(drawing.svg)}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(drawing.width * scale));
    canvas.height = Math.max(1, Math.ceil(drawing.height * scale));
    const context = canvas.getContext('2d')!;
    if (background) {
        context.fillStyle = background;
        context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The formula could not be painted.'))), 'image/png'));
}

/**
 * Draws every formula inside an element: each `[data-math]` from its source.
 * It is what a page showing a document does with HTML that carries formulas
 * as their source alone — stored that way to keep it small, written by a
 * server, or cleaned by a sanitiser that took the drawings out. Resolves to
 * how many it drew.
 */
export async function renderMathIn(root: ParentNode): Promise<number> {
    const formulas = Array.from(root.querySelectorAll<HTMLElement>('[data-math]'));
    if (!formulas.length) return 0;
    await loadMath();
    for (const formula of formulas) paintMath(formula, formula.getAttribute('data-math') ?? '', { display: formula.getAttribute('data-display') === 'true' });
    return formulas.length;
}

const decodeAttr = (text: string) => text.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const encodeText = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** How a formula is written into HTML: around its drawing, or as its source alone. */
export type MathOutput = 'drawing' | 'source';

/**
 * The same HTML with every formula written the other way: `'drawing'` puts
 * the drawing of each inside it, so the HTML shows its formulas wherever it
 * goes; `'source'` takes the drawings out and leaves the LaTeX, which is a
 * fraction of the size and what `renderMathIn` draws from. It works on text,
 * so it works where there is no page, and it is for HTML the editor wrote:
 * the formulas are found the way the editor writes them.
 */
export async function renderMathHTML(html: string, output: MathOutput = 'drawing'): Promise<string> {
    if (output === 'drawing') await loadMath();
    return html.replace(/(<span data-math="([^"]*)"((?: [\w-]+="[^"]*")*)>)([\s\S]*?)<\/span>/g, (_match, open: string, attr: string, rest: string) => {
        const source = decodeAttr(attr);
        const inner = output === 'source' ? encodeText(source) : renderer!.renderMathSvg(source, { display: /data-display="true"/.test(rest) });
        return `${open}${inner}</span>`;
    });
}
