import { turnedBounds, type CropValue } from './cropper';

/**
 * Drawing the crop, which is the one part of cropping that needs a browser.
 * Kept apart from the arithmetic so the arithmetic stays testable without one.
 */

export interface DrawCropOptions {
    /** The output, in pixels. Leaving both out draws the crop at its own size. */
    width?: number;
    height?: number;
    /** Fills behind the image: for a JPEG, which has no transparency to fall back on. */
    background?: string;
}

/**
 * The cropped image on a canvas, with the turn and the flips applied. The
 * source may be anything canvas can draw: an `<img>`, a bitmap, another canvas.
 */
export function drawCrop(source: CanvasImageSource, natural: { width: number; height: number }, value: CropValue, options: DrawCropOptions = {}): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const width = Math.max(1, Math.round(options.width ?? value.width));
    const height = Math.max(1, Math.round(options.height ?? (options.width ? (options.width * value.height) / value.width : value.height)));
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) return canvas;
    if (options.background) {
        context.fillStyle = options.background;
        context.fillRect(0, 0, width, height);
    }

    const turned = turnedBounds(natural.width, natural.height, value.rotate);
    context.save();
    // Work in the turned image's space: put its origin where the crop starts,
    // then undo the turn so the source can be drawn at 0,0 as it was stored.
    context.scale(width / value.width, height / value.height);
    context.translate(-value.x, -value.y);
    context.translate(turned.width / 2, turned.height / 2);
    context.rotate((value.rotate * Math.PI) / 180);
    context.scale(value.flipX ? -1 : 1, value.flipY ? -1 : 1);
    context.drawImage(source, -natural.width / 2, -natural.height / 2, natural.width, natural.height);
    context.restore();
    return canvas;
}

/** The cropped image as a file, for an upload. */
export function cropToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob | null> {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
