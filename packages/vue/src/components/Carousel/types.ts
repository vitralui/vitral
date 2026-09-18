import type { TransitionPreset } from '@vitral/styles';
import type { BaseProps } from '../../base/types';

export interface CarouselResponsiveOption {
    /** Applies at this width and below, as a CSS length: `'768px'`. */
    breakpoint: string;
    numVisible: number;
    numScroll: number;
}

export interface CarouselProps extends BaseProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value?: any[];
    /** Items shown at once. Defaults to 1. */
    numVisible?: number;
    /** Items moved per step. Defaults to 1. */
    numScroll?: number;
    /** Fewer items on smaller screens. */
    responsiveOptions?: CarouselResponsiveOption[];
    orientation?: 'horizontal' | 'vertical';
    /** The viewport's height when vertical. Defaults to `'20rem'`. */
    verticalViewPortHeight?: string;
    /** Wrap from the last page to the first. */
    /**
     * Wrap round: the last item is followed by the first. On by default —
     * a gallery that stops dead at the end sends the reader back through
     * everything they have just seen to reach the other end of it.
     */
    circular?: boolean;
    /** Milliseconds between automatic steps; 0 (the default) turns it off. */
    autoplayInterval?: number;
    /** Defaults to true. */
    showNavigators?: boolean;
    /** Defaults to true. */
    showIndicators?: boolean;
    /** Names the carousel. */
    ariaLabel?: string;
    /**
     * How one slide gives way to the next. The default `'slide'` moves the
     * whole strip, which is what lets a carousel show several at once; every
     * other preset shows one at a time and animates it in place, so it applies
     * only where `numVisible` is 1.
     */
    transition?: TransitionPreset | 'slide';
}

export type CarouselEmits = {
    'update:page': [page: number];
};

export interface CarouselSlots {
    item?: (props: { data: unknown; index: number }) => unknown;
    header?: () => unknown;
    footer?: () => unknown;
    empty?: () => unknown;
}
