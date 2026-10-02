import type { BaseProps, ScrollbarProps } from '../../base/types';

/**
 * Size the panel with `style` or a class (a `max-height` alone is enough);
 * name it with `aria-label`.
 */
export interface ScrollPanelProps extends BaseProps, ScrollbarProps {}

export interface ScrollPanelSlots {
    default?: () => unknown;
}
