/**
 * The arithmetic of a crop: a rectangle over an image, in the image's own
 * pixels, moved and resized by a pointer or by the arrow keys, kept inside the
 * image and at whatever ratio it has been locked to. No DOM here — a drag, a
 * key, a zoom slider and a React port all come down to these few functions.
 *
 * Rotation is in quarter turns. A free angle would mean the crop and the image
 * no longer share an axis, which is a different and much larger problem; a
 * quarter turn only swaps the bounds, and every photograph that arrives on its
 * side needs exactly that.
 */

export interface CropRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** A crop, and what was done to the image under it. Plain data: it survives JSON. */
export interface CropValue extends CropRect {
    /** Quarter turns clockwise. */
    rotate: 0 | 90 | 180 | 270;
    flipX: boolean;
    flipY: boolean;
}

export type CropHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const cropHandles: readonly CropHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

export interface CropLimits {
    /** The image, in its own pixels, as the crop sees it — already turned, if it has been. */
    bounds: { width: number; height: number };
    minWidth?: number;
    minHeight?: number;
    /** `width / height`. Null leaves the crop free. */
    aspect?: number | null;
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const round = (value: number) => Math.round(value * 1e4) / 1e4;

/**
 * An aspect as a number: `'16:9'`, `'1:1'`, `1.5`, or null for free. Anything
 * that does not describe a ratio is free rather than an error, because these
 * arrive from an attribute.
 */
export function parseAspect(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === 'free' || value === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
    const match = /^\s*(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)\s*$/.exec(value);
    if (match) {
        const ratio = Number(match[1]) / Number(match[2]);
        return Number.isFinite(ratio) && ratio > 0 ? ratio : null;
    }
    const ratio = Number(value);
    return Number.isFinite(ratio) && ratio > 0 ? ratio : null;
}

/** The smallest crop the limits allow, with the ratio applied to both sides. */
function minimum(limits: CropLimits): { width: number; height: number } {
    const { bounds, aspect } = limits;
    let width = clamp(limits.minWidth ?? 1, 1, bounds.width);
    let height = clamp(limits.minHeight ?? 1, 1, bounds.height);
    if (aspect) {
        // Both minimums have to be honoured, so take whichever demands more.
        width = Math.max(width, height * aspect);
        height = width / aspect;
        if (width > bounds.width || height > bounds.height) {
            const fitted = fit(bounds, aspect);
            width = fitted.width;
            height = fitted.height;
        }
    }
    return { width, height };
}

/** The largest box of `aspect` that fits in `bounds`. */
function fit(bounds: { width: number; height: number }, aspect: number): { width: number; height: number } {
    const width = Math.min(bounds.width, bounds.height * aspect);
    return { width, height: width / aspect };
}

/**
 * A crop that obeys the limits: no smaller than the minimum, no larger than the
 * image, at the ratio if there is one, and wholly inside the bounds. Size is
 * settled before position, so a crop that has to shrink to fit does not also
 * drift.
 */
export function clampCrop(rect: CropRect, limits: CropLimits): CropRect {
    const { bounds, aspect } = limits;
    const min = minimum(limits);
    let width = clamp(rect.width, min.width, bounds.width);
    let height = clamp(rect.height, min.height, bounds.height);

    if (aspect) {
        // Keep the side that was asked for and derive the other, then pull both
        // back if the derived one does not fit.
        height = width / aspect;
        if (height > bounds.height) {
            height = bounds.height;
            width = height * aspect;
        }
        if (width > bounds.width) {
            width = bounds.width;
            height = width / aspect;
        }
        width = Math.max(width, min.width);
        height = Math.max(height, min.height);
    }

    return {
        x: round(clamp(rect.x, 0, Math.max(0, bounds.width - width))),
        y: round(clamp(rect.y, 0, Math.max(0, bounds.height - height))),
        width: round(width),
        height: round(height)
    };
}

/** The crop moved by `dx`/`dy`, never resized: at an edge it stops rather than shrinking. */
export function moveCrop(rect: CropRect, dx: number, dy: number, limits: CropLimits): CropRect {
    const { bounds } = limits;
    return {
        ...rect,
        x: round(clamp(rect.x + dx, 0, Math.max(0, bounds.width - rect.width))),
        y: round(clamp(rect.y + dy, 0, Math.max(0, bounds.height - rect.height)))
    };
}

/**
 * The crop with one edge or corner moved by `dx`/`dy`. The opposite edge stays
 * where it is, which is what makes a handle feel attached to the thing it is
 * dragging. Under a locked ratio a side handle drives the other dimension about
 * the crop's own centre, and a corner drives it from the anchored corner.
 */
export function resizeCrop(rect: CropRect, handle: CropHandle, dx: number, dy: number, limits: CropLimits): CropRect {
    const { bounds, aspect } = limits;
    const min = minimum(limits);
    const right = rect.x + rect.width;
    const bottom = rect.y + rect.height;
    const west = handle.includes('w');
    const east = handle.includes('e');
    const north = handle.startsWith('n');
    const south = handle.startsWith('s');

    let x = rect.x;
    let y = rect.y;
    let width = rect.width;
    let height = rect.height;

    if (west) {
        x = clamp(rect.x + dx, 0, right - min.width);
        width = right - x;
    } else if (east) {
        width = clamp(rect.width + dx, min.width, bounds.width - rect.x);
    }
    if (north) {
        y = clamp(rect.y + dy, 0, bottom - min.height);
        height = bottom - y;
    } else if (south) {
        height = clamp(rect.height + dy, min.height, bounds.height - rect.y);
    }

    if (aspect) {
        const horizontal = west || east;
        const vertical = north || south;
        if (horizontal && vertical) {
            // A corner: the longer pull wins, and the other side follows it.
            if (Math.abs(width / aspect - height) > 0) height = width / aspect;
            if (height > bounds.height || (north ? bottom - height < 0 : rect.y + height > bounds.height)) {
                height = north ? bottom : bounds.height - rect.y;
                width = height * aspect;
            }
            if (west) x = right - width;
            if (north) y = bottom - height;
        } else if (horizontal) {
            // A side: the other dimension grows about the centre, so the crop
            // does not walk up the image as it widens.
            const centre = rect.y + rect.height / 2;
            height = width / aspect;
            y = centre - height / 2;
        } else if (vertical) {
            const centre = rect.x + rect.width / 2;
            width = height * aspect;
            x = centre - width / 2;
        }
    }

    return clampCrop({ x, y, width, height }, limits);
}

/**
 * Zooms about the crop's centre: `factor` above 1 takes in more of the image,
 * below 1 takes in less. The crop is what moves, so a "zoom in" on the picture
 * is a smaller crop.
 */
export function zoomCrop(rect: CropRect, factor: number, limits: CropLimits): CropRect {
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const width = rect.width * factor;
    const height = rect.height * factor;
    return clampCrop({ x: cx - width / 2, y: cy - height / 2, width, height }, limits);
}

/** A crop of `fraction` of the image, centred, at the ratio if there is one. */
export function centredCrop(limits: CropLimits, fraction = 0.8): CropRect {
    const { bounds, aspect } = limits;
    const box = aspect ? fit(bounds, aspect) : bounds;
    const width = box.width * fraction;
    const height = box.height * fraction;
    return clampCrop({ x: (bounds.width - width) / 2, y: (bounds.height - height) / 2, width, height }, limits);
}

export interface CropKeyOptions {
    /** Pixels an arrow moves; ten times that with Shift held. */
    step?: number;
    /** Reading right to left, Left is forward. */
    rtl?: boolean;
    /** Resize from the bottom-right instead of moving. */
    resize?: boolean;
    large?: boolean;
}

/**
 * What a key does to the crop: the arrows move it, Home and End take it to the
 * near and far corners, and with `resize` the arrows drag its bottom-right
 * corner instead. Null for a key the crop ignores, so the handler can let it
 * through.
 */
export function cropKeyAction(key: string, rect: CropRect, limits: CropLimits, options: CropKeyOptions = {}): CropRect | null {
    const { step = 1, rtl = false, resize = false, large = false } = options;
    const amount = large ? step * 10 : step;
    const forward = rtl ? -amount : amount;

    switch (key) {
        case 'ArrowLeft':
            return resize ? resizeCrop(rect, 'se', -forward, 0, limits) : moveCrop(rect, -forward, 0, limits);
        case 'ArrowRight':
            return resize ? resizeCrop(rect, 'se', forward, 0, limits) : moveCrop(rect, forward, 0, limits);
        case 'ArrowUp':
            return resize ? resizeCrop(rect, 'se', 0, -amount, limits) : moveCrop(rect, 0, -amount, limits);
        case 'ArrowDown':
            return resize ? resizeCrop(rect, 'se', 0, amount, limits) : moveCrop(rect, 0, amount, limits);
        case 'Home':
            return { ...rect, x: 0, y: 0 };
        case 'End':
            return { ...rect, x: Math.max(0, limits.bounds.width - rect.width), y: Math.max(0, limits.bounds.height - rect.height) };
        default:
            return null;
    }
}

/** The image's size as the crop sees it: a quarter turn swaps the sides. */
export function turnedBounds(width: number, height: number, rotate: number): { width: number; height: number } {
    return rotate === 90 || rotate === 270 ? { width: height, height: width } : { width, height };
}

/** The next quarter turn, in either direction, kept in 0–270. */
export function turn(rotate: number, direction: 1 | -1): 0 | 90 | 180 | 270 {
    return (((rotate + direction * 90) % 360) + 360) % 360 as 0 | 90 | 180 | 270;
}
