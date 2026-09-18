import { isClient } from '@vitral/core';
import { chartCsv } from '../engine/a11y';
import type { NormalizedSeries } from '../engine/series';

// Downloads: the SVG as it is on screen (with its computed colours and fonts
// written onto the elements, since a file has no theme to resolve `var()`
// against), a PNG drawn from that SVG, and the data as CSV.

const STYLE_PROPS = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-opacity', 'opacity', 'font-size', 'font-family', 'font-weight', 'stop-color', 'stop-opacity', 'visibility'];

export function serializeSvg(svg: SVGSVGElement, background?: string): string {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    const source = [svg, ...svg.querySelectorAll('*')];
    const target = [clone, ...clone.querySelectorAll('*')];
    source.forEach((el, i) => {
        const copy = target[i] as SVGElement | undefined;
        if (!copy) return;
        const style = getComputedStyle(el);
        const declarations = STYLE_PROPS.map((p) => [p, style.getPropertyValue(p)] as const).filter(([, v]) => v && v !== 'normal');
        copy.removeAttribute('class');
        copy.setAttribute('style', declarations.map(([p, v]) => `${p}:${v}`).join(';'));
    });
    const { width, height } = svg.getBoundingClientRect();
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(Math.round(width) || 600));
    clone.setAttribute('height', String(Math.round(height) || 320));
    if (background) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('style', `fill:${background}`);
        clone.insertBefore(rect, clone.firstChild);
    }
    return new XMLSerializer().serializeToString(clone);
}

/** Hands a file to the browser's download. */
export function saveFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function svgToPng(svgText: string, width: number, height: number, scale = 2): Promise<Blob | null> {
    return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width * scale;
            canvas.height = height * scale;
            const context = canvas.getContext('2d');
            if (!context) return resolve(null);
            context.scale(scale, scale);
            context.drawImage(image, 0, 0, width, height);
            canvas.toBlob((blob) => resolve(blob), 'image/png');
        };
        image.onerror = () => resolve(null);
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
    });
}

export async function downloadChart(
    kind: 'svg' | 'png' | 'csv',
    options: { svg: SVGSVGElement | null; filename: string; series: NormalizedSeries[]; categories?: (string | number)[]; headerCategory?: string; background?: string }
): Promise<void> {
    if (!isClient) return;
    if (kind === 'csv') {
        saveFile(new Blob([chartCsv(options.series, options.categories, options.headerCategory)], { type: 'text/csv;charset=utf-8' }), `${options.filename}.csv`);
        return;
    }
    if (!options.svg) return;
    const text = serializeSvg(options.svg, options.background);
    if (kind === 'svg') {
        saveFile(new Blob([text], { type: 'image/svg+xml;charset=utf-8' }), `${options.filename}.svg`);
        return;
    }
    const { width, height } = options.svg.getBoundingClientRect();
    const png = await svgToPng(text, width || 600, height || 320);
    if (png) saveFile(png, `${options.filename}.png`);
}
