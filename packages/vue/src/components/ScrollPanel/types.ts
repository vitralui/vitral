import type { BaseProps, ScrollbarProps } from '../../base/types';

/**
 * Size the panel with `style` or a class (a `max-height` alone is enough);
 * name it with `aria-label`.
 */
export interface ScrollPanelProps extends BaseProps, ScrollbarProps {
    /**
     * Arrows at the ends of the bars, as a native bar has: a press scrolls a
     * step and holding it keeps scrolling. The application's
     * `scrollbarArrows` by default, which is off.
     */
    arrows?: boolean;
}

export interface ScrollPanelSlots {
    default?: () => unknown;
}
