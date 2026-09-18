import type { BaseProps } from '../../base/types';
import type { MenuItem } from '../Menu/types';

export interface DockProps extends BaseProps {
    /** The items; each item's `label` names it and shows as a tooltip. */
    model?: MenuItem[];
    /** The edge it sits on. Defaults to `'bottom'`. */
    position?: 'bottom' | 'top' | 'left' | 'right';
    /** Grow the items under the pointer. Defaults to true. */
    magnification?: boolean;
    /** Names the dock. */
    ariaLabel?: string;
    ariaLabelledby?: string;
}

export interface DockSlots {
    /** An item's content — an icon or an image. */
    item?: (props: { item: MenuItem; index: number }) => unknown;
}
