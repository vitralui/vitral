import type { BaseProps } from '../../base/types';

export interface GalleriaProps extends BaseProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value?: any[];
    /** Thumbnails shown at once. Defaults to 3. */
    numVisible?: number;
    /** Show in a modal over the page, opened with `v-model:visible`. */
    fullScreen?: boolean;
    /** Defaults to true. */
    showThumbnails?: boolean;
    thumbnailsPosition?: 'bottom' | 'top' | 'left' | 'right';
    /** Previous and next buttons on the item. */
    showItemNavigators?: boolean;
    /** Previous and next buttons beside the thumbnails. Defaults to true. */
    showThumbnailNavigators?: boolean;
    /** Dots under the item. */
    showIndicators?: boolean;
    /** Wrap from the last item to the first. */
    circular?: boolean;
    /** Rotate through the items; a pause button comes with it. */
    autoPlay?: boolean;
    /** Milliseconds between items when playing. Defaults to 4000. */
    transitionInterval?: number;
    /** Names the gallery. */
    ariaLabel?: string;
}

export type GalleriaEmits = {
    'update:activeIndex': [index: number];
    'update:visible': [visible: boolean];
};

export interface GalleriaSlots {
    item?: (props: { item: unknown; index: number }) => unknown;
    thumbnail?: (props: { item: unknown; index: number }) => unknown;
    caption?: (props: { item: unknown; index: number }) => unknown;
    indicator?: (props: { index: number; active: boolean }) => unknown;
    header?: () => unknown;
    footer?: () => unknown;
}
