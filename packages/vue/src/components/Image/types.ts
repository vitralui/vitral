import type { BaseProps } from '../../base/types';

export interface ImageProps extends BaseProps {
    src?: string;
    /** The image's text alternative. It also names the preview. */
    alt?: string;
    width?: string | number;
    height?: string | number;
    /** Open a viewer with zoom and rotation when the image is pressed. */
    preview?: boolean;
    /** A larger image for the viewer. Defaults to `src`. */
    previewSrc?: string;
    /** How much each zoom step changes the scale. Defaults to 0.25. */
    zoomStep?: number;
    /** Defaults to 0.5. */
    minZoom?: number;
    /** Defaults to 3. */
    maxZoom?: number;
}

export type ImageEmits = {
    show: [];
    hide: [];
    error: [event: Event];
};

export interface ImageSlots {
    /** Replaces the image, e.g. with a <picture>. */
    image?: (props: { errorCallback: (event: Event) => void }) => unknown;
    /** Replaces the image in the viewer. */
    preview?: (props: { style: Record<string, string>; previewCallback: () => void }) => unknown;
    /** Replaces the hover indicator. */
    indicator?: () => unknown;
}
