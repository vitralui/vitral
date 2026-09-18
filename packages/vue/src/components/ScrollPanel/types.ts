import type { BaseProps } from '../../base/types';

/** Size the panel with `style` or a class; name it with `aria-label`. */
export type ScrollPanelProps = BaseProps;

export interface ScrollPanelSlots {
    default?: () => unknown;
}
