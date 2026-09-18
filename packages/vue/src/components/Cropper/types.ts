import type { CropHandle, CropValue } from '@vitral/core';
import type { BaseProps } from '../../base/types';

export type { CropHandle, CropValue };

/** A ratio the crop can be locked to, as an option the toolbar offers. */
export interface CropAspect {
    label: string;
    /** `'free'`, `'16:9'`, `'1:1'`, or a number. */
    value: number | string | null;
}

export interface CropperProps extends BaseProps {
    /** The image. Anything an `<img>` takes; a data or object URL included. */
    src?: string;
    /** Describes the picture, not the control. Without one the image is decorative. */
    alt?: string;
    /** Lock the crop to a ratio: `1`, `'16:9'`, or null to leave it free. */
    aspect?: number | string | null;
    /** Ratios to offer in the toolbar. Omit it and no chooser is drawn. */
    aspects?: readonly CropAspect[];
    /** `'circle'` masks the crop and the preview, and locks the ratio to 1. */
    shape?: 'rect' | 'circle';
    /** Draw the eight resize handles. Defaults to true for a rectangle, false for a circle. */
    handles?: boolean;
    /** Offer the quarter turns and the flips. */
    rotatable?: boolean;
    /** Offer a zoom slider. */
    zoomable?: boolean;
    /**
     * Draw the thirds over the crop while it is being moved. On by default for
     * a rectangle and off for a circle, where a rule of thirds means nothing:
     * the guide is for composing a frame, and a round crop has no corners to
     * compose towards.
     */
    grid?: boolean;
    /** The smallest crop, in the image's own pixels. */
    minWidth?: number;
    minHeight?: number;
    /** The stage's height: a number is pixels. */
    height?: number | string;
    /** The live preview's size, in pixels. Zero draws none. */
    previewSize?: number;
    disabled?: boolean;
}

export type CropperEmits = {
    /** The crop, as it changes. */
    'update:modelValue': [value: CropValue];
    /** The image has loaded and its natural size is known. */
    load: [event: { width: number; height: number }];
    /** A drag of the crop or a handle has finished. */
    change: [value: CropValue];
};

export interface CropperSlots {
    /** Replaces the toolbar. */
    toolbar?: (props: { value: CropValue; reset: () => void }) => unknown;
    /** Beside the preview, or in place of it. */
    preview?: (props: { value: CropValue }) => unknown;
}

export interface CropOutputOptions {
    /** The output's width in pixels; the height follows the crop's ratio unless given. */
    width?: number;
    height?: number;
    /** Fills behind the image, for a format with no transparency. */
    background?: string;
}
